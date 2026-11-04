import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BookingRecovery, BookingSummary, queryValue } from '@/components/client/booking';
import { AppText, Badge, Button, Card, Notice, Screen } from '@/components/konys/ui';
import { colors } from '@/constants/konys';
import { useRestaurant } from '@/state/restaurant-store';
import { formatDate } from '@/utils/reservations';

export default function ConfirmationScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { confirmation, reservations, tables, shifts, loading } = useRestaurant();
  const id = queryValue(params.id);
  const reservation = confirmation?.id === id ? confirmation : reservations.find((item) => item.id === id);
  const table = tables.find((item) => item.id === reservation?.tableId);
  const shift = shifts.find((item) => item.id === reservation?.shiftId);

  if (loading && !reservation) return <Screen title="Detalle de la reserva">{null}</Screen>;
  if (!reservation && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return <BookingRecovery message="El enlace no contiene una referencia de reserva válida." />;
  if (!reservation) return (
    <Screen title="Referencia de tu reserva" subtitle="Conserva este código para consultar con el restaurante.">
      <Card><AppText variant="label">REFERENCIA</AppText><AppText>{id}</AppText></Card>
      <Notice>Los detalles del comprobante no están disponibles después de recargar o abrir el enlace en otro dispositivo. Si ya recibiste la confirmación, recargar esta pantalla no cancela tu reserva.</Notice>
      <AppText variant="caption">Esta pantalla no puede verificar el estado de la referencia del enlace.</AppText>
      <Button label="Volver al inicio" onPress={() => router.replace('/')} />
    </Screen>
  );
  const confirmed = reservation.status === 'confirmada';

  return (
    <Screen title={confirmed ? '¡Reserva confirmada!' : 'Detalle de la reserva'} subtitle="Conserva estos detalles para consultar tu selección.">
      <View style={styles.confirmation}><AppText style={styles.check} color={colors.success}>{confirmed ? '✓' : '•'}</AppText><Badge label={reservation.status === 'confirmada' ? 'Confirmada' : reservation.status === 'cancelada' ? 'Cancelada' : 'Completada'} tone={confirmed ? 'success' : 'neutral'} /></View>
      {table ? <BookingSummary table={table} date={reservation.date} time={reservation.time} duration={reservation.duration} shiftName={shift?.name ?? 'Jornada'} />
        : <Card><AppText variant="label">TU RESERVA</AppText><AppText>Mesa: {reservation.tableId}</AppText><AppText>{formatDate(reservation.date)}</AppText><AppText>{reservation.time} · {reservation.duration} minutos</AppText><AppText variant="caption">Hora de Colombia</AppText></Card>}
      <Card>
        <AppText variant="label">DATOS DEL CLIENTE</AppText>
        <AppText variant="subtitle">{reservation.name}</AppText>
        <AppText>{reservation.people} {reservation.people === 1 ? 'persona' : 'personas'}</AppText>
        {!!reservation.contact && <AppText>Contacto: {reservation.contact}</AppText>}
        <AppText variant="caption">Referencia: {reservation.id}</AppText>
      </Card>
      <Notice tone={confirmed ? 'success' : 'info'}>{confirmed ? 'Tu reserva quedó registrada. Te esperamos en la fecha y hora seleccionadas.' : 'El estado de esta reserva se actualizó desde el panel administrativo.'}</Notice>
      <AppText variant="caption">Conserva la referencia y los detalles antes de salir de esta pantalla.</AppText>
      <Button label="Volver al inicio" onPress={() => router.replace('/')} />
      <Button label="Explorar la carta" variant="secondary" onPress={() => router.replace('/carta')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  confirmation: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  check: { fontSize: 56, lineHeight: 64, fontWeight: '700' },
});
