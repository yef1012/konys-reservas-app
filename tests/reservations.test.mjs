import assert from 'node:assert/strict';
import test from 'node:test';

import { addDays, getAvailableSlots, isValidDate, todayISO, validateReservation } from '../src/utils/reservations.ts';

const now = new Date('2026-11-03T16:30:00Z'); // 11:30 en Colombia.
const data = () => ({
  tables: [{ id: 'table', name: 'Mesa', zone: 'Salón', capacity: 4, status: 'disponible' }],
  shifts: [
    { id: 'lunch', name: 'Almuerzo', start: '12:00', end: '16:00', duration: 60, enabled: true },
    { id: 'overlap', name: 'Extendida', start: '12:30', end: '16:30', duration: 60, enabled: true },
  ],
  reservations: [],
  dishes: [],
});
const input = () => ({ tableId: 'table', date: '2026-11-03', time: '12:00', shiftId: 'lunch', name: 'Cliente Demo', people: 2, contact: '' });

test('las fechas se validan y se calculan según Colombia', () => {
  assert.equal(todayISO(new Date('2026-11-04T02:00:00Z')), '2026-11-03');
  assert.equal(isValidDate('2026-02-30'), false);
  assert.equal(isValidDate('2028-02-29'), true);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('se ofrecen únicamente horarios futuros que caben en la jornada', () => {
  assert.deepEqual(getAvailableSlots(data(), 'table', '2026-11-03', 'lunch', now), ['12:00', '13:00', '14:00', '15:00']);
  assert.deepEqual(getAvailableSlots(data(), 'table', '2026-11-03', 'lunch', new Date('2026-11-03T17:30:00Z')), ['13:00', '14:00', '15:00']);
  assert.deepEqual(getAvailableSlots(data(), 'table', '2026-11-02', 'lunch', now), []);
});

test('se bloquean solapamientos entre jornadas y se admite el límite contiguo', () => {
  const current = data();
  current.reservations.push({ ...input(), id: 'R1', time: '12:30', duration: 90, shiftId: 'overlap', status: 'confirmada' });
  assert.deepEqual(getAvailableSlots(current, 'table', '2026-11-03', 'lunch', now), ['14:00', '15:00']);
});

test('una reserva cancelada libera el horario', () => {
  const current = data();
  current.reservations.push({ ...input(), id: 'R1', duration: 60, status: 'cancelada' });
  assert.ok(getAvailableSlots(current, 'table', '2026-11-03', 'lunch', now).includes('12:00'));
});

test('no se reservan mesas bloqueadas ni jornadas deshabilitadas', () => {
  const current = data();
  current.tables[0].status = 'mantenimiento';
  assert.deepEqual(getAvailableSlots(current, 'table', '2026-11-03', 'lunch', now), []);
  current.tables[0].status = 'disponible';
  current.shifts[0].enabled = false;
  assert.equal(validateReservation(current, input(), now).ok, false);
});

test('se validan capacidad, enteros, nombre, fecha y horario', () => {
  const current = data();
  assert.equal(validateReservation(current, input(), now).ok, true);
  for (const patch of [{ people: 5 }, { people: 0 }, { people: 1.5 }, { name: ' ' }, { date: '2026-02-30' }, { time: '12:10' }]) {
    assert.equal(validateReservation(current, { ...input(), ...patch }, now).ok, false, JSON.stringify(patch));
  }
});

test('revalidar contra el estado recién actualizado impide reservas dobles', () => {
  const current = data();
  assert.equal(validateReservation(current, input(), now).ok, true);
  current.reservations.push({ ...input(), id: 'R1', duration: 60, status: 'confirmada' });
  assert.equal(validateReservation(current, input(), now).ok, false);
});
