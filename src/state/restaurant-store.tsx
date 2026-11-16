import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { configurationError, requireSupabase, supabase } from '@/lib/supabase';
import { errorMessage, fetchOccupancy, loadRestaurant } from '@/services/restaurant';
import { createReservationAction } from '@/services/create-reservation';
import { createRestaurantSync, initialRestaurantState } from '@/state/restaurant-sync';
import type { Dish, Reservation, ReservationInput, ReservationResult, ReservationStatus, RestaurantData, Result, Shift, Table, TableStatus } from '@/types/restaurant';
import { isoDay } from '@/utils/availability';
import { timeToMinutes } from '@/utils/reservations';

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
const Context = createContext<RestaurantStore | null>(null);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState(() => initialRestaurantState(configurationError));
  const [confirmation, setConfirmation] = useState<Reservation | null>(null);
  const [synchronization] = useState(() => createRestaurantSync({
    onChange: setSnapshot,
    errorMessage,
    loadRestaurant,
    async verifySession(candidate) {
      const client = requireSupabase();
      const user = await client.auth.getUser(candidate.access_token);
      if (user.error || user.data.user?.id !== candidate.user.id) throw user.error ?? new Error('La sesión ya no es válida.');
      const permission = await client.rpc('verificar_acceso_admin');
      if (permission.error) throw permission.error;
      return permission.data === true;
    },
  }, snapshot));
  const { data, loading, error, session, isAdmin, authLoading, authError } = snapshot;
  const refresh = synchronization.refresh;
  const [createReservation] = useState(() => createReservationAction({
    getData: () => synchronization.getSnapshot().data,
    fetchOccupancy,
    reserve: (args) => requireSupabase().rpc('crear_reserva', args),
    confirm: setConfirmation,
    refresh,
    onRefreshError: synchronization.reportError,
    errorMessage,
  }));

  useEffect(() => {
    synchronization.activate();
    if (!supabase) return;
    const client = supabase;
    // No ejecutar consultas async dentro del callback de Auth: se evita bloquear su lock.
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const { data: listener } = client.auth.onAuthStateChange((_event, next) => {
      timers.forEach(clearTimeout); timers.clear();
      if (synchronization.getSnapshot().session?.user.id !== next?.user.id) setConfirmation(null);
      synchronization.setSession(next);
      const timer = setTimeout(() => { timers.delete(timer); void synchronization.refresh(); }, 0);
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
      synchronization.deactivate();
      listener.subscription.unsubscribe(); appState.remove(); timers.forEach(clearTimeout);
      if (Platform.OS !== 'web') client.auth.stopAutoRefresh();
    };
  }, [synchronization]);

  async function adminMutation(action: () => Promise<void>): Promise<Result> {
    try {
      const before = synchronization.getSnapshot();
      if (!before.isAdmin) throw new Error('Necesitas una sesión con permisos de administrador.');
      const permission = await requireSupabase().rpc('verificar_acceso_admin');
      const current = synchronization.getSnapshot();
      if (!current.isAdmin || before.session?.user.id !== current.session?.user.id) throw new Error('La sesión cambió. Vuelve a ingresar antes de guardar.');
      if (permission.error) { await refresh(); throw permission.error; }
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
      synchronization.setSession(null); setConfirmation(null);
      try {
        const result = await requireSupabase().auth.signOut({ scope: 'local' });
        if (result.error) throw result.error;
        return { ok: true };
      } catch (cause) { return { ok: false, error: errorMessage(cause) }; }
      finally { await refresh(); }
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
        const dish = synchronization.getSnapshot().data.dishes.find((item) => item.id === id);
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
    createReservation,
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useRestaurant() {
  const value = useContext(Context);
  if (!value) throw new Error('useRestaurant debe usarse dentro de RestaurantProvider.');
  return value;
}
