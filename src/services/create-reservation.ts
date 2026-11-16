import type { Database } from '@/types/database';
import type { OccupiedInterval, Reservation, ReservationInput, ReservationResult, RestaurantData } from '@/types/restaurant';
import { availableTimes } from '@/utils/availability';
import { isValidDate, todayISO } from '@/utils/reservations';

interface ReservationDependencies {
  getData: () => RestaurantData;
  fetchOccupancy: (tableId: string, date: string) => Promise<OccupiedInterval[]>;
  reserve: (args: Database['public']['Functions']['crear_reserva']['Args']) => PromiseLike<{ data: unknown; error: unknown }>;
  confirm: (reservation: Reservation) => void;
  refresh: () => Promise<void>;
  onRefreshError: (cause: unknown) => void;
  errorMessage: (cause: unknown) => string;
  now?: () => Date;
}

// La aplicación y las pruebas ejecutan este mismo flujo. Solo se sustituyen sus dependencias.
export function createReservationAction(deps: ReservationDependencies) {
  let booking = false;
  const now = deps.now ?? (() => new Date());

  return async (input: ReservationInput): Promise<ReservationResult> => {
    if (booking) return { ok: false, error: 'Tu reserva se está enviando. Espera un momento.' };
    booking = true;
    let rpcStarted = false;
    try {
      const data = deps.getData();
      const table = data.tables.find((item) => item.id === input.tableId);
      const shift = data.shifts.find((item) => item.id === input.shiftId);
      if (!table || table.status !== 'disponible' || !shift || !isValidDate(input.date) || input.date < todayISO(now())) throw new Error('Selecciona una mesa, jornada y fecha válidas.');
      if (input.name.trim().length < 2 || input.name.trim().length > 80 || !Number.isInteger(input.people) || input.people < 1 || input.people > table.capacity || input.contact.length > 100) throw new Error('Revisa el nombre, el contacto y la capacidad de la mesa.');

      const intervals = await deps.fetchOccupancy(input.tableId, input.date);
      if (!availableTimes(shift, input.date, intervals, now()).includes(input.time)) throw new Error('Este horario ya no está disponible. Elige otro horario.');
      rpcStarted = true;
      const result = await deps.reserve({
        p_mesa_id: input.tableId, p_cliente_nombre: input.name.trim(), p_num_personas: input.people,
        p_fecha: input.date, p_hora_inicio: input.time, p_cliente_contacto: input.contact.trim() || null,
      });
      if (result.error) throw result.error;
      if (typeof result.data !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.data)) throw new Error('El servidor no devolvió una referencia de reserva válida. Consulta al restaurante antes de repetir.');

      deps.confirm({ ...input, id: result.data, name: input.name.trim(), contact: input.contact.trim(), duration: shift.duration, status: 'confirmada' });
      // Una reserva confirmada sigue siendo exitosa aunque falle la actualización del listado.
      // No repetir crear_reserva: el servidor ya la registró.
      try { await deps.refresh(); }
      catch (cause) { deps.onRefreshError(cause); }
      return { ok: true, id: result.data };
    } catch (cause) {
      const message = deps.errorMessage(cause);
      return { ok: false, error: rpcStarted && /conectar|conexión/i.test(message) ? 'No pudimos confirmar la respuesta del servidor. La reserva podría haberse registrado; consulta al restaurante antes de volver a enviarla.' : message };
    } finally { booking = false; }
  };
}
