import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/konys/icon';
import { AppText, Button, Card, EmptyState, Row, Screen } from '@/components/konys/ui';
import { colors, radii } from '@/constants/konys';
import type { Table, TableStatus } from '@/types/restaurant';
import { formatDate, isValidDate } from '@/utils/reservations';

export const tableLabels: Record<TableStatus, string> = {
  disponible: 'Disponible', reservada: 'Reservada', ocupada: 'Ocupada', mantenimiento: 'Inactiva',
};
export const tableTones: Record<TableStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  disponible: 'success', reservada: 'warning', ocupada: 'danger', mantenimiento: 'neutral',
};

export function queryValue(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : '';
}

export const isCalendarDate = isValidDate;

export function BookingSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <View style={styles.steps} accessibilityLabel={`Paso ${current} de 3`}>
      {['Mesa y horario', 'Tus datos', 'Confirmación'].map((label, index) => {
        const active = index + 1 === current;
        const complete = index + 1 < current;
        return (
          <View key={label} style={styles.step}>
            <View style={styles.stepTop}>
              <View style={[styles.stepNumber, active && styles.stepActive, complete && styles.stepComplete]}>
                {complete ? <Icon name="check" size={14} color={colors.surface} /> : <AppText style={styles.numberText} color={active ? colors.primary : colors.muted}>{`0${index + 1}`}</AppText>}
              </View>
              {index < 2 && <View style={[styles.stepLine, complete && styles.stepLineComplete]} />}
            </View>
            <AppText variant="caption" color={active || complete ? colors.primary : colors.muted} style={active ? styles.activeLabel : styles.stepLabel}>{label}</AppText>
          </View>
        );
      })}
    </View>
  );
}

export function DateOption({ value, label, selected, onPress }: { value: string; label: string; selected: boolean; onPress: () => void }) {
  const parsed = new Date(`${value}T12:00:00Z`);
  const day = new Intl.DateTimeFormat('es-CO', { weekday: 'short', timeZone: 'UTC' }).format(parsed).replace('.', '');
  const month = new Intl.DateTimeFormat('es-CO', { month: 'short', timeZone: 'UTC' }).format(parsed).replace('.', '');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={formatDate(value)} accessibilityState={{ selected }} onPress={onPress}
      style={({ pressed }) => [styles.date, selected && styles.dateSelected, pressed && styles.pressed]}>
      <AppText variant="caption" color={selected ? colors.surface : colors.muted} style={styles.dateDay}>{label === 'Hoy' || label === 'Mañana' ? label : day}</AppText>
      <AppText color={selected ? colors.surface : colors.primary} style={styles.dateNumber}>{value.slice(8)}</AppText>
      <AppText variant="caption" color={selected ? colors.accent : colors.muted} style={styles.dateMonth}>{month}</AppText>
    </Pressable>
  );
}

export function BookingRecovery({ message = 'Selecciona nuevamente una mesa, fecha y horario para continuar.' }: { message?: string }) {
  return <Screen title="Retomemos tu reserva" backHref="/"><View style={styles.formWidth}><EmptyState title="No encontramos esta selección" message={message} /><Button label="Elegir mesa" onPress={() => router.replace('/')} /></View></Screen>;
}

export function BookingSummary({ table, date, time, duration, shiftName, embedded = false }: { table: Table; date: string; time: string; duration: number; shiftName: string; embedded?: boolean }) {
  return (
    <Card style={[styles.summary, embedded && styles.embedded]}>
      <View style={styles.summaryHead}>
        <View style={styles.tableIcon}><Icon name="table" size={26} color={colors.surface} /></View>
        <View style={styles.summaryName}>
          <AppText variant="caption" color={colors.onDark} style={styles.eyebrow}>TU MESA</AppText>
          <AppText variant="subtitle" color={colors.surface}>{table.name}</AppText>
          <Row style={styles.smallRow}><Icon name="pin" size={13} color={colors.onDark} /><AppText variant="caption" color={colors.onDark}>{table.zone}</AppText></Row>
        </View>
      </View>
      <View style={styles.summaryBody}>
        <View style={styles.detail}><View style={styles.detailIcon}><Icon name="calendar" size={18} color={colors.primary} /></View><View style={styles.detailText}><AppText variant="caption">Fecha de tu visita</AppText><AppText variant="label">{formatDate(date)}</AppText></View></View>
        <View style={styles.detail}><View style={styles.detailIcon}><Icon name="clock" size={18} color={colors.primary} /></View><View style={styles.detailText}><AppText variant="caption">{shiftName}</AppText><AppText variant="label">{time} · {duration} minutos</AppText></View></View>
        <Row style={styles.summaryFoot}><Icon name="people" size={15} color={colors.muted} /><AppText variant="caption">Hasta {table.capacity} personas · Hora de Colombia</AppText></Row>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  formWidth: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: 20 },
  steps: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  step: { flex: 1, minWidth: 0, gap: 9 },
  stepTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  stepActive: { backgroundColor: colors.accent },
  stepComplete: { backgroundColor: colors.primary },
  numberText: { fontSize: 11, fontWeight: '800', lineHeight: 16 },
  stepLine: { height: 1, backgroundColor: colors.border, flex: 1 },
  stepLineComplete: { backgroundColor: colors.primary },
  stepLabel: { fontSize: 11, lineHeight: 16 },
  activeLabel: { fontSize: 11, lineHeight: 16, fontWeight: '700' },
  date: { width: 70, minHeight: 94, paddingHorizontal: 6, paddingVertical: 11, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.surface },
  dateSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateDay: { fontSize: 11, lineHeight: 17, textTransform: 'capitalize', fontWeight: '600' },
  dateNumber: { fontSize: 25, lineHeight: 32, fontWeight: '800' },
  dateMonth: { fontSize: 10, lineHeight: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  pressed: { opacity: 0.8 },
  summary: { padding: 0, gap: 0, overflow: 'hidden', borderRadius: radii.lg },
  embedded: { borderWidth: 0, borderRadius: 0, boxShadow: 'none', elevation: 0 },
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.primary, padding: 20 },
  tableIcon: { width: 52, height: 52, borderRadius: radii.md, backgroundColor: '#FFFFFF16', alignItems: 'center', justifyContent: 'center' },
  summaryName: { flex: 1, minWidth: 0, gap: 3 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6, lineHeight: 16 },
  smallRow: { gap: 5 },
  summaryBody: { gap: 15, padding: 20 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailIcon: { width: 34, height: 34, borderRadius: radii.sm, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  detailText: { flex: 1, minWidth: 0, gap: 2 },
  summaryFoot: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 13, gap: 7 },
});
