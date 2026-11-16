import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test, { after } from 'node:test';
import { registerTypeScriptPaths } from './helpers/register-typescript.mjs';

// Evita inicializar el cliente real o leer variables de entorno. El servicio y su
// conversión de errores se importan sin sustituir su implementación.
const clientKey = Symbol.for('konys.reservation-test-client');
const paths = registerTypeScriptPaths();
const mockClientModule = `data:text/javascript,${encodeURIComponent("export const requireSupabase = () => globalThis[Symbol.for('konys.reservation-test-client')];")}`;
const clientHook = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === '@/lib/supabase' ? mockClientModule : specifier, context);
  },
});
const { createReservationAction } = await import('../src/services/create-reservation.ts');
const { createRestaurantSync } = await import('../src/state/restaurant-sync.ts');
const { errorMessage, fetchOccupancy } = await import('../src/services/restaurant.ts');
clientHook.deregister();
paths.deregister();
after(() => { delete globalThis[clientKey]; });

const now = new Date('2026-11-16T16:30:00Z'); // Lunes, 11:30 en Colombia.
const reservationId = '06c73dab-f970-4ff1-97a1-0194d2d01741';
const input = (patch = {}) => ({ tableId: 'mesa', date: '2026-11-16', time: '12:00', shiftId: 'almuerzo', name: '  Ana Pérez  ', people: 2, contact: '  3001234567  ', ...patch });

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function restaurantData() {
  return {
    tables: [{ id: 'mesa', name: 'Mesa 1', zone: 'Salón', capacity: 4, status: 'disponible' }],
    shifts: [{ id: 'almuerzo', name: 'Almuerzo', day: 1, start: '12:00', end: '16:00', duration: 60, enabled: true }],
    reservations: [], dishes: [],
  };
}

function setup(options = {}) {
  const data = restaurantData();
  const calls = [], confirmations = [], refreshErrors = [];
  let refreshes = 0;
  const client = {
    rpc(name, args) {
      calls.push({ name, args });
      if (name === 'consultar_ocupacion') return options.occupancy?.() ?? Promise.resolve({ data: [], error: null });
      assert.equal(name, 'crear_reserva');
      return options.reserve?.() ?? Promise.resolve({ data: reservationId, error: null });
    },
  };
  globalThis[clientKey] = client;
  const create = createReservationAction({
    getData: () => data,
    fetchOccupancy,
    reserve: (args) => client.rpc('crear_reserva', args),
    confirm: (reservation) => confirmations.push(reservation),
    refresh: async () => {
      refreshes += 1;
      await options.refresh?.(data, confirmations);
    },
    onRefreshError: (cause) => refreshErrors.push(cause),
    errorMessage,
    now: options.now ?? (() => now),
  });
  return { create, data, calls, confirmations, refreshErrors, get refreshes() { return refreshes; } };
}

test('producción: consulta ocupación, envía los argumentos RPC existentes y confirma con datos normalizados', async () => {
  const state = setup();
  assert.deepEqual(await state.create(input()), { ok: true, id: reservationId });
  assert.deepEqual(state.calls, [
    { name: 'consultar_ocupacion', args: { p_mesa_id: 'mesa', p_fecha: '2026-11-16' } },
    { name: 'crear_reserva', args: { p_mesa_id: 'mesa', p_cliente_nombre: 'Ana Pérez', p_num_personas: 2, p_fecha: '2026-11-16', p_hora_inicio: '12:00', p_cliente_contacto: '3001234567' } },
  ]);
  assert.deepEqual(state.confirmations, [{ ...input(), id: reservationId, name: 'Ana Pérez', contact: '3001234567', duration: 60, status: 'confirmada' }]);
  assert.equal(state.refreshes, 1);
});

test('producción: contacto opcional se envía como null y acepta la capacidad exacta', async () => {
  const state = setup();
  assert.equal((await state.create(input({ contact: '   ', people: 4 }))).ok, true);
  assert.equal(state.calls[1].args.p_cliente_contacto, null);
  assert.equal(state.confirmations[0].contact, '');
});

test('producción: capacidad, enteros, nombre y contacto inválidos se rechazan antes de consultar', async () => {
  for (const patch of [{ people: 5 }, { people: 0 }, { people: -1 }, { people: 1.5 }, { people: NaN }, { name: ' ' }, { name: 'A' }, { name: 'A'.repeat(81) }, { contact: '1'.repeat(101) }]) {
    const state = setup();
    const result = await state.create(input(patch));
    assert.equal(result.ok, false, JSON.stringify(patch));
    assert.match(result.error, /nombre, el contacto y la capacidad/);
    assert.deepEqual(state.calls, []);
    assert.deepEqual(state.confirmations, []);
  }
});

