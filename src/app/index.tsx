import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Button, Card, Chip, EmptyState, Row, Screen, Section } from '@/components/konys/ui';
import { tableLabels, tableTones } from '@/components/client/booking';
import { colors } from '@/constants/konys';
import { useDemo } from '@/state/demo-store';

export default function HomeScreen() {
  const { tables, shifts } = useDemo();
  const [zone, setZone] = useState('Todas');
  const zones = ['Todas', ...new Set(tables.map((table) => table.zone))];
  const filtered = tables.filter((table) => zone === 'Todas' || table.zone === zone);
  const enabledShifts = shifts.filter((shift) => shift.enabled);

  return (
    <Screen title="Encuentra tu mesa ideal" subtitle="Un buen momento empieza con un lugar para compartir.">
      <Card style={styles.welcome}>
        <AppText variant="label" color="#FFFFFF">BIENVENIDO A KONYS PIZZA</AppText>
        <AppText variant="subtitle" color="#FFFFFF">Tu próxima visita empieza aquí.</AppText>
        <AppText color="#D5E4E6">Elige una mesa y consulta los horarios para tu reserva.</AppText>
      </Card>
      <Card>
        <AppText variant="label">HORARIO DEL RESTAURANTE</AppText>
        {enabledShifts.length ? enabledShifts.map((shift) => (
          <Row key={shift.id}>
            <AppText>{shift.name}</AppText>
            <AppText color={colors.muted}>{shift.start} – {shift.end}</AppText>
          </Row>
        )) : <AppText color={colors.muted}>No hay jornadas habilitadas por el momento.</AppText>}
        <AppText variant="caption">Hora de Colombia · Horarios de demostración</AppText>
      </Card>
      <Section title="Selecciona una mesa" action={<Badge label={`${tables.filter((table) => table.status === 'disponible').length} habilitadas`} tone="success" />}>
        <Row>{zones.map((item) => <Chip key={item} label={item} selected={zone === item} onPress={() => setZone(item)} />)}</Row>
        <View style={styles.grid}>
          {filtered.map((table) => (
            <Card key={table.id} style={styles.table}>
              <Row><AppText variant="subtitle">{table.name}</AppText><Badge label={tableLabels[table.status]} tone={tableTones[table.status]} /></Row>
              <AppText color={colors.muted}>{table.zone} · Hasta {table.capacity} personas</AppText>
              <Button label={table.status === 'disponible' ? `Ver horarios · ${table.name}` : 'No disponible'} variant="secondary" disabled={table.status !== 'disponible'} onPress={() => router.push({ pathname: '/reservar', params: { tableId: table.id } })} />
            </Card>
          ))}
        </View>
        {!filtered.length && <EmptyState title="Sin mesas en esta zona" message="Selecciona otra zona para consultar las mesas." />}
      </Section>
      <AppText variant="caption">La disponibilidad final depende de la fecha y el horario que selecciones.</AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  welcome: { backgroundColor: colors.primary, borderColor: colors.primary, paddingVertical: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  table: { flexBasis: 290, flexGrow: 1, minWidth: 0 },
});
