import type { OccupiedInterval, Shift } from '../types/restaurant';
import { isValidDate, minutesToTime, timeToMinutes, todayISO } from './reservations';

// El día se calcula sobre la fecha elegida, sin convertirla a la zona del dispositivo.
export function weekday(date: string): number {
  return isValidDate(date) ? new Date(`${date}T12:00:00Z`).getUTCDay() : -1;
}
export const isoDay = (day: number) => day === 0 ? 7 : day;
export function normalizeTime(time: string): string {
  if (!/^([01]\d|2[0-3]):[0-5]\d(?::00(?:\.0+)?)?$/.test(time)) throw new Error('El servidor devolvió una hora no compatible. Se requieren horarios con precisión de minutos.');
  return time.slice(0, 5);
}
export function parseOccupancy(value: unknown): OccupiedInterval[] {
  if (!Array.isArray(value)) throw new Error('No se pudo interpretar la ocupación del servidor.');
  return value.map((item: unknown) => {
    if (!item || typeof item !== 'object' || !('hora_inicio' in item) || !('hora_fin' in item)
      || typeof item.hora_inicio !== 'string' || typeof item.hora_fin !== 'string') {
      throw new Error('consultar_ocupacion debe devolver hora_inicio y hora_fin.');
    }
    const start = normalizeTime(item.hora_inicio);
    const end = normalizeTime(item.hora_fin);
    if (timeToMinutes(end) <= timeToMinutes(start)) throw new Error('La ocupación contiene un intervalo inválido.');
    return { hora_inicio: start, hora_fin: end };
  });
}
export function availableTimes(shift: Shift, date: string, intervals: OccupiedInterval[], now = new Date()): string[] {
  if (!isValidDate(date) || date < todayISO(now) || shift.day !== weekday(date) || !shift.enabled) return [];
  const start = timeToMinutes(shift.start);
  const end = timeToMinutes(shift.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isInteger(shift.duration) || shift.duration < 1) return [];
  const slots: string[] = [];
  for (let time = start; time + shift.duration <= end; time += shift.duration) {
    const label = minutesToTime(time);
    if (new Date(`${date}T${label}:00-05:00`).getTime() <= now.getTime()) continue;
    if (intervals.some((interval) => time < timeToMinutes(interval.hora_fin) && time + shift.duration > timeToMinutes(interval.hora_inicio))) continue;
    slots.push(label);
  }
  return slots;
}
