import { requireSupabase } from '@/lib/supabase';
import type { HorarioRow, MesaRow, PlatoRow, ReservaRow } from '@/types/database';
import type { Category, Dish, Reservation, ReservationStatus, RestaurantData, Shift, Table } from '@/types/restaurant';
import { normalizeTime, parseOccupancy } from '@/utils/availability';
import { timeToMinutes } from '@/utils/reservations';

export function errorMessage(error: unknown): string {
  const value = error as { code?: string; message?: string } | null;
  if (value?.code === 'invalid_credentials') return 'Correo o contraseña incorrectos.';
  if (value?.code === 'email_not_confirmed') return 'Debes confirmar el correo de esta cuenta antes de ingresar.';
  if (value?.code === '42501') return 'Tu cuenta no tiene permiso para realizar esta operación.';
  if (value?.code === 'PGRST202') return 'Falta una función requerida en Supabase. Revisa la configuración SQL del proyecto.';
  if (value?.code === '23505' || value?.code === '23P01') return 'Los datos ya existen o el horario acaba de ser reservado. Actualiza e inténtalo de nuevo.';
  if (value?.code === '23514' || value?.code === '22P02') return 'El servidor no acepta estos datos. Revisa los campos y la configuración del proyecto.';
  if (/fetch|network|abort|timeout|Failed to/i.test(value?.message ?? '')) return 'No pudimos conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.';
  return value?.message || 'No se pudo completar la operación. Inténtalo de nuevo.';
}

export function mapTable(row: MesaRow): Table {
  return { id: String(row.id), name: row.nombre, zone: row.zona, capacity: row.capacidad, status: row.activa ? 'disponible' : 'mantenimiento' };
}
export function mapShift(row: HorarioRow): Shift {
  if (!Number.isInteger(row.dia_semana) || row.dia_semana < 1 || row.dia_semana > 7) throw new Error('dia_semana debe usar valores ISO entre 1 y 7.');
  return { id: String(row.id), name: row.jornada, day: row.dia_semana % 7, start: normalizeTime(row.hora_inicio), end: normalizeTime(row.hora_fin), duration: row.duracion_slot, enabled: row.activo };
}
export function mapDish(row: PlatoRow): Dish {
  const category = row.categoria.toLowerCase() as Category;
  if (!['pizzas', 'entradas', 'postres', 'bebidas'].includes(category)) throw new Error('La carta contiene una categoría no reconocida.');
  return { id: String(row.id), name: row.nombre, description: row.descripcion ?? '', category, price: Number(row.precio), visible: row.disponible };
}
export function mapReservation(row: ReservaRow): Reservation {
  const time = normalizeTime(row.hora_inicio);
  const end = normalizeTime(row.hora_fin);
  if (!['confirmada', 'cancelada', 'completada'].includes(row.estado)) throw new Error('La reserva contiene un estado no reconocido.');
  return { id: row.id, tableId: String(row.mesa_id), date: row.fecha, time, duration: timeToMinutes(end) - timeToMinutes(time), shiftId: '', name: row.cliente_nombre, people: row.num_personas, contact: row.cliente_contacto ?? '', status: row.estado as ReservationStatus };
}

// La tabla de reservas se consulta exclusivamente después de validar el permiso administrativo.
export async function loadRestaurant(admin: boolean): Promise<RestaurantData> {
  const client = requireSupabase();
  let tables = client.from('mesas').select('id,nombre,zona,capacidad,activa,foto_url,creado_en').order('nombre');
  let shifts = client.from('horarios').select('id,dia_semana,jornada,hora_inicio,hora_fin,duracion_slot,activo').order('dia_semana').order('hora_inicio');
  let dishes = client.from('platos').select('id,nombre,categoria,descripcion,precio,disponible').order('nombre');
  if (!admin) { tables = tables.eq('activa', true); shifts = shifts.eq('activo', true); dishes = dishes.eq('disponible', true); }
  const results = await Promise.all([tables, shifts, dishes]);
  for (const result of results) if (result.error) throw result.error;
  let reservations: Reservation[] = [];
  if (admin) {
    // Paginar evita omitir silenciosamente reservas cuando se superan 1000 filas.
    for (let offset = 0; ; offset += 500) {
      const result = await client.from('reservas').select('id,mesa_id,cliente_nombre,cliente_contacto,num_personas,fecha,hora_inicio,hora_fin,estado,creado_en')
        .order('fecha', { ascending: false }).order('id').range(offset, offset + 499);
      if (result.error) throw result.error;
      reservations = reservations.concat((result.data ?? []).map(mapReservation));
      if ((result.data?.length ?? 0) < 500) break;
    }
  }
  return { tables: (results[0].data ?? []).map(mapTable), shifts: (results[1].data ?? []).map(mapShift), dishes: (results[2].data ?? []).map(mapDish), reservations };
}

export async function fetchOccupancy(tableId: string, date: string, signal?: AbortSignal) {
  const request = requireSupabase().rpc('consultar_ocupacion', { p_mesa_id: tableId, p_fecha: date });
  const { data, error } = await (signal ? request.abortSignal(signal) : request);
  if (error) throw error;
  return parseOccupancy(data);
}
