import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BookingRecovery, BookingSummary, queryValue } from '@/components/client/booking';
import { AppText, Badge, Button, Card, Notice, Screen } from '@/components/konys/ui';
import { colors } from '@/constants/konys';
import { useDemo } from '@/state/demo-store';

export default function ConfirmationScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { reservations, tables, shifts } = useDemo();
  const reservation = reservations.find((item) => item.id === queryValue(params.id));
  const table = tables.find((item) => item.id === reservation?.tableId);
  const shift = shifts.find((item) => item.id === reservation?.shiftId);

  if (!reservation || !table) return <BookingRecovery message="Esta reserva no se encuentra en la sesión actual. Los datos de demostración se reinician al recargar la app." />;
  const confirmed = reservation.status === 'confirmada';

  return (
    <Screen title={confirmed ? '¡Reserva confirmada!' : 'Detalle de la reserva'} subtitle="Conserva estos detalles para consultar tu selección.">
      <View style={styles.confirmation}><AppText style={styles.check} color={colors.success}>{confirmed ? '✓' : '•'}</AppText><Badge label={reservation.status === 'confirmada' ? 'Confirmada' : reservation.status === 'cancelada' ? 'Cancelada' : 'Completada'} tone={confirmed ? 'success' : 'neutral'} /></View>
      <BookingSummary table={table} date={reservation.date} time={reservation.time} duration={reservation.duration} shiftName={shift?.name ?? 'Jornada'} />
      <Card>
        <AppText variant="label">DATOS DEL CLIENTE</AppText>
        <AppText variant="subtitle">{reservation.name}</AppText>
        <AppText>{reservation.people} {reservation.people === 1 ? 'persona' : 'personas'}</AppText>
        {!!reservation.contact && <AppText>Contacto: {reservation.contact}</AppText>}
        <AppText variant="caption">Referencia: {reservation.id}</AppText>
      </Card>
      <Notice tone={confirmed ? 'success' : 'info'}>{confirmed ? 'El horario quedó reservado en esta demo. También puedes verlo en el panel administrativo.' : 'El estado de esta reserva se actualizó desde el panel administrativo.'}</Notice>
      <AppText variant="caption">Datos locales de prueba. Esta confirmación no corresponde a una reserva real.</AppText>
      <Button label="Volver al inicio" onPress={() => router.replace('/')} />
      <Button label="Explorar la carta" variant="secondary" onPress={() => router.replace('/carta')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  confirmation: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  check: { fontSize: 56, lineHeight: 64, fontWeight: '700' },
});
