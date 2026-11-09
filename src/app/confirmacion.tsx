import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BookingRecovery, BookingSteps, BookingSummary, queryValue } from '@/components/client/booking';
import { Icon } from '@/components/konys/icon';
import { AppText, Badge, Button, Card, Notice, Row, Screen } from '@/components/konys/ui';
import { colors, radii, space } from '@/constants/konys';
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
      <View style={styles.column}>
        <Card><View style={styles.referenceIcon}><Icon name="calendar" size={28} color={colors.primary} /></View><AppText variant="label">REFERENCIA DE RESERVA</AppText><View style={styles.reference}><AppText style={styles.referenceCode}>{id}</AppText></View></Card>
        <Notice>Los detalles del comprobante no están disponibles después de recargar o abrir el enlace en otro dispositivo. Si ya recibiste la confirmación, recargar esta pantalla no cancela tu reserva.</Notice>
        <AppText variant="caption">Esta pantalla no puede verificar el estado de la referencia del enlace.</AppText>
        <Button label="Volver al inicio" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
  const confirmed = reservation.status === 'confirmada';

  return (
    <Screen title={confirmed ? '¡Reserva confirmada!' : 'Detalle de la reserva'} subtitle="El siguiente buen momento ya tiene lugar.">
      <View style={styles.column}>
        <BookingSteps current={3} />
        <Card style={styles.ticket}>
          <View style={styles.ticketBrand}><AppText variant="caption" color={colors.onDark} style={styles.brandLabel}>KONYS PIZZA · TU RESERVA</AppText></View>
          <View style={styles.confirmation}>
            <View style={[styles.check, !confirmed && styles.neutralCheck]}><Icon name={confirmed ? 'check' : 'calendar'} size={36} color={confirmed ? colors.success : colors.primary} /></View>
            <AppText variant="subtitle" style={styles.center}>{confirmed ? 'Nos vemos en KONYS PIZZA' : 'Tu comprobante de reserva'}</AppText>
            <Badge label={reservation.status === 'confirmada' ? 'Confirmada' : reservation.status === 'cancelada' ? 'Cancelada' : 'Completada'} tone={confirmed ? 'success' : 'neutral'} />
          </View>
          {table ? <BookingSummary table={table} date={reservation.date} time={reservation.time} duration={reservation.duration} shiftName={shift?.name ?? 'Jornada'} embedded />
            : <View style={styles.fallback}><AppText variant="label">TU RESERVA</AppText><AppText>Mesa: {reservation.tableId}</AppText><AppText>{formatDate(reservation.date)}</AppText><AppText>{reservation.time} · {reservation.duration} minutos</AppText><AppText variant="caption">Hora de Colombia</AppText></View>}
          <View style={styles.ticketSeam}><View style={styles.cutLeft} /><View style={styles.dashedLine} /><View style={styles.cutRight} /></View>
          <View style={styles.guest}>
            <AppText variant="caption" style={styles.eyebrow}>RESERVA A NOMBRE DE</AppText>
            <AppText variant="subtitle">{reservation.name}</AppText>
            <Row style={styles.smallRow}><Icon name="people" size={17} color={colors.primary} /><AppText>{reservation.people} {reservation.people === 1 ? 'persona' : 'personas'}</AppText></Row>
            {!!reservation.contact && <AppText variant="caption">Contacto: {reservation.contact}</AppText>}
            <View style={styles.reference}><AppText variant="caption" style={styles.eyebrow}>REFERENCIA</AppText><AppText style={styles.referenceCode}>{reservation.id}</AppText></View>
          </View>
        </Card>
        <Notice tone={confirmed ? 'success' : 'info'}>{confirmed ? 'Tu reserva quedó registrada. Te esperamos en la fecha y hora seleccionadas.' : 'El estado de esta reserva se actualizó desde el panel administrativo.'}</Notice>
        <AppText variant="caption" style={styles.center}>Conserva la referencia y los detalles antes de salir de esta pantalla.</AppText>
        <View style={styles.actions}><Button label="Volver al inicio" onPress={() => router.replace('/')} /><Button label="Explorar la carta" variant="secondary" onPress={() => router.replace('/carta')} /></View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: space.xl },
  ticket: { padding: 0, gap: 0, overflow: 'hidden', borderRadius: radii.lg },
  ticketBrand: { backgroundColor: colors.deep, paddingVertical: 14, paddingHorizontal: space.xl, alignItems: 'center' },
  brandLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
  confirmation: { alignItems: 'center', justifyContent: 'center', gap: space.md, paddingVertical: space.xxl, paddingHorizontal: space.lg },
  check: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: '#F3FAF5', marginBottom: space.xs },
  neutralCheck: { backgroundColor: colors.soft, borderColor: colors.background },
  center: { textAlign: 'center' },
  fallback: { padding: space.xl, gap: space.sm },
  ticketSeam: { height: 22, justifyContent: 'center', position: 'relative', backgroundColor: colors.surface },
  dashedLine: { marginHorizontal: space.lg, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.border },
  cutLeft: { position: 'absolute', left: -11, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  cutRight: { position: 'absolute', right: -11, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  guest: { padding: space.xl, paddingTop: space.lg, gap: space.sm },
  eyebrow: { fontSize: 10, lineHeight: 17, letterSpacing: 1.2, fontWeight: '700' },
  smallRow: { gap: space.sm },
  reference: { gap: space.xs, padding: space.lg, backgroundColor: colors.soft, borderRadius: radii.sm, marginTop: space.sm },
  referenceCode: { fontSize: 12, lineHeight: 20, letterSpacing: 0.3, color: colors.primary },
  referenceIcon: { width: 56, height: 56, borderRadius: radii.md, backgroundColor: colors.warm, justifyContent: 'center', alignItems: 'center' },
  actions: { gap: space.md },
});
