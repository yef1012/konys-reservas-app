import type { Category, TableStatus } from '@/types/restaurant';

export const tableStates: { value: TableStatus; label: string }[] = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'mantenimiento', label: 'Inactiva' },
];

export const categories: { value: Category; label: string }[] = [
  { value: 'pizzas', label: 'Pizzas' },
  { value: 'entradas', label: 'Entradas' },
  { value: 'postres', label: 'Postres' },
  { value: 'bebidas', label: 'Bebidas' },
];

export const tableTone = (status: TableStatus) =>
  status === 'disponible' ? 'success' : 'neutral';

export const weekDays = [
  { value: 1, label: 'Lunes' }, { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' }, { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' }, { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

export function isDateValue(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
