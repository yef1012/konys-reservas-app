import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';

import { BookingRecovery, BookingSummary, isCalendarDate, queryValue } from '@/components/client/booking';
import { Button, Field, Notice, Screen } from '@/components/konys/ui';
import { useDemo } from '@/state/demo-store';

export default function ReservationFormScreen() {
  const params = useLocalSearchParams<{ tableId?: string; date?: string; time?: string; shiftId?: string }>();
  const { tables, shifts, createReservation, availableSlots } = useDemo();
  const tableId = queryValue(params.tableId);
  const date = queryValue(params.date);
  const time = queryValue(params.time);
  const shiftId = queryValue(params.shiftId);
  const table = tables.find((item) => item.id === tableId);
  const shift = shifts.find((item) => item.id === shiftId);
  const [name, setName] = useState('');
  const [people, setPeople] = useState('2');
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const sending = useRef(false);

  if (!table || !shift || !isCalendarDate(date) || !/^\d{2}:\d{2}$/.test(time)) return <BookingRecovery />;
  const selectionHref = { pathname: '/reservar' as const, params: { tableId, date, shiftId, time } };
  const count = Number(people);
  const validPeople = /^\d+$/.test(people) && Number.isInteger(count) && count >= 1 && count <= table.capacity;
  const slotAvailable = availableSlots(tableId, date, shiftId).includes(time);

  function confirm() {
    if (sending.current) return;
    setAttempted(true);
    if (name.trim().length < 2 || !validPeople) {
      setError('Revisa los campos marcados antes de confirmar.');
      return;
    }
    sending.current = true;
    const result = createReservation({ tableId, date, time, shiftId, name: name.trim(), people: count, contact: contact.trim() });
    if (!result.ok) { sending.current = false; setError(result.error); return; }
    setSubmitted(true);
    router.replace({ pathname: '/confirmacion', params: { id: result.id } });
  }

  return (
    <Screen title="Completa tu reserva" subtitle="Paso 2 de 2 · Solo necesitamos unos datos." backHref={selectionHref}>
      <BookingSummary table={table} date={date} time={time} duration={shift.duration} shiftName={shift.name} />
      {!slotAvailable && !submitted && <Notice tone="error">Este horario ya no está disponible. Regresa para elegir uno nuevo.</Notice>}
      <Field label="Nombre del cliente" value={name} onChangeText={setName} placeholder="Escribe tu nombre" autoCapitalize="words" maxLength={80} error={attempted && name.trim().length < 2 ? 'Escribe al menos 2 caracteres.' : undefined} />
      <Field label={`Número de personas (máximo ${table.capacity})`} value={people} onChangeText={setPeople} keyboardType="number-pad" maxLength={2} error={attempted && !validPeople ? `Ingresa un número entero entre 1 y ${table.capacity}.` : undefined} />
      <Field label="Contacto (opcional)" value={contact} onChangeText={setContact} placeholder="Teléfono o WhatsApp" keyboardType="phone-pad" maxLength={30} />
      <Notice>Reserva de demostración: se conserva mientras la app esté abierta y se reinicia al recargar.</Notice>
      {!!error && <Notice tone="error">{error}</Notice>}
      <Button label={submitted ? 'Reserva guardada' : 'Confirmar reserva'} onPress={confirm} disabled={submitted || !slotAvailable} />
      <Button label="Cambiar fecha u horario" variant="ghost" onPress={() => router.replace(selectionHref)} />
    </Screen>
  );
}
