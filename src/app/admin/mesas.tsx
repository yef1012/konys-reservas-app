import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { tableStates, tableTone } from '@/components/admin/options';
import { useAdminAction } from '@/components/admin/use-admin-action';
import { Icon } from '@/components/konys/icon';
import { AppText, Badge, Button, Card, Chip, Notice, Row, Screen } from '@/components/konys/ui';
import { colors, radii, space } from '@/constants/konys';
import { useRestaurant } from '@/state/restaurant-store';

export default function AdminTablesScreen() {
  const { tables, updateTableStatus } = useRestaurant();
  const action = useAdminAction();
  return (
    <Screen eyebrow="ADMINISTRACIÓN / MESAS" title="Gestión de mesas" subtitle="Organiza los espacios de KONYS PIZZA." backHref="/admin">
      <Row style={styles.toolbar}><AppText variant="label" color={colors.muted}>{tables.length} mesas en el restaurante</AppText><Button label="+ Nueva mesa" onPress={() => router.push('/admin/nueva-mesa')} /></Row>
      {action.message ? <Notice tone="success">{action.message}</Notice> : null}
      {action.error ? <Notice tone="error">{action.error}</Notice> : null}
      {action.pending ? <Notice>Actualizando estado…</Notice> : null}
      <Notice>Solo las mesas disponibles aceptan nuevas reservas. Cambiar su estado no cancela las reservas existentes.</Notice>
      <View style={styles.grid}>{tables.map((table) => (
        <Card key={table.id} style={styles.tableCard}>
          <Row style={styles.cardHeading}><View style={styles.tableIcon}><Icon name="table" size={30} color={colors.primary} /></View><Badge label={tableStates.find((state) => state.value === table.status)?.label ?? table.status} tone={tableTone(table.status)} /></Row>
          <AppText variant="subtitle">{table.name}</AppText>
          <Row><Icon name="pin" size={17} color={colors.muted} /><AppText color={colors.muted}>{table.zone}</AppText></Row>
          <Row><Icon name="people" size={17} color={colors.muted} /><AppText color={colors.muted}>Capacidad para {table.capacity} personas</AppText></Row>
          <View style={styles.divider} />
          <AppText variant="caption" color={colors.muted} style={styles.label}>DISPONIBILIDAD DE LA MESA</AppText>
          <Row>{tableStates.map((state) => <Chip key={state.value} label={state.label} disabled={action.pending} selected={table.status === state.value} onPress={() => { void action.run(() => updateTableStatus(table.id, state.value), `${table.name}: ${state.label.toLowerCase()}.`); }} />)}</Row>
        </Card>
      ))}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  tableCard: { flexBasis: 320, flexGrow: 1, flexShrink: 1, minWidth: 0, gap: space.md },
  cardHeading: { justifyContent: 'space-between', marginBottom: space.xs },
  tableIcon: { width: 58, height: 58, borderRadius: radii.md, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: space.xs },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
});
