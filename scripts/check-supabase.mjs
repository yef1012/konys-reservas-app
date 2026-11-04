// Diagnóstico de solo lectura. No imprime claves, sesiones ni datos personales.
import { existsSync } from 'node:fs';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key || !key.startsWith('sb_publishable_')) {
  console.error('Faltan la URL o una clave publishable válida en .env.local.');
  process.exit(1);
}
const headers = { apikey: key, Accept: 'application/json' };
async function read(path, init = {}) {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init, headers: { ...headers, ...init.headers }, signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok) {
    const message = String(data.message ?? data.error ?? 'Petición rechazada').replaceAll(key, '[clave omitida]').replaceAll(url, '[URL omitida]');
    throw new Error(`HTTP ${response.status}: ${data.code ?? 'error'} — ${message} (${path.split('?')[0]})`);
  }
  return data;
}
try {
  const [tables, shifts, dishes] = await Promise.all([
    read('mesas?select=id&activa=eq.true&limit=1'),
    read('horarios?select=dia_semana,jornada,hora_inicio,hora_fin,duracion_slot&activo=eq.true&limit=14'),
    read('platos?select=categoria&disponible=eq.true&limit=100'),
  ]);
  console.log(JSON.stringify({ activeTableFound: tables.length > 0, scheduleCount: shifts.length, isoDays: [...new Set(shifts.map((shift) => shift.dia_semana))], categories: [...new Set(dishes.map((dish) => dish.categoria))] }));
  if (tables[0]) {
    const intervals = await read('rpc/consultar_ocupacion', {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_mesa_id: tables[0].id, p_fecha: new Date(Date.now() + 86400000).toISOString().slice(0, 10) }),
    });
    console.log(JSON.stringify({ occupancyRead: true, intervalCount: intervals.length, columns: intervals[0] ? Object.keys(intervals[0]) : [] }));
  }
} catch (error) {
  console.error('No se completó la comprobación:', error instanceof Error ? error.message : 'Error de conexión');
  process.exitCode = 1;
}
