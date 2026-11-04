import type { Category, TableStatus } from '@/types/demo';

export const tableStates: { value: TableStatus; label: string }[] = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'reservada', label: 'Reservada' },
  { value: 'ocupada', label: 'Ocupada' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
];

export const categories: { value: Category; label: string }[] = [
  { value: 'pizzas', label: 'Pizzas' },
  { value: 'entradas', label: 'Entradas' },
  { value: 'postres', label: 'Postres' },
  { value: 'bebidas', label: 'Bebidas' },
];

export const tableTone = (status: TableStatus) =>
  status === 'disponible' ? 'success' : status === 'mantenimiento' ? 'danger' : 'warning';

export function isDateValue(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