test('producción: fecha pasada o inválida y selección inexistente no llegan a las RPC', async () => {
  for (const patch of [{ date: '2026-11-15' }, { date: '2026-02-30' }, { date: '16/11/2026' }, { tableId: 'desconocida' }, { shiftId: 'desconocida' }]) {
    const state = setup();
    assert.equal((await state.create(input(patch))).ok, false, JSON.stringify(patch));
    assert.deepEqual(state.calls, []);
  }
  const state = setup();
  state.data.tables[0].status = 'mantenimiento';
  assert.equal((await state.create(input())).ok, false);
  assert.deepEqual(state.calls, []);
});

test('producción: jornada deshabilitada, día equivocado y duración inválida no crean reservas', async () => {
  for (const patch of [{ enabled: false }, { day: 2 }, { duration: 0 }, { duration: 600 }, { start: '18:00', end: '12:00' }]) {
    const state = setup();
    Object.assign(state.data.shifts[0], patch);
    const result = await state.create(input());
    assert.equal(result.ok, false, JSON.stringify(patch));
    assert.match(result.error, /horario ya no está disponible/);
    assert.equal(state.calls.length, 1);
    assert.equal(state.calls[0].name, 'consultar_ocupacion');
  }
});

test('producción: solo acepta un slot futuro completo de la jornada', async () => {
  for (const time of ['11:00', '12:10', '16:00', '25:00']) {
    const state = setup();
    assert.equal((await state.create(input({ time }))).ok, false, time);
    assert.equal(state.calls.length, 1);
  }
  const state = setup({ now: () => new Date('2026-11-16T17:00:00Z') });
  assert.equal((await state.create(input())).ok, false); // El slot comenzó justo ahora.
  assert.equal(state.calls.length, 1);
});

test('producción: revalida el reloj después de esperar la ocupación', async () => {
  let current = now;
  const state = setup({
    now: () => current,
    occupancy: async () => {
      current = new Date('2026-11-16T17:00:00Z');
      return { data: [], error: null };
    },
  });
  assert.equal((await state.create(input())).ok, false);
  assert.equal(state.calls.length, 1);
});

test('producción: una ocupación que se solapa impide enviar crear_reserva', async () => {
  const state = setup({ occupancy: async () => ({ data: [{ hora_inicio: '12:30:00', hora_fin: '13:30:00' }], error: null }) });
  const result = await state.create(input());
  assert.equal(result.ok, false);
  assert.match(result.error, /horario ya no está disponible/);
  assert.equal(state.calls.length, 1);
  assert.equal(state.refreshes, 0);
});

test('producción: una ocupación contigua permite reservar', async () => {
  const state = setup({ occupancy: async () => ({ data: [{ hora_inicio: '13:00:00', hora_fin: '14:00:00' }], error: null }) });
  assert.equal((await state.create(input())).ok, true);
  assert.equal(state.calls.length, 2);
});

test('producción: respuesta de ocupación inválida falla sin inventar disponibilidad', async () => {
  for (const data of [null, {}, [{ hora_inicio: '12:00' }], [{ hora_inicio: '12:00:01', hora_fin: '13:00' }]]) {
    const state = setup({ occupancy: async () => ({ data, error: null }) });
    const result = await state.create(input());
    assert.equal(result.ok, false);
    assert.equal(state.calls.length, 1);
    assert.deepEqual(state.confirmations, []);
  }
});

test('producción: un fallo de consulta muestra error de conexión sin intentar reservar', async () => {
  const state = setup({ occupancy: async () => { throw new Error('Failed to fetch'); } });
  const result = await state.create(input());
  assert.equal(result.ok, false);
  assert.match(result.error, /No pudimos conectar/);
  assert.doesNotMatch(result.error, /podría haberse registrado/);
  assert.equal(state.calls.length, 1);
});

test('producción: denegación de permiso o RPC faltante se comunica sin crear reservas', async () => {
  for (const [code, expected] of [['42501', /no tiene permiso/], ['PGRST202', /Falta una función requerida/]]) {
    const state = setup({ occupancy: async () => ({ data: null, error: { code } }) });
    const result = await state.create(input());
    assert.equal(result.ok, false);
    assert.match(result.error, expected);
    assert.equal(state.calls.length, 1);
  }
});

