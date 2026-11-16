import assert from 'node:assert/strict';
import test from 'node:test';
import { registerTypeScriptPaths } from './helpers/register-typescript.mjs';

const paths = registerTypeScriptPaths();
const { createRestaurantSync, initialRestaurantState } = await import('../src/state/restaurant-sync.ts');
paths.deregister();

const session = (id = 'admin-a', token = 'token-a') => ({ user: { id }, access_token: token });
const empty = () => ({ tables: [], shifts: [], reservations: [], dishes: [] });
const catalog = (id) => ({ ...empty(), tables: [{ id, name: id, zone: 'Salón', capacity: 4, status: 'disponible' }] });
const privateData = () => ({ ...catalog('privada'), reservations: [{ id: 'reserva-privada', name: 'Cliente privado' }] });
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((accept, fail) => { resolve = accept; reject = fail; });
  return { promise, resolve, reject };
};
const authorizedState = () => ({
  ...initialRestaurantState(), session: session(), data: privateData(),
  isAdmin: true, loading: false, authLoading: false,
});
function setup(overrides = {}, initial = initialRestaurantState()) {
  const changes = [];
  const sync = createRestaurantSync({
    verifySession: async () => true,
    loadRestaurant: async () => catalog('actualizada'),
    errorMessage: (cause) => cause.message ?? 'Error desconocido',
    onChange: (state) => changes.push(state),
    ...overrides,
  }, initial);
  return { sync, changes };
}

test('sin configuración no queda cargando; el estado inicial nunca contiene permisos ni datos privados', () => {
  const state = initialRestaurantState('Falta configuración');
  assert.equal(state.error, 'Falta configuración');
  assert.equal(state.loading, false);
  assert.equal(state.authLoading, false);
  assert.equal(state.isAdmin, false);
  assert.equal(state.session, null);
  assert.deepEqual(state.data, empty());
});

test('refresh público no verifica sesión ni solicita reservas administrativas y termina ambas cargas', async () => {
  const requests = [];
  const { sync } = setup({
    verifySession: async () => assert.fail('No debe verificar una sesión inexistente'),
    loadRestaurant: async (admin) => { requests.push(admin); return catalog('pública'); },
  });
  await sync.refresh();
  assert.deepEqual(requests, [false]);
  assert.equal(sync.getSnapshot().loading, false);
  assert.equal(sync.getSnapshot().authLoading, false);
  assert.equal(sync.getSnapshot().isAdmin, false);
});

test('actualizar el catálogo público conserva mesas y jornadas durante la carga y ante un fallo de conexión', async () => {
  const result = deferred();
  const initial = {
    ...initialRestaurantState(), data: {
      ...catalog('mesa-pública'),
      shifts: [{ id: 'jornada-pública', name: 'Cena', day: 1, start: '18:00', end: '22:00', duration: 60, enabled: true }],
    }, loading: false, authLoading: false,
  };
  const { sync } = setup({ loadRestaurant: (admin) => {
    assert.equal(admin, false);
    return result.promise;
  } }, initial);
  const refresh = sync.refresh();
  assert.equal(sync.getSnapshot().loading, true);
  assert.equal(sync.getSnapshot().authLoading, false);
  assert.equal(sync.getSnapshot().isAdmin, false);
  assert.deepEqual(sync.getSnapshot().data, initial.data);
  result.reject(new Error('Catálogo sin conexión'));
  await refresh;
  assert.equal(sync.getSnapshot().loading, false);
  assert.equal(sync.getSnapshot().authLoading, false);
  assert.equal(sync.getSnapshot().error, 'Catálogo sin conexión');
  assert.deepEqual(sync.getSnapshot().data, initial.data);
});

test('iniciar sesión mantiene acceso bloqueado hasta verificar permisos reales', async () => {
  const permission = deferred();
  const { sync } = setup({ verifySession: () => permission.promise });
  sync.setSession(session());
  const refresh = sync.refresh();
  assert.equal(sync.getSnapshot().authLoading, true);
  assert.equal(sync.getSnapshot().isAdmin, false);
  permission.resolve(true);
  await refresh;
  assert.equal(sync.getSnapshot().isAdmin, true);
  assert.equal(sync.getSnapshot().authLoading, false);
  assert.equal(sync.getSnapshot().loading, false);
});

test('renovar el token del mismo usuario conserva formularios y datos mientras revalida permisos', async () => {
  const permission = deferred();
  const verifiedTokens = [];
  const initial = authorizedState();
  const { sync, changes } = setup({ verifySession: (candidate) => {
    verifiedTokens.push(candidate.access_token);
    return permission.promise;
  } }, initial);
  sync.setSession(session('admin-a', 'token-renovado'));
  const refresh = sync.refresh();
  assert.equal(sync.getSnapshot().isAdmin, true);
  assert.equal(sync.getSnapshot().authLoading, false);
  assert.deepEqual(sync.getSnapshot().data, initial.data);
  permission.resolve(true);
  await refresh;
  assert.deepEqual(verifiedTokens, ['token-renovado']);
  assert.ok(changes.every((state) => state.isAdmin && !state.authLoading));
});

test('refresh que reemplaza una validación inicial finaliza authLoading sin depender de la respuesta anterior', async () => {
  const oldPermission = deferred();
  let calls = 0;
  const { sync } = setup({ verifySession: () => ++calls === 1 ? oldPermission.promise : Promise.resolve(true) });
  sync.setSession(session());
  const first = sync.refresh();
  const second = sync.refresh();
  await second;
  assert.equal(sync.getSnapshot().isAdmin, true);
  assert.equal(sync.getSnapshot().authLoading, false);
  assert.equal(sync.getSnapshot().loading, false);
  const current = sync.getSnapshot();
  oldPermission.resolve(false);
  await first;
  assert.deepEqual(sync.getSnapshot(), current);
});

