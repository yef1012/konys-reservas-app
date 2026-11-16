import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BookingRecovery, BookingSteps, DateOption, isCalendarDate, queryValue } from '@/components/client/booking';
import { Icon } from '@/components/konys/icon';
import { AppText, Badge, Button, Card, Chip, EmptyState, Field, Notice, Row, Screen, Section } from '@/components/konys/ui';
import { colors, radii } from '@/constants/konys';
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

  if ((loading && !tables.length) || catalogError) return <Screen title="Reservar mesa" backHref="/">{null}</Screen>;
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
    <Screen title="Reserva tu mesa" subtitle="Elige el lugar y el momento. Nosotros ponemos el sabor." backHref="/">
      <View style={styles.column}>
        <BookingSteps current={1} />
        {table && <Card style={styles.selectedTable}>
          <View style={styles.tableHeader}>
            <View style={styles.tableIcon}><Icon name="table" size={30} color={colors.surface} /></View>
            <View style={styles.tableName}><AppText variant="caption" color={colors.onDark} style={styles.eyebrow}>TU MESA SELECCIONADA</AppText><AppText variant="subtitle" color={colors.surface}>{table.name}</AppText><Row style={styles.smallRow}><Icon name="pin" size={14} color={colors.onDark} /><AppText variant="caption" color={colors.onDark}>{table.zone}</AppText></Row></View>
          </View>
          <Row><Badge label={`Hasta ${table.capacity} personas`} /><AppText variant="caption" color={colors.onDark}>Espacio para compartir.</AppText></Row>
        </Card>}
        <Card>
          <Section title="Elige tu mesa">
            <Row>{enabledTables.map((item) => <Chip key={item.id} label={`${item.name} · ${item.zone}`} selected={tableId === item.id} onPress={() => { setTableId(item.id); setTime(''); setError(''); }} />)}</Row>
            {!enabledTables.length && <EmptyState title="Sin mesas habilitadas" message="Por ahora no hay mesas habilitadas para nuevas reservas." />}
            {table && table.status !== 'disponible' && <Notice tone="error">Esta mesa no está habilitada para reservar. Elige otra mesa.</Notice>}
          </Section>
        </Card>
        <Card>
          <Section title="¿Qué día nos visitas?" action={<Icon name="calendar" size={21} color={colors.primary} />}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRail}>
              {Array.from({ length: 14 }, (_, index) => {
                const value = addDays(todayISO(), index);
                const label = index === 0 ? 'Hoy' : index === 1 ? 'Mañana' : `${value.slice(8)}/${value.slice(5, 7)}`;
                return <DateOption key={value} value={value} label={label} selected={date === value} onPress={() => changeDate(value)} />;
              })}
            </ScrollView>
            <Field label="Otra fecha (AAAA-MM-DD)" placeholder={todayISO()} value={date} onChangeText={changeDate} autoCapitalize="none" maxLength={10} error={!validDate ? 'Usa una fecha real de hoy en adelante: AAAA-MM-DD.' : undefined} />
            {validDate && <Row style={styles.smallRow}><Icon name="check" size={14} color={colors.success} /><AppText variant="caption" color={colors.primary}>{formatDate(date)}</AppText></Row>}
          </Section>
        </Card>
        <Card style={styles.scheduleCard}>
          <Section title="El momento perfecto">
            <AppText variant="caption">Selecciona una jornada</AppText>
            <Row>{enabledShifts.map((item) => <Chip key={item.id} label={`${item.name} · ${item.start}–${item.end}`} selected={shiftId === item.id} onPress={() => { setSelectedShiftId(item.id); setTime(''); setError(''); }} />)}</Row>
            {!enabledShifts.length && <EmptyState title="Sin jornadas disponibles" message="No hay jornadas habilitadas para esta fecha. Elige otro día." />}
          </Section>
          <View style={styles.divider} />
          <Section title="Horarios disponibles" action={<Icon name="clock" size={20} color={colors.primary} />}>
            {availability.loading ? <Notice>Consultando horarios disponibles…</Notice>
              : availability.error ? <><Notice tone="error">{availability.error}</Notice><Button label="Reintentar disponibilidad" variant="secondary" onPress={availability.refresh} /></>
              : slots.length ? <Row>{slots.map((slot) => <Chip key={slot} label={slot} selected={time === slot} onPress={() => { setTime(slot); setError(''); }} />)}</Row>
              : <EmptyState title="No hay horarios para esta selección" message="Prueba otra fecha, jornada o mesa. Solo mostramos horarios libres y futuros." />}
            {shift && <AppText variant="caption">Reserva de {shift.duration} minutos · Hora de Colombia.</AppText>}
          </Section>
        </Card>
        {!!error && <Notice tone="error">{error}</Notice>}
        <View style={styles.actions}><Button label="Continuar con mis datos" onPress={continueBooking} disabled={!table || !validDate || availability.loading || !!availability.error || !slots.includes(time)} /><AppText variant="caption" style={styles.center}>Tu mesa está a un paso de estar lista.</AppText></View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: 20 },
  selectedTable: { backgroundColor: colors.primary, borderColor: colors.primary, gap: 18 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  tableIcon: { width: 60, height: 60, borderRadius: radii.md, backgroundColor: '#FFFFFF16', alignItems: 'center', justifyContent: 'center' },
  tableName: { flex: 1, minWidth: 0, gap: 4 },
  eyebrow: { fontSize: 10, lineHeight: 15, letterSpacing: 1.1, fontWeight: '700' },
  smallRow: { gap: 6 },
  dateRail: { gap: 8, paddingBottom: 4 },
  scheduleCard: { gap: 22 },
  divider: { height: 1, backgroundColor: colors.border },
  actions: { gap: 10, paddingTop: 2 },
  center: { textAlign: 'center' },
});
