import type { DemoData, ReservationInput, Result } from '../types/demo';

const timeZone = 'America/Bogota';

export function todayISO(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

export function addDays(date: string, days: number): string {
  if (!isValidDate(date)) return '';
  const parsed = new Date(`${date}T12:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function formatDate(date: string): string {
  if (!isValidDate(date)) return 'Fecha no válida';
  return new Intl.DateTimeFormat('es-CO', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00-05:00`));
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function timeToMinutes(time: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return Number.NaN;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  return `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
}

export function getAvailableSlots(
  data: DemoData,
  tableId: string,
  date: string,
  shiftId: string,
  now = new Date(),
): string[] {
  const table = data.tables.find((entry) => entry.id === tableId);
  const shift = data.shifts.find((entry) => entry.id === shiftId);
  if (!table || table.status !== 'disponible' || !shift?.enabled || !isValidDate(date)) return [];
  if (date < todayISO(now) || !Number.isInteger(shift.duration) || shift.duration < 15) return [];
  const start = timeToMinutes(shift.start);
  const end = timeToMinutes(shift.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
  const reservations = data.reservations.filter(
    (entry) => entry.tableId === tableId && entry.date === date && entry.status === 'confirmada',
  );
  const slots: string[] = [];
  for (let minute = start; minute + shift.duration <= end; minute += shift.duration) {
    const time = minutesToTime(minute);
    if (new Date(`${date}T${time}:00-05:00`).getTime() <= now.getTime()) continue;
    const conflict = reservations.some((entry) => {
      const reservedStart = timeToMinutes(entry.time);
      return minute < reservedStart + entry.duration && minute + shift.duration > reservedStart;
    });
    if (!conflict) slots.push(time);
  }
  return slots;
}

export function validateReservation(data: DemoData, input: ReservationInput, now = new Date()): Result {
  const table = data.tables.find((entry) => entry.id === input.tableId);
  if (!table) return { ok: false, error: 'Selecciona una mesa válida.' };
  if (table.status !== 'disponible') return { ok: false, error: 'Esta mesa no está disponible. Elige otra mesa.' };
  if (!isValidDate(input.date) || input.date < todayISO(now)) {
    return { ok: false, error: 'Elige una fecha válida a partir de hoy.' };
  }
  if (input.name.trim().length < 2 || input.name.trim().length > 80) {
    return { ok: false, error: 'Escribe un nombre de entre 2 y 80 caracteres.' };
  }
  if (!Number.isInteger(input.people) || input.people < 1 || input.people > table.capacity) {
    return { ok: false, error: `Esta mesa admite entre 1 y ${table.capacity} personas.` };
  }
  if (input.contact.trim().length > 100) return { ok: false, error: 'El contacto puede tener hasta 100 caracteres.' };
  if (!getAvailableSlots(data, input.tableId, input.date, input.shiftId, now).includes(input.time)) {
    return { ok: false, error: 'El horario ya no está disponible. Regresa y elige otro.' };
  }
  return { ok: true };
}
