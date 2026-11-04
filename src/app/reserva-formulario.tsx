import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';

import { BookingRecovery, BookingSummary, isCalendarDate, queryValue } from '@/components/client/booking';
import { Button, Field, Notice, Screen } from '@/components/konys/ui';
import { useAvailability } from '@/hooks/use-availability';
import { useRestaurant } from '@/state/restaurant-store';
import { weekday } from '@/utils/availability';

export default function ReservationFormScreen() {
  const params = useLocalSearchParams<{ tableId?: string; date?: string; time?: string; shiftId?: string }>();
  const { tables, shifts, createReservation, loading, error: catalogError } = useRestaurant();
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
  const [pending, setPending] = useState(false);
  const sending = useRef(false);
  const validDate = isCalendarDate(date);
  const validSelection = !!table && !!shift && validDate && shift.enabled && shift.day === weekday(date) && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
  const availability = useAvailability(validSelection ? tableId : '', validSelection ? date : '', validSelection ? shiftId : '');

  if (loading || catalogError) return <Screen title="Completa tu reserva" backHref="/">{null}</Screen>;
  if (!table || !shift || !validSelection) return <BookingRecovery />;
  const selectionHref = { pathname: '/reservar' as const, params: { tableId, date, shiftId, time } };
  const count = Number(people);
  const validPeople = /^\d+$/.test(people) && Number.isInteger(count) && count >= 1 && count <= table.capacity;
  const slotAvailable = !availability.loading && !availability.error && availability.slots.includes(time);

  async function confirm() {
    if (sending.current) return;
    setAttempted(true);
    if (name.trim().length < 2 || !validPeople) {
      setError('Revisa los campos marcados antes de confirmar.');
      return;
    }
    if (!slotAvailable) {
      setError('Espera a que termine la consulta y selecciona un horario disponible.');
      return;
    }
    sending.current = true;
    setPending(true);
    setError('');
    try {
      const result = await createReservation({ tableId, date, time, shiftId, name: name.trim(), people: count, contact: contact.trim() });
      if (!result.ok) {
        setError(result.error);
        availability.refresh();
        return;
      }
      setSubmitted(true);
      router.replace({ pathname: '/confirmacion', params: { id: result.id } });
    } catch {
      setError('No pudimos confirmar la reserva. Revisa tu conexión e inténtalo de nuevo.');
      availability.refresh();
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  return (
    <Screen title="Completa tu reserva" subtitle="Paso 2 de 2 · Solo necesitamos unos datos." backHref={selectionHref}>
      <BookingSummary table={table} date={date} time={time} duration={shift.duration} shiftName={shift.name} />
      {availability.loading && <Notice>Verificando que tu horario siga disponible…</Notice>}
      {!!availability.error && <><Notice tone="error">{availability.error}</Notice><Button label="Reintentar disponibilidad" variant="secondary" onPress={availability.refresh} disabled={pending} /></>}
      {!availability.loading && !availability.error && !slotAvailable && !submitted && <Notice tone="error">Este horario ya no está disponible. Regresa para elegir uno nuevo.</Notice>}
      <Field label="Nombre del cliente" value={name} onChangeText={setName} placeholder="Escribe tu nombre" autoCapitalize="words" maxLength={80} editable={!pending && !submitted} error={attempted && name.trim().length < 2 ? 'Escribe al menos 2 caracteres.' : undefined} />
      <Field label={`Número de personas (máximo ${table.capacity})`} value={people} onChangeText={setPeople} keyboardType="number-pad" maxLength={2} editable={!pending && !submitted} error={attempted && !validPeople ? `Ingresa un número entero entre 1 y ${table.capacity}.` : undefined} />
      <Field label="Contacto (opcional)" value={contact} onChangeText={setContact} placeholder="Teléfono o WhatsApp" keyboardType="phone-pad" maxLength={30} editable={!pending && !submitted} />
      <Notice>Revisa los datos antes de confirmar. Tu mesa quedará reservada cuando recibas la confirmación.</Notice>
      {!!error && <Notice tone="error">{error}</Notice>}
      <Button label={submitted ? 'Reserva guardada' : pending ? 'Confirmando reserva…' : 'Confirmar reserva'} onPress={() => { void confirm(); }} disabled={submitted || pending || !slotAvailable} />
      <Button label="Cambiar fecha u horario" variant="ghost" onPress={() => router.replace(selectionHref)} disabled={pending || submitted} />
    </Screen>
  );
}
