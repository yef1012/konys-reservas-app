import { createContext, useContext, useRef, useState, type ReactNode } from 'react';

import { categories, createDemoData, DEMO_PIN } from '../data/demo';
import type { DemoData, Dish, ReservationInput, ReservationResult, ReservationStatus, Result, Shift, Table, TableStatus } from '../types/demo';
import { getAvailableSlots, timeToMinutes, validateReservation } from '../utils/reservations';

interface DemoStore extends DemoData {
  isAdmin: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
  addTable: (input: Omit<Table, 'id'>) => Result;
  updateTableStatus: (id: string, status: TableStatus) => void;
  saveShift: (input: Shift) => Result;
  saveDish: (input: Omit<Dish, 'id'> & { id?: string }) => Result;
  toggleDish: (id: string) => void;
  createReservation: (input: ReservationInput) => ReservationResult;
  updateReservationStatus: (id: string, status: ReservationStatus) => void;
  availableSlots: (tableId: string, date: string, shiftId: string) => string[];
}

const DemoContext = createContext<DemoStore | null>(null);
const adminRequired: Result = { ok: false, error: 'Accede al panel con el PIN de demostración.' };
let sequence = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${++sequence}`;

export function DemoProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DemoData>(createDemoData);
  const [isAdmin, setIsAdmin] = useState(false);
  const latest = useRef(data);
  const admin = useRef(false);

  // Actualizar la referencia antes del render evita reservas dobles por pulsaciones rápidas.
  const commit = (next: DemoData) => {
    latest.current = next;
    setData(next);
  };

  const value: DemoStore = {
    ...data,
    isAdmin,
    login(pin) {
      const accepted = pin === DEMO_PIN;
      admin.current = accepted;
      setIsAdmin(accepted);
      return accepted;
    },
    logout() {
      admin.current = false;
      setIsAdmin(false);
    },
    addTable(input) {
      if (!admin.current) return adminRequired;
      if (!input.name.trim() || !input.zone.trim()) return { ok: false, error: 'Escribe el nombre y la zona de la mesa.' };
      if (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 30) {
        return { ok: false, error: 'La capacidad debe ser un número entero entre 1 y 30.' };
      }
      const current = latest.current;
      if (current.tables.some((entry) => entry.name.toLocaleLowerCase() === input.name.trim().toLocaleLowerCase())) {
        return { ok: false, error: 'Ya existe una mesa con ese nombre.' };
      }
      commit({ ...current, tables: [...current.tables, { ...input, id: newId('mesa'), name: input.name.trim(), zone: input.zone.trim() }] });
      return { ok: true };
    },
    updateTableStatus(id, status) {
      if (!admin.current) return;
      const current = latest.current;
      commit({ ...current, tables: current.tables.map((entry) => entry.id === id ? { ...entry, status } : entry) });
    },
    saveShift(input) {
      if (!admin.current) return adminRequired;
      const start = timeToMinutes(input.start);
      const end = timeToMinutes(input.end);
      if (!input.name.trim()) return { ok: false, error: 'Escribe un nombre para la jornada.' };
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return { ok: false, error: 'Usa horas HH:mm. El cierre debe ser posterior a la apertura del mismo día.' };
      }
      if (!Number.isInteger(input.duration) || input.duration < 15 || input.duration > 240 || input.duration > end - start) {
        return { ok: false, error: 'La duración debe ser de 15 a 240 minutos y caber dentro de la jornada.' };
      }
      const current = latest.current;
      const saved = { ...input, id: input.id || newId('jornada'), name: input.name.trim() };
      const exists = current.shifts.some((entry) => entry.id === saved.id);
      commit({ ...current, shifts: exists ? current.shifts.map((entry) => entry.id === saved.id ? saved : entry) : [...current.shifts, saved] });
      return { ok: true };
    },
    saveDish(input) {
      if (!admin.current) return adminRequired;
      if (!input.name.trim() || !input.description.trim()) return { ok: false, error: 'Completa el nombre y la descripción del plato.' };
      if (!Number.isFinite(input.price) || input.price <= 0 || input.price > 10000000) return { ok: false, error: 'Escribe un precio válido mayor que cero.' };
      if (!categories.includes(input.category)) return { ok: false, error: 'Selecciona una categoría válida.' };
      const current = latest.current;
      const saved: Dish = { ...input, id: input.id || newId('plato'), name: input.name.trim(), description: input.description.trim() };
      const exists = current.dishes.some((entry) => entry.id === saved.id);
      commit({ ...current, dishes: exists ? current.dishes.map((entry) => entry.id === saved.id ? saved : entry) : [...current.dishes, saved] });
      return { ok: true };
    },
    toggleDish(id) {
      if (!admin.current) return;
      const current = latest.current;
      commit({ ...current, dishes: current.dishes.map((entry) => entry.id === id ? { ...entry, visible: !entry.visible } : entry) });
    },
    createReservation(input) {
      const current = latest.current;
      const validation = validateReservation(current, input);
      if (!validation.ok) return validation;
      const shift = current.shifts.find((entry) => entry.id === input.shiftId)!;
      const id = newId('KP').toUpperCase();
      commit({ ...current, reservations: [{ ...input, id, name: input.name.trim(), contact: input.contact.trim(), duration: shift.duration, status: 'confirmada' }, ...current.reservations] });
      return { ok: true, id };
    },
    updateReservationStatus(id, status) {
      if (!admin.current) return;
      const current = latest.current;
      const reservation = current.reservations.find((entry) => entry.id === id);
      if (!reservation || reservation.status === status) return;
      // En esta demo las reservas finalizadas no se reactivan: se crea una nueva reserva.
      if (status === 'confirmada') return;
      commit({ ...current, reservations: current.reservations.map((entry) => entry.id === id ? { ...entry, status } : entry) });
    },
    availableSlots(tableId, date, shiftId) {
      return getAvailableSlots(latest.current, tableId, date, shiftId);
    },
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoStore {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo debe usarse dentro de DemoProvider.');
  return context;
}
