import { useState } from 'react';

import { isDateValue } from '@/components/admin/options';
import { AppText, Badge, Button, Card, Chip, EmptyState, Field, Notice, Row, Screen } from '@/components/konys/ui';
import { colors } from '@/constants/konys';
import { useDemo } from '@/state/demo-store';
import type { Reservation } from '@/types/demo';
import { addDays, formatDate, todayISO } from '@/utils/reservations';

export default function AdminReservationsScreen() {
  const { reservations, tables, updateReservationStatus } = useDemo();
  const [dateFilter, setDateFilter] = useState('todas');
  const [customDate, setCustomDate] = useState(todayISO());
  const [tableFilter, setTableFilter] = useState('todas');
  const [statusFilter, setStatusFilter] = useState<Reservation['status'] | 'todas'>('todas');
  const [cancelId, setCancelId] = useState('');
  const [message, setMessage] = useState('');
  const date = dateFilter === 'hoy' ? todayISO() : dateFilter === 'mañana' ? addDays(todayISO(), 1) : dateFilter === 'fecha' ? customDate : '';
  const dateValid = !date || isDateValue(date);
  const filtered = reservations.filter((reservation) => dateValid && (!date || reservation.date === date) && (tableFilter === 'todas' || reservation.tableId === tableFilter) && (statusFilter === 'todas' || reservation.status === statusFilter)).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  return (
    <Screen title="Reservas" subtitle="Consulta y organiza las visitas al restaurante." backHref="/admin">
      <Card>
        <AppText variant="label">Fecha</AppText>
        <Row>{[{ value: 'todas', label: 'Todas' }, { value: 'hoy', label: 'Hoy' }, { value: 'mañana', label: 'Mañana' }, { value: 'fecha', label: 'Otra fecha' }].map((filter) => <Chip key={filter.value} label={filter.label} selected={dateFilter === filter.value} onPress={() => setDateFilter(filter.value)} />)}</Row>
        {dateFilter === 'fecha' ? <Field label="Fecha (AAAA-MM-DD)" value={customDate} onChangeText={setCustomDate} placeholder="2026-11-14" maxLength={10} error={!dateValid ? 'Escribe una fecha válida con formato AAAA-MM-DD.' : undefined} /> : null}
        <AppText variant="label">Mesa</AppText>
        <Row><Chip label="Todas las mesas" selected={tableFilter === 'todas'} onPress={() => setTableFilter('todas')} />{tables.map((table) => <Chip key={table.id} label={table.name} selected={tableFilter === table.id} onPress={() => setTableFilter(table.id)} />)}</Row>
        <AppText variant="label">Estado</AppText>
        <Row>{(['todas', 'confirmada', 'completada', 'cancelada'] as const).map((status) => <Chip key={status} label={{ todas: 'Todos', confirmada: 'Confirmadas', completada: 'Completadas', cancelada: 'Canceladas' }[status]} selected={statusFilter === status} onPress={() => setStatusFilter(status)} />)}</Row>
        <Button label="Limpiar filtros" variant="ghost" onPress={() => { setDateFilter('todas'); setTableFilter('todas'); setStatusFilter('todas'); }} />
      </Card>
      {message ? <Notice tone="success">{message}</Notice> : null}
      <AppText variant="label">{filtered.length} reserva{filtered.length === 1 ? '' : 's'} encontrada{filtered.length === 1 ? '' : 's'}</AppText>
      {!filtered.length ? <EmptyState title="Sin reservas para estos filtros" message="Prueba otra fecha, mesa o estado. Las reservas que crees desde Inicio aparecerán aquí." /> : null}
      {filtered.map((reservation) => {
        const table = tables.find((item) => item.id === reservation.tableId);
        return (
          <Card key={reservation.id}>
            <Row><AppText variant="subtitle">{reservation.time} · {table?.name ?? 'Mesa'}</AppText><Badge label={reservation.status} tone={reservation.status === 'confirmada' ? 'success' : reservation.status === 'cancelada' ? 'danger' : 'neutral'} /></Row>
            <AppText color={colors.muted}>{formatDate(reservation.date)} · {reservation.duration} minutos</AppText>
            <AppText>{reservation.name} · {reservation.people} persona{reservation.people === 1 ? '' : 's'}</AppText>
            <AppText variant="caption">{table?.zone} · Contacto: {reservation.contact || 'No indicado'}</AppText>
            <AppText variant="caption">Código: {reservation.id}</AppText>
            {reservation.status === 'confirmada' && cancelId !== reservation.id ? <Row><Button label="Marcar completada" variant="secondary" onPress={() => { updateReservationStatus(reservation.id, 'completada'); setMessage('Reserva marcada como completada.'); }} /><Button label="Cancelar reserva" variant="ghost" onPress={() => setCancelId(reservation.id)} /></Row> : null}
            {cancelId === reservation.id && reservation.status === 'confirmada' ? <>
              <Notice>¿Cancelar la reserva de {reservation.name}? Su horario quedará libre.</Notice>
              <Row><Button label="Sí, cancelar reserva" variant="danger" onPress={() => { updateReservationStatus(reservation.id, 'cancelada'); setCancelId(''); setMessage('Reserva cancelada. El horario vuelve a estar disponible.'); }} /><Button label="Conservar reserva" variant="secondary" onPress={() => setCancelId('')} /></Row>
            </> : null}
          </Card>
        );
      })}
    </Screen>
  );
}
