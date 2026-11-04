import { router } from 'expo-router';

import { tableStates, tableTone } from '@/components/admin/options';
import { useAdminAction } from '@/components/admin/use-admin-action';
import { AppText, Badge, Button, Card, Chip, Notice, Row, Screen } from '@/components/konys/ui';
import { colors } from '@/constants/konys';
import { useRestaurant } from '@/state/restaurant-store';

export default function AdminTablesScreen() {
  const { tables, updateTableStatus } = useRestaurant();
  const action = useAdminAction();
  return (
    <Screen title="Gestión de mesas" subtitle="Organiza los espacios de KONYS PIZZA." backHref="/admin">
      <Button label="+ Nueva mesa" onPress={() => router.push('/admin/nueva-mesa')} />
      {action.message ? <Notice tone="success">{action.message}</Notice> : null}
      {action.error ? <Notice tone="error">{action.error}</Notice> : null}
      {action.pending ? <Notice>Actualizando estado…</Notice> : null}
      <Notice>Solo las mesas disponibles aceptan nuevas reservas. Cambiar su estado no cancela las reservas existentes.</Notice>
      {tables.map((table) => (
        <Card key={table.id}>
          <Row><AppText variant="subtitle">{table.name}</AppText><Badge label={tableStates.find((state) => state.value === table.status)?.label ?? table.status} tone={tableTone(table.status)} /></Row>
          <AppText color={colors.muted}>{table.zone} · Capacidad para {table.capacity} personas</AppText>
          <AppText variant="label">Cambiar estado</AppText>
          <Row>{tableStates.map((state) => <Chip key={state.value} label={state.label} disabled={action.pending} selected={table.status === state.value} onPress={() => { void action.run(() => updateTableStatus(table.id, state.value), `${table.name}: ${state.label.toLowerCase()}.`); }} />)}</Row>
        </Card>
      ))}
    </Screen>
  );
}
