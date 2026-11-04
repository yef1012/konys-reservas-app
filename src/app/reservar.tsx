import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { BookingRecovery, isCalendarDate, queryValue } from '@/components/client/booking';
import { AppText, Badge, Button, Card, Chip, EmptyState, Field, Notice, Row, Screen, Section } from '@/components/konys/ui';
import { useDemo } from '@/state/demo-store';
import { addDays, formatDate, todayISO } from '@/utils/reservations';

export default function ReserveScreen() {
  const params = useLocalSearchParams<{ tableId?: string; date?: string; shiftId?: string; time?: string }>();
  const { tables, shifts, availableSlots } = useDemo();
  const [tableId, setTableId] = useState(queryValue(params.tableId));
  const [date, setDate] = useState(queryValue(params.date) || todayISO());
  const [shiftId, setShiftId] = useState(queryValue(params.shiftId) || shifts.find((shift) => shift.enabled)?.id || '');
  const [time, setTime] = useState(queryValue(params.time));
  const [error, setError] = useState('');
  const table = tables.find((item) => item.id === tableId);
  const shift = shifts.find((item) => item.id === shiftId && item.enabled);
  const validDate = isCalendarDate(date) && date >= todayISO();
  const slots = table && shift && validDate ? availableSlots(table.id, date, shift.id) : [];
  const enabledTables = tables.filter((item) => item.status === 'disponible');
  const enabledShifts = shifts.filter((item) => item.enabled);

  if (tableId && !table) return <BookingRecovery message="Esta mesa ya no está en la demo. Vuelve al inicio y selecciona otra." />;

  function changeDate(value: string) { setDate(value); setTime(''); setError(''); }
  function continueBooking() {
    if (!table || !shift || !validDate || !availableSlots(table.id, date, shift.id).includes(time)) {
      setError('Selecciona una mesa, una fecha válida y un horario disponible.');
      return;
    }
    router.push({ pathname: '/reserva-formulario', params: { tableId: table.id, date, shiftId: shift.id, time } });
  }

  return (
    <Screen title="Reservar mesa" subtitle="Paso 1 de 2 · Elige cuándo nos visitas." backHref="/">
      {table && <Card><Row><AppText variant="subtitle">{table.name} · {table.zone}</AppText><Badge label={`${table.capacity} personas`} /></Row><AppText>Capacidad máxima: {table.capacity} personas.</AppText></Card>}
      <Section title="Mesa">
        <Row>{enabledTables.map((item) => <Chip key={item.id} label={`${item.name} · ${item.zone}`} selected={tableId === item.id} onPress={() => { setTableId(item.id); setTime(''); setError(''); }} />)}</Row>
        {!enabledTables.length && <EmptyState title="Sin mesas habilitadas" message="El administrador puede habilitar una mesa para esta demostración." />}
        {table && table.status !== 'disponible' && <Notice tone="error">Esta mesa no está habilitada para reservar. Elige otra mesa.</Notice>}
      </Section>
      <Section title="Fecha de tu visita">
        <Row>{Array.from({ length: 14 }, (_, index) => {
          const value = addDays(todayISO(), index);
          const label = index === 0 ? 'Hoy' : index === 1 ? 'Mañana' : `${value.slice(8)}/${value.slice(5, 7)}`;
          return <Chip key={value} label={label} selected={date === value} onPress={() => changeDate(value)} />;
        })}</Row>
        <Field label="Otra fecha (AAAA-MM-DD)" placeholder="2026-11-14" value={date} onChangeText={changeDate} autoCapitalize="none" maxLength={10} error={!validDate ? 'Usa una fecha real de hoy en adelante: AAAA-MM-DD.' : undefined} />
        {validDate && <AppText variant="caption">{formatDate(date)}</AppText>}
      </Section>
      <Section title="Jornada">
        <Row>{enabledShifts.map((item) => <Chip key={item.id} label={`${item.name} · ${item.start}–${item.end}`} selected={shiftId === item.id} onPress={() => { setShiftId(item.id); setTime(''); setError(''); }} />)}</Row>
        {!enabledShifts.length && <EmptyState title="Sin jornadas disponibles" message="Por ahora no hay horarios habilitados para reservar." />}
      </Section>
      <Section title="Horarios disponibles">
        {slots.length ? <Row>{slots.map((slot) => <Chip key={slot} label={slot} selected={time === slot} onPress={() => { setTime(slot); setError(''); }} />)}</Row> : <EmptyState title="No hay horarios para esta selección" message="Prueba otra fecha, jornada o mesa. Solo mostramos horarios libres y futuros." />}
        {shift && <AppText variant="caption">Reserva de {shift.duration} minutos · Hora de Colombia.</AppText>}
      </Section>
      {!!error && <Notice tone="error">{error}</Notice>}
      <Button label="Continuar con mis datos" onPress={continueBooking} disabled={!table || !validDate || !slots.includes(time)} />
    </Screen>
  );
}
