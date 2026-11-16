import type { Session } from '@supabase/supabase-js';
import type { RestaurantData } from '@/types/restaurant';

const empty: RestaurantData = { tables: [], shifts: [], reservations: [], dishes: [] };

export interface RestaurantSyncState {
  data: RestaurantData;
  loading: boolean;
  error: string;
  session: Session | null;
  isAdmin: boolean;
  authLoading: boolean;
  authError: string;
}

export function initialRestaurantState(configurationError = ''): RestaurantSyncState {
  return { data: empty, loading: !configurationError, error: configurationError, session: null,
    isAdmin: false, authLoading: !configurationError, authError: '' };
}

interface SyncDependencies {
  verifySession: (session: Session) => Promise<boolean>;
  loadRestaurant: (admin: boolean) => Promise<RestaurantData>;
  errorMessage: (cause: unknown) => string;
  onChange: (state: RestaurantSyncState) => void;
}

// Auth y la actualización manual comparten un único propietario de la carga.
// Las respuestas de una sesión anterior nunca pueden publicar datos privados.
export function createRestaurantSync(deps: SyncDependencies, initial = initialRestaurantState()) {
  let state = initial;
  let generation = 0;
  let active = true;

  function publish(patch: Partial<RestaurantSyncState>) {
    if (!active) return;
    state = { ...state, ...patch };
    deps.onChange(state);
  }

  function setSession(session: Session | null) {
    ++generation;
    const identityChanged = state.session?.user.id !== session?.user.id;
    publish({ session, loading: true, authError: '',
      ...(identityChanged ? { data: empty, isAdmin: false, authLoading: Boolean(session) } : {}),
    });
  }

  async function refresh(): Promise<void> {
    if (!active) return;
    const current = ++generation;
    const candidate = state.session;
    const isCurrent = () => active && current === generation;
    publish({ loading: true, authError: '' });
    let authorized = false;
    try {
      if (candidate) {
        try {
          authorized = await deps.verifySession(candidate);
          if (!authorized) throw new Error('Esta cuenta no tiene permisos de administrador.');
        } catch (cause) {
          if (!isCurrent()) return;
          // Un fallo de autorización cierra el acceso incluso durante una renovación.
          publish({ isAdmin: false, data: empty, authError: deps.errorMessage(cause) });
        }
      }
      if (!isCurrent()) return;
      if (!authorized) publish({ isAdmin: false, ...(state.isAdmin ? { data: empty } : {}) });
      else publish({ isAdmin: true });

      const data = await deps.loadRestaurant(authorized);
      if (isCurrent()) publish({ data, error: '' });
    } catch (cause) {
      // Una consulta fallida no revoca un permiso que acaba de verificarse.
      // Conservamos los últimos datos de esa sesión y mostramos el error.
      if (isCurrent()) publish({ error: deps.errorMessage(cause) });
    } finally {
      if (isCurrent()) publish({ loading: false, authLoading: false });
    }
  }

  return {
    getSnapshot: () => state,
    setSession,
    refresh,
    reportError: (cause: unknown) => publish({ error: deps.errorMessage(cause) }),
    activate: () => { active = true; },
    deactivate: () => { active = false; ++generation; },
  };
}
