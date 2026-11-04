import { router } from 'expo-router';
import { AppText, Button, Card, EmptyState, Row, Screen } from '@/components/konys/ui';
import type { Table, TableStatus } from '@/types/demo';
import { formatDate, isValidDate } from '@/utils/reservations';

export const tableLabels: Record<TableStatus, string> = {
  disponible: 'Disponible', reservada: 'Reservada', ocupada: 'Ocupada', mantenimiento: 'Mantenimiento',
};
export const tableTones: Record<TableStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  disponible: 'success', reservada: 'warning', ocupada: 'danger', mantenimiento: 'neutral',
};

export function queryValue(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : '';
}

export const isCalendarDate = isValidDate;

export function BookingRecovery({ message = 'Selecciona nuevamente una mesa, fecha y horario para continuar.' }: { message?: string }) {
  return <Screen title="Retomemos tu reserva" backHref="/"><EmptyState title="No encontramos esta selección" message={message} /><Button label="Elegir mesa" onPress={() => router.replace('/')} /></Screen>;
}

export function BookingSummary({ table, date, time, duration, shiftName }: { table: Table; date: string; time: string; duration: number; shiftName: string }) {
  return (
    <Card>
      <AppText variant="label">TU RESERVA</AppText>
      <AppText variant="subtitle">{table.name} · {table.zone}</AppText>
      <AppText>{formatDate(date)}</AppText>
      <Row><AppText>{shiftName} · {time}</AppText><AppText variant="caption">{duration} minutos</AppText></Row>
      <AppText variant="caption">Hasta {table.capacity} personas · Hora de Colombia</AppText>
    </Card>
  );
}