test('producción: conflicto detectado por el servidor después de consultar no confirma ni reintenta', async () => {
  for (const code of ['23505', '23P01']) {
    const state = setup({ reserve: async () => ({ data: null, error: { code } }) });
    const result = await state.create(input());
    assert.equal(result.ok, false);
    assert.match(result.error, /horario acaba de ser reservado/);
    assert.deepEqual(state.confirmations, []);
    assert.equal(state.calls.length, 2);
    assert.equal(state.refreshes, 0);
  }
});

test('producción: respuesta de red incierta al crear avisa sobre posible reserva registrada', async () => {
  for (const reserve of [async () => { throw new Error('network timeout'); }, async () => ({ data: null, error: { message: 'Failed to fetch' } })]) {
    const state = setup({ reserve });
    const result = await state.create(input());
    assert.equal(result.ok, false);
    assert.match(result.error, /podría haberse registrado/);
    assert.equal(state.calls.filter((call) => call.name === 'crear_reserva').length, 1);
    assert.deepEqual(state.confirmations, []);
  }
});

test('producción: una referencia inválida no produce una confirmación falsa', async () => {
  for (const data of [null, [], 'no-uuid', '-'.repeat(36)]) {
    const state = setup({ reserve: async () => ({ data, error: null }) });
    const result = await state.create(input());
    assert.equal(result.ok, false);
    assert.match(result.error, /referencia de reserva válida/);
    assert.deepEqual(state.confirmations, []);
    assert.equal(state.refreshes, 0);
  }
});

test('producción: si falla refresh después de crear, conserva éxito y no duplica la reserva', async () => {
  const failure = new Error('network refresh');
  const state = setup({ refresh: async () => { throw failure; } });
  assert.deepEqual(await state.create(input()), { ok: true, id: reservationId });
  assert.equal(state.confirmations.length, 1);
  assert.deepEqual(state.refreshErrors, [failure]);
  assert.equal(state.calls.filter((call) => call.name === 'crear_reserva').length, 1);
});

test('producción: bloquea doble envío durante RPC y libera el bloqueo después de un error', async () => {
  const pending = deferred();
  let attempts = 0;
  const state = setup({ reserve: () => ++attempts === 1 ? pending.promise : Promise.resolve({ data: reservationId, error: null }) });
  const first = state.create(input());
  // Permite que la primera consulta de ocupación termine y comience crear_reserva.
  await new Promise((resolve) => setImmediate(resolve));
  const duplicate = await state.create(input());
  assert.equal(duplicate.ok, false);
  assert.match(duplicate.error, /se está enviando/);
  assert.equal(attempts, 1);
  pending.resolve({ data: null, error: { code: '23P01' } });
  assert.equal((await first).ok, false);
  assert.equal((await state.create(input())).ok, true);
  assert.equal(attempts, 2);
});

test('producción: el bloqueo de envío sigue activo hasta terminar refresh', async () => {
  const pending = deferred();
  const state = setup({ refresh: () => pending.promise });
  const first = state.create(input());
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(state.confirmations.length, 1);
  assert.equal((await state.create(input())).ok, false);
  pending.resolve();
  assert.equal((await first).ok, true);
  assert.equal(state.calls.filter((call) => call.name === 'crear_reserva').length, 1);
});

test('producción: fetchOccupancy conserva el AbortSignal y no cambia los argumentos de consulta', async () => {
  const controller = new AbortController();
  let capturedSignal;
  globalThis[clientKey] = {
    rpc(name, args) {
      assert.equal(name, 'consultar_ocupacion');
      assert.deepEqual(args, { p_mesa_id: 'mesa', p_fecha: '2026-11-16' });
      return { abortSignal(signal) { capturedSignal = signal; return Promise.resolve({ data: [{ hora_inicio: '12:00:00', hora_fin: '13:00:00' }], error: null }); } };
    },
  };
  assert.deepEqual(await fetchOccupancy('mesa', '2026-11-16', controller.signal), [{ hora_inicio: '12:00', hora_fin: '13:00' }]);
  assert.equal(capturedSignal, controller.signal);
});