test('cerrar sesión borra datos privados inmediatamente y descarta una consulta administrativa pendiente', async () => {
  const result = deferred();
  const started = deferred();
  const { sync } = setup({ loadRestaurant: async () => { started.resolve(); return result.promise; } }, authorizedState());
  const refresh = sync.refresh();
  await started.promise;
  sync.setSession(null);
  assert.equal(sync.getSnapshot().isAdmin, false);
  assert.equal(sync.getSnapshot().session, null);
  assert.deepEqual(sync.getSnapshot().data, empty());
  result.resolve(privateData());
  await refresh;
  assert.equal(sync.getSnapshot().isAdmin, false);
  assert.deepEqual(sync.getSnapshot().data, empty());
});

test('cambiar de usuario invalida permisos pendientes del usuario anterior', async () => {
  const permission = deferred();
  const loads = [];
  const { sync } = setup({
    verifySession: () => permission.promise,
    loadRestaurant: async (admin) => { loads.push(admin); return privateData(); },
  }, authorizedState());
  const refresh = sync.refresh();
  sync.setSession(session('usuario-b', 'token-b'));
  assert.equal(sync.getSnapshot().authLoading, true);
  assert.equal(sync.getSnapshot().isAdmin, false);
  assert.deepEqual(sync.getSnapshot().data, empty());
  permission.resolve(true);
  await refresh;
  assert.equal(sync.getSnapshot().session.user.id, 'usuario-b');
  assert.equal(sync.getSnapshot().isAdmin, false);
  assert.deepEqual(loads, []);
});

test('el finally de un refresh obsoleto no termina la carga del refresh más reciente', async () => {
  const firstResult = deferred();
  const secondResult = deferred();
  const firstStarted = deferred();
  const secondStarted = deferred();
  let calls = 0;
  const { sync } = setup({ loadRestaurant: () => {
    if (++calls === 1) { firstStarted.resolve(); return firstResult.promise; }
    secondStarted.resolve(); return secondResult.promise;
  } }, authorizedState());
  const first = sync.refresh();
  await firstStarted.promise;
  const second = sync.refresh();
  await secondStarted.promise;
  firstResult.resolve(catalog('obsoleta'));
  await first;
  assert.equal(sync.getSnapshot().loading, true);
  assert.notEqual(sync.getSnapshot().data.tables[0]?.id, 'obsoleta');
  secondResult.resolve(catalog('reciente'));
  await second;
  assert.equal(sync.getSnapshot().loading, false);
  assert.equal(sync.getSnapshot().data.tables[0].id, 'reciente');
});

for (const failure of ['denegado', 'error de verificación']) {
  test(`permiso ${failure}: revoca y limpia datos privados antes de cargar el catálogo público`, async () => {
    const publicResult = deferred();
    const publicStarted = deferred();
    const { sync } = setup({
      verifySession: async () => { if (failure !== 'denegado') throw new Error(failure); return false; },
      loadRestaurant: (admin) => { assert.equal(admin, false); publicStarted.resolve(); return publicResult.promise; },
    }, authorizedState());
    const refresh = sync.refresh();
    await publicStarted.promise;
    assert.equal(sync.getSnapshot().isAdmin, false);
    assert.deepEqual(sync.getSnapshot().data, empty());
    assert.ok(sync.getSnapshot().authError);
    publicResult.resolve(catalog('pública'));
    await refresh;
    assert.equal(sync.getSnapshot().isAdmin, false);
    assert.equal(sync.getSnapshot().loading, false);
    assert.equal(sync.getSnapshot().authLoading, false);
    assert.equal(sync.getSnapshot().data.reservations.length, 0);
  });
}

test('un fallo de catálogo posterior a permisos válidos conserva sesión y formularios y muestra el error', async () => {
  const initial = authorizedState();
  const { sync } = setup({ loadRestaurant: async () => { throw new Error('Catálogo sin conexión'); } }, initial);
  await sync.refresh();
  const state = sync.getSnapshot();
  assert.equal(state.isAdmin, true);
  assert.equal(state.authLoading, false);
  assert.equal(state.loading, false);
  assert.equal(state.error, 'Catálogo sin conexión');
  assert.deepEqual(state.data, initial.data);
});

test('deactivate descarta respuestas tardías y activate permite una sincronización nueva', async () => {
  const oldResult = deferred();
  const started = deferred();
  let calls = 0;
  const { sync, changes } = setup({ loadRestaurant: () => {
    if (++calls === 1) { started.resolve(); return oldResult.promise; }
    return Promise.resolve(catalog('reactivada'));
  } });
  const first = sync.refresh();
  await started.promise;
  sync.deactivate();
  const count = changes.length;
  oldResult.resolve(catalog('desmontada'));
  await first;
  assert.equal(changes.length, count);
  sync.activate();
  await sync.refresh();
  assert.equal(sync.getSnapshot().data.tables[0].id, 'reactivada');
  assert.equal(sync.getSnapshot().loading, false);
});

test('reportError muestra un error sin conceder permisos ni perder datos de la sesión', () => {
  const initial = authorizedState();
  const { sync } = setup({}, initial);
  sync.reportError(new Error('No se pudo actualizar el listado'));
  assert.equal(sync.getSnapshot().error, 'No se pudo actualizar el listado');
  assert.equal(sync.getSnapshot().isAdmin, true);
  assert.deepEqual(sync.getSnapshot().data, initial.data);
});
