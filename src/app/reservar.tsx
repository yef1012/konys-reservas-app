import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { BookingRecovery, isCalendarDate, queryValue } from '@/components/client/booking';
import { AppText, Badge, Button, Card, Chip, EmptyState, Field, Notice, Row, Screen, Section } from '@/components/konys/ui';
import { useAvailability } from '@/hooks/use-availability';
import { useRestaurant } from '@/state/restaurant-store';
import { weekday } from '@/utils/availability';
import { addDays, formatDate, todayISO } from '@/utils/reservations';

export default function ReserveScreen() {
  const params = useLocalSearchParams<{ tableId?: string; date?: string; shiftId?: string; time?: string }>();
  const { tables, shifts, loading, error: catalogError } = useRestaurant();
  const [tableId, setTableId] = useState(queryValue(params.tableId));
  const [date, setDate] = useState(queryValue(params.date) || todayISO());
  const [selectedShiftId, setSelectedShiftId] = useState(queryValue(params.shiftId));
  const [time, setTime] = useState(queryValue(params.time));
  const [error, setError] = useState('');
  const table = tables.find((item) => item.id === tableId);
  const validDate = isCalendarDate(date) && date >= todayISO();
  const enabledTables = tables.filter((item) => item.status === 'disponible');
  const enabledShifts = shifts.filter((item) => item.enabled && validDate && item.day === weekday(date));
  const shift = enabledShifts.find((item) => item.id === selectedShiftId) ?? enabledShifts[0];
  const shiftId = shift?.id ?? '';
  const availability = useAvailability(table && validDate ? table.id : '', validDate ? date : '', shiftId);
  const slots = availability.slots;

  if (loading || catalogError) return <Screen title="Reservar mesa" backHref="/">{null}</Screen>;
  if (tableId && !table) return <BookingRecovery message="Esta mesa ya no está disponible. Vuelve al inicio y selecciona otra." />;

  function changeDate(value: string) { setDate(value); setSelectedShiftId(''); setTime(''); setError(''); }
  function continueBooking() {
    if (!table || !shift || !validDate || availability.loading || availability.error || !slots.includes(time)) {
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
        {!enabledTables.length && <EmptyState title="Sin mesas habilitadas" message="Por ahora no hay mesas habilitadas para nuevas reservas." />}
        {table && table.status !== 'disponible' && <Notice tone="error">Esta mesa no está habilitada para reservar. Elige otra mesa.</Notice>}
      </Section>
      <Section title="Fecha de tu visita">
        <Row>{Array.from({ length: 14 }, (_, index) => {
          const value = addDays(todayISO(), index);
          const label = index === 0 ? 'Hoy' : index === 1 ? 'Mañana' : `${value.slice(8)}/${value.slice(5, 7)}`;
          return <Chip key={value} label={label} selected={date === value} onPress={() => changeDate(value)} />;
        })}</Row>
        <Field label="Otra fecha (AAAA-MM-DD)" placeholder={todayISO()} value={date} onChangeText={changeDate} autoCapitalize="none" maxLength={10} error={!validDate ? 'Usa una fecha real de hoy en adelante: AAAA-MM-DD.' : undefined} />
        {validDate && <AppText variant="caption">{formatDate(date)}</AppText>}
      </Section>
      <Section title="Jornada">
        <Row>{enabledShifts.map((item) => <Chip key={item.id} label={`${item.name} · ${item.start}–${item.end}`} selected={shiftId === item.id} onPress={() => { setSelectedShiftId(item.id); setTime(''); setError(''); }} />)}</Row>
        {!enabledShifts.length && <EmptyState title="Sin jornadas disponibles" message="No hay jornadas habilitadas para esta fecha. Elige otro día." />}
      </Section>
      <Section title="Horarios disponibles">
        {availability.loading ? <Notice>Consultando horarios disponibles…</Notice>
          : availability.error ? <><Notice tone="error">{availability.error}</Notice><Button label="Reintentar disponibilidad" variant="secondary" onPress={availability.refresh} /></>
          : slots.length ? <Row>{slots.map((slot) => <Chip key={slot} label={slot} selected={time === slot} onPress={() => { setTime(slot); setError(''); }} />)}</Row>
          : <EmptyState title="No hay horarios para esta selección" message="Prueba otra fecha, jornada o mesa. Solo mostramos horarios libres y futuros." />}
        {shift && <AppText variant="caption">Reserva de {shift.duration} minutos · Hora de Colombia.</AppText>}
      </Section>
      {!!error && <Notice tone="error">{error}</Notice>}
      <Button label="Continuar con mis datos" onPress={continueBooking} disabled={!table || !validDate || availability.loading || !!availability.error || !slots.includes(time)} />
    </Screen>
  );
}
