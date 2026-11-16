import assert from 'node:assert/strict';
import test from 'node:test';
import { registerTypeScriptPaths } from './helpers/register-typescript.mjs';

const paths = registerTypeScriptPaths();
const { availableTimes, isoDay, normalizeTime, parseOccupancy, weekday } = await import('../src/utils/availability.ts');
paths.deregister();

const date = '2026-11-16'; // Lunes.
const now = new Date('2026-11-15T23:00:00-05:00');
const shift = { id: 'evening', name: 'Noche', day: 1, start: '18:00', end: '22:00', duration: 60, enabled: true };

test('producción: los días de la jornada conservan la convención ISO de Supabase', () => {
  assert.equal(weekday(date), 1);
  assert.equal(weekday('2026-11-15'), 0);
  assert.equal(weekday('2026-02-30'), -1);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(isoDay), [7, 1, 2, 3, 4, 5, 6]);
});

test('producción: parseOccupancy acepta intervalos RPC y normaliza segundos cero', () => {
  assert.deepEqual(parseOccupancy([
    { hora_inicio: '18:00:00', hora_fin: '19:00:00.000000' },
    { hora_inicio: '20:30', hora_fin: '21:00' },
  ]), [
    { hora_inicio: '18:00', hora_fin: '19:00' },
    { hora_inicio: '20:30', hora_fin: '21:00' },
  ]);
  assert.deepEqual(parseOccupancy([]), []);
});

test('producción: parseOccupancy rechaza respuestas incompletas en lugar de mostrar falsa disponibilidad', () => {
  for (const value of [null, undefined, {}, '[]', [null], [18], [{}],
    [{ hora_inicio: '18:00' }], [{ hora_inicio: 18, hora_fin: '19:00' }],
    [{ hora_inicio: '18:00', hora_fin: null }]]) {
    assert.throws(() => parseOccupancy(value));
  }
});

test('producción: horas inválidas o con segundos no representables se rechazan', () => {
  for (const value of ['24:00', '18:60', '8:00', '18:00:01', '18:00:00.1', '18:00Z', '']) {
    assert.throws(() => normalizeTime(value));
    assert.throws(() => parseOccupancy([{ hora_inicio: value, hora_fin: '23:59' }]));
  }
});

test('producción: parseOccupancy rechaza intervalos nulos, invertidos y nocturnos', () => {
  for (const [start, end] of [['18:00', '18:00'], ['19:00', '18:00'], ['23:00', '01:00']]) {
    assert.throws(() => parseOccupancy([{ hora_inicio: start, hora_fin: end }]));
  }
});

test('producción: availableTimes genera únicamente reservas completas dentro de la jornada', () => {
  assert.deepEqual(availableTimes(shift, date, [], now), ['18:00', '19:00', '20:00', '21:00']);
  assert.deepEqual(availableTimes({ ...shift, end: '21:30' }, date, [], now), ['18:00', '19:00', '20:00']);
  assert.deepEqual(availableTimes({ ...shift, duration: 45, end: '20:00' }, date, [], now), ['18:00', '18:45']);
});

test('producción: intervalos adyacentes permiten reservas sin solapamiento', () => {
  const occupied = parseOccupancy([{ hora_inicio: '19:00:00', hora_fin: '20:00:00' }]);
  assert.deepEqual(availableTimes(shift, date, occupied, now), ['18:00', '20:00', '21:00']);
});

test('producción: solapamientos parciales, completos y múltiples bloquean las franjas afectadas', () => {
  const occupied = parseOccupancy([
    { hora_inicio: '18:30', hora_fin: '19:30' },
    { hora_inicio: '20:15', hora_fin: '20:45' },
  ]);
  assert.deepEqual(availableTimes(shift, date, occupied, now), ['21:00']);
  assert.deepEqual(availableTimes(shift, date, parseOccupancy([
    { hora_inicio: '17:00', hora_fin: '23:00' },
  ]), now), []);
});

test('producción: jornadas deshabilitadas, de otro día o fechas inválidas no ofrecen horas', () => {
  assert.deepEqual(availableTimes({ ...shift, enabled: false }, date, [], now), []);
  assert.deepEqual(availableTimes({ ...shift, day: 0 }, date, [], now), []);
  for (const value of ['2026-02-30', '16/11/2026', '', '2026-11-09']) {
    assert.deepEqual(availableTimes(shift, value, [], now), []);
  }
});

test('producción: duraciones y límites inválidos no producen franjas', () => {
  for (const duration of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 241]) {
    assert.deepEqual(availableTimes({ ...shift, duration }, date, [], now), []);
  }
  for (const times of [{ start: 'invalid' }, { end: '24:00' }, { end: '18:00' }, { start: '23:00', end: '01:00' }]) {
    assert.deepEqual(availableTimes({ ...shift, ...times }, date, [], now), []);
  }
});

test('producción: una hora ya iniciada se excluye usando la hora de Colombia', () => {
  const instant = new Date('2026-11-17T00:00:00Z'); // Todavía lunes, 19:00 en Colombia.
  assert.deepEqual(availableTimes(shift, date, [], instant), ['20:00', '21:00']);
  assert.deepEqual(availableTimes(shift, date, [], new Date('2026-11-16T23:59:59Z')), ['19:00', '20:00', '21:00']);
});

test('producción: el cambio de fecha UTC no descarta el día vigente en Colombia', () => {
  const lateShift = { ...shift, start: '22:00', end: '23:59', duration: 30 };
  assert.deepEqual(availableTimes(lateShift, date, [], new Date('2026-11-17T03:00:00Z')), ['22:30', '23:00']);
  assert.deepEqual(availableTimes(lateShift, date, [], new Date('2026-11-17T05:00:00Z')), []);
});
