export type TableStatus = 'disponible' | 'reservada' | 'ocupada' | 'mantenimiento';
export type ReservationStatus = 'confirmada' | 'cancelada' | 'completada';
export type Category = 'pizzas' | 'entradas' | 'postres' | 'bebidas';
export interface Table { id: string; name: string; zone: string; capacity: number; status: TableStatus; }
export interface Shift { id: string; name: string; day: number; start: string; end: string; duration: number; enabled: boolean; }
export interface Reservation {
  id: string; tableId: string; date: string; time: string; duration: number; shiftId: string;
  name: string; people: number; contact: string; status: ReservationStatus;
}
export interface Dish { id: string; name: string; description: string; category: Category; price: number; visible: boolean; }
export interface ReservationInput { tableId: string; date: string; time: string; shiftId: string; name: string; people: number; contact: string; }
export type Result = { ok: true } | { ok: false; error: string };
export type ReservationResult = { ok: true; id: string } | { ok: false; error: string };
export interface RestaurantData { tables: Table[]; shifts: Shift[]; reservations: Reservation[]; dishes: Dish[]; }
export interface OccupiedInterval { hora_inicio: string; hora_fin: string; }
