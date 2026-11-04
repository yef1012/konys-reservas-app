import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { configurationError, requireSupabase, supabase } from '@/lib/supabase';
import { errorMessage, fetchOccupancy, loadRestaurant } from '@/services/restaurant';
import type { Dish, Reservation, ReservationInput, ReservationResult, ReservationStatus, RestaurantData, Result, Shift, Table, TableStatus } from '@/types/restaurant';
import { availableTimes, isoDay } from '@/utils/availability';
import { isValidDate, timeToMinutes, todayISO } from '@/utils/reservations';

interface RestaurantStore extends RestaurantData {
  loading: boolean; error: string; refresh: () => Promise<void>;
  session: Session | null; isAdmin: boolean; authLoading: boolean; authError: string;
  confirmation: Reservation | null;
  login: (email: string, password: string) => Promise<Result>;
  logout: () => Promise<Result>;
  addTable: (input: Omit<Table, 'id'>) => Promise<Result>;
  updateTableStatus: (id: string, status: TableStatus) => Promise<Result>;
  saveShift: (input: Shift) => Promise<Result>;
  saveDish: (input: Omit<Dish, 'id'> & { id?: string }) => Promise<Result>;
  toggleDish: (id: string) => Promise<Result>;
  createReservation: (input: ReservationInput) => Promise<ReservationResult>;
  updateReservationStatus: (id: string, status: ReservationStatus) => Promise<Result>;
}
const empty: RestaurantData = { tables: [], shifts: [], reservations: [], dishes: [] };
const Context = createContext<RestaurantStore | null>(null);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RestaurantData>(empty);
  const [loading, setLoading] = useState(!configurationError);
  const [error, setError] = useState(configurationError);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(!configurationError);
  const [authError, setAuthError] = useState('');
  const [confirmation, setConfirmation] = useState<Reservation | null>(null);
  const latest = useRef(data);
  const access = useRef<{ session: Session | null; admin: boolean }>({ session: null, admin: false });
  const epoch = useRef(0);
  const mounted = useRef(true);
  const booking = useRef(false);

  const synchronize = useCallback(async (candidate: Session | null) => {
    const current = ++epoch.current;
    access.current = { session: candidate, admin: false };
    setSession(candidate); setIsAdmin(false); setAuthLoading(true); setAuthError(''); setLoading(true);
    // Nunca mantener datos privados de una sesión anterior mientras se valida la nueva.
    latest.current = empty; setData(empty);
    let authorized = false;
    try {
      const client = requireSupabase();
      if (candidate) {
        try {
          const user = await client.auth.getUser(candidate.access_token);
          if (user.error || !user.data.user) throw user.error ?? new Error('La sesión ya no es válida.');
          const permission = await client.rpc('verificar_acceso_admin');
          if (permission.error) throw permission.error;
          authorized = permission.data === true;
          if (!authorized) throw new Error('Esta cuenta no tiene permisos de administrador.');
        } catch (cause) {
          if (current === epoch.current && mounted.current) setAuthError(errorMessage(cause));
        }
      }
      const next = await loadRestaurant(authorized);
      if (current !== epoch.current || !mounted.current) return;
      access.current = { session: candidate, admin: authorized };
      latest.current = next; setData(next); setIsAdmin(authorized); setError('');
    } catch (cause) {
      if (current === epoch.current && mounted.current) setError(errorMessage(cause));
    } finally {
      if (current === epoch.current && mounted.current) { setAuthLoading(false); setLoading(false); }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (!supabase) return;
    const client = supabase;
    // No ejecutar consultas async dentro del callback de Auth: se evita bloquear su lock.
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const { data: listener } = client.auth.onAuthStateChange((_event, next) => {
      timers.forEach(clearTimeout); timers.clear();
      ++epoch.current;
      access.current = { session: next, admin: false };
      setIsAdmin(false); setAuthLoading(true); setSession(next);
      latest.current = empty; setData(empty);
      const timer = setTimeout(() => { timers.delete(timer); if (mounted.current) void synchronize(next); }, 0);
      timers.add(timer);
    });
    const appState = AppState.addEventListener('change', (state) => {
      if (Platform.OS !== 'web') {
        if (state === 'active') client.auth.startAutoRefresh();
        else client.auth.stopAutoRefresh();
      }
    });
    if (Platform.OS !== 'web' && AppState.currentState === 'active') client.auth.startAutoRefresh();
    return () => {
      mounted.current = false;
      listener.subscription.unsubscribe(); appState.remove(); timers.forEach(clearTimeout);
      if (Platform.OS !== 'web') client.auth.stopAutoRefresh();
    };
  }, [synchronize]);

  const refresh = useCallback(async () => {
    const current = ++epoch.current;
    const candidate = access.current.session;
    let authorized = false;
    setLoading(true);
    try {
      if (candidate) {
        const permission = await requireSupabase().rpc('verificar_acceso_admin');
        if (permission.error) throw permission.error;
        authorized = permission.data === true;
      }
      if (current !== epoch.current || !mounted.current) return;
      if (!authorized) { setIsAdmin(false); access.current.admin = false; }
      const next = await loadRestaurant(authorized);
      if (current !== epoch.current || !mounted.current) return;
      latest.current = next; setData(next); setError('');
      access.current = { session: candidate, admin: authorized }; setIsAdmin(authorized);
    } catch (cause) {
      if (current === epoch.current && mounted.current) {
        setError(errorMessage(cause)); latest.current = empty; setData(empty);
        access.current.admin = false; setIsAdmin(false);
      }
    } finally { if (current === epoch.current && mounted.current) setLoading(false); }
  }, []);

  async function adminMutation(action: () => Promise<void>): Promise<Result> {
    try {
      if (!access.current.admin) throw new Error('Necesitas una sesión con permisos de administrador.');
      const permission = await requireSupabase().rpc('verificar_acceso_admin');
      if (permission.error) throw permission.error;
      if (permission.data !== true) { await refresh(); throw new Error('Tu cuenta ya no tiene permisos de administrador.'); }
      await action(); // RLS vuelve a comprobar la autorización al escribir.
      await refresh();
      return { ok: true };
    } catch (cause) { return { ok: false, error: errorMessage(cause) }; }
  }
  async function expectOne(request: PromiseLike<{ data: unknown[] | null; error: unknown }>) {
    const result = await request;
    if (result.error) throw result.error;
    if (result.data?.length !== 1) throw new Error('No se modificó el registro. Actualiza los datos y comprueba tus permisos.');
  }

  const value: RestaurantStore = {
    ...data, loading, error, refresh, session, isAdmin, authLoading, authError, confirmation,
    async login(email, password) {
      try {
        const result = await requireSupabase().auth.signInWithPassword({ email: email.trim(), password });
        if (result.error) throw result.error;
        return { ok: true };
      } catch (cause) { return { ok: false, error: errorMessage(cause) }; }
    },
    async logout() {
      ++epoch.current; access.current = { session: null, admin: false };
      setIsAdmin(false); latest.current = empty; setData(empty); setConfirmation(null);
      try {
        const result = await requireSupabase().auth.signOut({ scope: 'local' });
        if (result.error) throw result.error;
        return { ok: true };
      } catch (cause) { return { ok: false, error: errorMessage(cause) }; }
    },
    async addTable(input) {
      if (!input.name.trim() || !input.zone.trim() || !Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 30) return { ok: false, error: 'Completa nombre, zona y una capacidad entre 1 y 30.' };
      return adminMutation(async () => {
        await expectOne(requireSupabase().from('mesas').insert({ nombre: input.name.trim(), zona: input.zone.trim(), capacidad: input.capacity, activa: input.status === 'disponible' }).select('id'));
      });
    },
    async updateTableStatus(id, status) {
      return adminMutation(async () => { await expectOne(requireSupabase().from('mesas').update({ activa: status === 'disponible' }).eq('id', id).select('id')); });
    },
    async saveShift(input) {
      const start = timeToMinutes(input.start), end = timeToMinutes(input.end);
      if (!input.name.trim() || !Number.isFinite(start) || !Number.isFinite(end) || end <= start || !Number.isInteger(input.day) || input.day < 0 || input.day > 6 || !Number.isInteger(input.duration) || input.duration < 15 || input.duration > 240 || input.duration > end - start) return { ok: false, error: 'Revisa el día, nombre y horas HH:mm. La duración debe ser de 15 a 240 minutos y caber en la jornada.' };
      return adminMutation(async () => {
        const payload = { jornada: input.name.trim(), dia_semana: isoDay(input.day), hora_inicio: input.start, hora_fin: input.end, duracion_slot: input.duration, activo: input.enabled };
        const table = requireSupabase().from('horarios');
        await expectOne((input.id ? table.update(payload).eq('id', input.id) : table.insert(payload)).select('id'));
      });
    },
    async saveDish(input) {
      if (!input.name.trim() || !input.description.trim() || !Number.isFinite(input.price) || input.price <= 0 || input.price > 10000000) return { ok: false, error: 'Completa el nombre, descripción y un precio válido mayor que cero.' };
      return adminMutation(async () => {
        const payload = { nombre: input.name.trim(), descripcion: input.description.trim(), categoria: input.category, precio: input.price, disponible: input.visible };
        const table = requireSupabase().from('platos');
        await expectOne((input.id ? table.update(payload).eq('id', input.id) : table.insert(payload)).select('id'));
      });
    },
    async toggleDish(id) {
      return adminMutation(async () => {
        const dish = latest.current.dishes.find((item) => item.id === id);
        if (!dish) throw new Error('El plato ya no está disponible. Actualiza la carta.');
        await expectOne(requireSupabase().from('platos').update({ disponible: !dish.visible }).eq('id', id).select('id'));
      });
    },
    async updateReservationStatus(id, status) {
      if (status === 'confirmada') return { ok: false, error: 'Una reserva finalizada no se reactiva. Crea una nueva.' };
      return adminMutation(async () => {
        await expectOne(requireSupabase().from('reservas').update({ estado: status }).eq('id', id).eq('estado', 'confirmada').select('id'));
        setConfirmation((previous) => previous?.id === id ? { ...previous, status } : previous);
      });
    },
    async createReservation(input) {
      if (booking.current) return { ok: false, error: 'Tu reserva se está enviando. Espera un momento.' };
      booking.current = true;
      let rpcStarted = false;
      try {
        const table = latest.current.tables.find((item) => item.id === input.tableId);
        const shift = latest.current.shifts.find((item) => item.id === input.shiftId);
        if (!table || table.status !== 'disponible' || !shift || !isValidDate(input.date) || input.date < todayISO()) throw new Error('Selecciona una mesa, jornada y fecha válidas.');
        if (input.name.trim().length < 2 || input.name.trim().length > 80 || !Number.isInteger(input.people) || input.people < 1 || input.people > table.capacity || input.contact.length > 100) throw new Error('Revisa el nombre, el contacto y la capacidad de la mesa.');
        const intervals = await fetchOccupancy(input.tableId, input.date);
        if (!availableTimes(shift, input.date, intervals).includes(input.time)) throw new Error('Este horario ya no está disponible. Elige otro horario.');
        rpcStarted = true;
        const result = await requireSupabase().rpc('crear_reserva', {
          p_mesa_id: input.tableId, p_cliente_nombre: input.name.trim(), p_num_personas: input.people,
          p_fecha: input.date, p_hora_inicio: input.time, p_cliente_contacto: input.contact.trim() || null,
        });
        if (result.error) throw result.error;
        if (typeof result.data !== 'string' || !/^[0-9a-f-]{36}$/i.test(result.data)) throw new Error('El servidor no devolvió una referencia de reserva válida. Consulta al restaurante antes de repetir.');
        setConfirmation({ ...input, id: result.data, name: input.name.trim(), contact: input.contact.trim(), duration: shift.duration, status: 'confirmada' });
        return { ok: true, id: result.data };
      } catch (cause) {
        const message = errorMessage(cause);
        return { ok: false, error: rpcStarted && /conectar|conexión/i.test(message) ? 'No pudimos confirmar la respuesta del servidor. La reserva podría haberse registrado; consulta al restaurante antes de volver a enviarla.' : message };
      } finally { booking.current = false; }
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useRestaurant() {
  const value = useContext(Context);
  if (!value) throw new Error('useRestaurant debe usarse dentro de RestaurantProvider.');
  return value;
}
