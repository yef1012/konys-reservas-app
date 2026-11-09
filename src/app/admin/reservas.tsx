import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isDateValue } from '@/components/admin/options';
import { useAdminAction } from '@/components/admin/use-admin-action';
import { Icon } from '@/components/konys/icon';
import { AppText, Badge, Button, Card, Chip, EmptyState, Field, Notice, Row, Screen } from '@/components/konys/ui';
import { colors, radii, space } from '@/constants/konys';
import { useRestaurant } from '@/state/restaurant-store';
import type { Reservation } from '@/types/restaurant';
import { addDays, formatDate, todayISO } from '@/utils/reservations';

export default function AdminReservationsScreen() {
  const { reservations, tables, updateReservationStatus, loading } = useRestaurant();
  const [dateFilter, setDateFilter] = useState('todas');
  const [customDate, setCustomDate] = useState(todayISO());
  const [tableFilter, setTableFilter] = useState('todas');
  const [statusFilter, setStatusFilter] = useState<Reservation['status'] | 'todas'>('todas');
  const [cancelId, setCancelId] = useState('');
  const action = useAdminAction();
  const date = dateFilter === 'hoy' ? todayISO() : dateFilter === 'mañana' ? addDays(todayISO(), 1) : dateFilter === 'fecha' ? customDate : '';
  const dateValid = !date || isDateValue(date);
  const filtered = reservations.filter((reservation) => dateValid && (!date || reservation.date === date) && (tableFilter === 'todas' || reservation.tableId === tableFilter) && (statusFilter === 'todas' || reservation.status === statusFilter)).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  return (
    <Screen eyebrow="ADMINISTRACIÓN / RESERVAS" title="Reservas" subtitle="Consulta y organiza las visitas al restaurante." backHref="/admin">
      <Card style={styles.filters}>
        <Row style={styles.filterHeading}><View style={styles.filterIcon}><Icon name="search" size={21} color={colors.primary} /></View><AppText variant="subtitle">Encuentra una visita</AppText></Row>
        <Row><Icon name="calendar" size={17} color={colors.muted} /><AppText variant="label">Fecha</AppText></Row>
        <Row>{[{ value: 'todas', label: 'Todas' }, { value: 'hoy', label: 'Hoy' }, { value: 'mañana', label: 'Mañana' }, { value: 'fecha', label: 'Otra fecha' }].map((filter) => <Chip key={filter.value} label={filter.label} selected={dateFilter === filter.value} onPress={() => setDateFilter(filter.value)} />)}</Row>
        {dateFilter === 'fecha' ? <Field label="Fecha (AAAA-MM-DD)" value={customDate} onChangeText={setCustomDate} placeholder="2026-11-14" maxLength={10} error={!dateValid ? 'Escribe una fecha válida con formato AAAA-MM-DD.' : undefined} /> : null}
        <Row style={styles.filterDivider}><Icon name="table" size={17} color={colors.muted} /><AppText variant="label">Mesa</AppText></Row>
        <Row><Chip label="Todas las mesas" selected={tableFilter === 'todas'} onPress={() => setTableFilter('todas')} />{tables.map((table) => <Chip key={table.id} label={table.name} selected={tableFilter === table.id} onPress={() => setTableFilter(table.id)} />)}</Row>
        <Row style={styles.filterDivider}><Icon name="check" size={17} color={colors.muted} /><AppText variant="label">Estado</AppText></Row>
        <Row>{(['todas', 'confirmada', 'completada', 'cancelada'] as const).map((status) => <Chip key={status} label={{ todas: 'Todos', confirmada: 'Confirmadas', completada: 'Completadas', cancelada: 'Canceladas' }[status]} selected={statusFilter === status} onPress={() => setStatusFilter(status)} />)}</Row>
        <Button label="Limpiar filtros" variant="ghost" onPress={() => { setDateFilter('todas'); setTableFilter('todas'); setStatusFilter('todas'); }} />
      </Card>
      {action.message ? <Notice tone="success">{action.message}</Notice> : null}
      {action.error ? <Notice tone="error">{action.error}</Notice> : null}
      {action.pending ? <Notice>Actualizando reserva…</Notice> : null}
      <Row style={styles.resultsHeading}><AppText variant="subtitle">Listado de reservas</AppText><Badge label={`${filtered.length} encontrada${filtered.length === 1 ? '' : 's'}`} /></Row>
      {!filtered.length && !loading ? <EmptyState title="Sin reservas para estos filtros" message="Prueba otra fecha, mesa o estado. Las reservas que crees desde Inicio aparecerán aquí." /> : null}
      {filtered.map((reservation) => {
        const table = tables.find((item) => item.id === reservation.tableId);
        return (
          <Card key={reservation.id} style={styles.reservation}>
            <Row style={styles.resultsHeading}><Row><View style={styles.time}><Icon name="clock" size={17} color={colors.primary} /><AppText variant="label" color={colors.primary}>{reservation.time}</AppText></View><AppText variant="subtitle">{table?.name ?? 'Mesa'}</AppText></Row><Badge label={reservation.status} tone={reservation.status === 'confirmada' ? 'success' : reservation.status === 'cancelada' ? 'danger' : 'neutral'} /></Row>
            <AppText color={colors.muted}>{formatDate(reservation.date)} · {reservation.duration} minutos</AppText>
            <Row><Icon name="people" size={18} color={colors.muted} /><AppText>{reservation.name} · {reservation.people} persona{reservation.people === 1 ? '' : 's'}</AppText></Row>
            <AppText variant="caption">{table?.zone} · Contacto: {reservation.contact || 'No indicado'}</AppText>
            <AppText variant="caption" color={colors.muted} style={styles.reference}>Código: {reservation.id}</AppText>
            {reservation.status === 'confirmada' && cancelId !== reservation.id ? <Row><Button label="Marcar completada" variant="secondary" disabled={action.pending} onPress={() => { void action.run(() => updateReservationStatus(reservation.id, 'completada'), 'Reserva marcada como completada.'); }} /><Button label="Cancelar reserva" variant="ghost" disabled={action.pending} onPress={() => setCancelId(reservation.id)} /></Row> : null}
            {cancelId === reservation.id && reservation.status === 'confirmada' ? <>
              <Notice>¿Cancelar la reserva de {reservation.name}? Su horario quedará libre.</Notice>
              <Row><Button label={action.pending ? 'Cancelando…' : 'Sí, cancelar reserva'} variant="danger" disabled={action.pending} onPress={() => { void action.run(() => updateReservationStatus(reservation.id, 'cancelada'), 'Reserva cancelada.', () => setCancelId('')); }} /><Button label="Conservar reserva" variant="secondary" disabled={action.pending} onPress={() => setCancelId('')} /></Row>
            </> : null}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { gap: space.lg, padding: space.xl },
  filterHeading: { marginBottom: space.sm },
  filterIcon: { width: 42, height: 42, borderRadius: radii.sm, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  filterDivider: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.lg, marginTop: space.xs },
  resultsHeading: { justifyContent: 'space-between' },
  reservation: { gap: space.md, borderLeftWidth: 3, borderLeftColor: colors.primary },
  time: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.soft, borderRadius: radii.sm, paddingHorizontal: space.md, paddingVertical: space.sm },
  reference: { paddingTop: space.md, marginTop: space.xs, borderTopWidth: 1, borderTopColor: colors.border },
});