function synchronizedSetup() {
  const catalog = restaurantData();
  const loads = [], verifications = [], confirmations = [], writes = [];
  let load = async () => catalog;
  const synchronization = createRestaurantSync({
    verifySession: async (session) => { verifications.push(session.user.id); return true; },
    loadRestaurant: async (admin) => { loads.push(admin); return load(admin); },
    onChange: () => {},
    errorMessage,
  });
  globalThis[clientKey] = {
    rpc(name, args) {
      if (name === 'consultar_ocupacion') return Promise.resolve({ data: [], error: null });
      assert.equal(name, 'crear_reserva');
      writes.push(args);
      return Promise.resolve({ data: reservationId, error: null });
    },
  };
  // Las mismas conexiones entre ambos módulos de producción que usa el provider.
  const create = createReservationAction({
    getData: () => synchronization.getSnapshot().data,
    fetchOccupancy,
    reserve: (args) => globalThis[clientKey].rpc('crear_reserva', args),
    confirm: (reservation) => confirmations.push(reservation),
    refresh: synchronization.refresh,
    onRefreshError: synchronization.reportError,
    errorMessage,
    now: () => now,
  });
  return { synchronization, create, catalog, loads, verifications, confirmations, writes,
    setLoad: (next) => { load = next; } };
}

test('regresión integrada: crear reserva actualiza lista y conteo admin sin aceptar una respuesta anterior', async () => {
  const state = synchronizedSetup();
  state.synchronization.setSession({ user: { id: 'admin' }, access_token: 'token-simulado' });
  await state.synchronization.refresh();
  assert.equal(state.synchronization.getSnapshot().isAdmin, true);
  assert.equal(state.synchronization.getSnapshot().data.reservations.length, 0);

  const stale = deferred(), started = deferred();
  state.setLoad(async () => { started.resolve(); return stale.promise; });
  const previousRefresh = state.synchronization.refresh();
  await started.promise;

  // Simula la siguiente consulta de datos ya persistidos, independiente del recibo local.
  const serverReservation = { ...input(), id: reservationId, name: 'Nombre del servidor', contact: '3001234567', duration: 60, status: 'confirmada', shiftId: '' };
  state.setLoad(async () => ({ ...state.catalog, reservations: [serverReservation] }));
  assert.deepEqual(await state.create(input()), { ok: true, id: reservationId });
  assert.deepEqual(state.loads, [true, true, true]);
  assert.deepEqual(state.verifications, ['admin', 'admin', 'admin']);
  assert.equal(state.confirmations[0].name, 'Ana Pérez');
  assert.deepEqual(state.synchronization.getSnapshot().data.reservations, [serverReservation]);
  assert.equal(state.synchronization.getSnapshot().data.reservations.length, 1);
  assert.equal(state.writes.length, 1);

  stale.resolve({ ...state.catalog, reservations: [] });
  await previousRefresh;
  const snapshot = state.synchronization.getSnapshot();
  assert.deepEqual(snapshot.data.reservations, [serverReservation]);
  assert.equal(snapshot.loading, false);
  assert.equal(snapshot.authLoading, false);
  assert.equal(snapshot.isAdmin, true);
});

test('regresión integrada: después de reservar sin sesión solo se solicita el catálogo público', async () => {
  const state = synchronizedSetup();
  state.synchronization.setSession(null);
  await state.synchronization.refresh();
  assert.equal((await state.create(input())).ok, true);
  assert.deepEqual(state.loads, [false, false]);
  assert.deepEqual(state.verifications, []);
  assert.equal(state.writes.length, 1);
  assert.equal(state.confirmations.length, 1);
  assert.equal(state.synchronization.getSnapshot().isAdmin, false);
  assert.deepEqual(state.synchronization.getSnapshot().data.reservations, []);
});

test('regresión integrada: error al recargar conserva confirmación y éxito, y publica el error de sincronización', async () => {
  const state = synchronizedSetup();
  state.synchronization.setSession({ user: { id: 'admin' }, access_token: 'token-simulado' });
  await state.synchronization.refresh();
  state.setLoad(async () => { throw new Error('Failed to fetch'); });
  assert.deepEqual(await state.create(input()), { ok: true, id: reservationId });
  assert.equal(state.confirmations.length, 1);
  assert.equal(state.confirmations[0].id, reservationId);
  assert.equal(state.writes.length, 1);
  const snapshot = state.synchronization.getSnapshot();
  assert.match(snapshot.error, /No pudimos conectar/);
  assert.equal(snapshot.isAdmin, true);
  assert.equal(snapshot.loading, false);
  assert.equal(snapshot.authLoading, false);
});
