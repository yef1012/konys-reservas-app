import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Button, Card, Chip, EmptyState, Row, Screen, Section } from '@/components/konys/ui';
import { tableLabels, tableTones } from '@/components/client/booking';
import { colors, radii } from '@/constants/konys';
import { Icon } from '@/components/konys/icon';
import { ProductArt } from '@/components/konys/product-art';
import { useRestaurant } from '@/state/restaurant-store';
import { useLayoutWidth } from '@/hooks/use-layout-width';
import { weekday } from '@/utils/availability';
import { todayISO } from '@/utils/reservations';

export default function HomeScreen() {
  const { tables, shifts, loading, error } = useRestaurant();
  const width = useLayoutWidth();
  const wide = width >= 760;
  const [zone, setZone] = useState('Todas');
  const zones = ['Todas', ...new Set(tables.map((table) => table.zone))];
  const filtered = tables.filter((table) => zone === 'Todas' || table.zone === zone);
  const enabledShifts = shifts.filter((shift) => shift.enabled && shift.day === weekday(todayISO()));
  const ready = !loading && !error;

  return (
    <Screen title="KONYS PIZZA" hideHeading>
      <View style={[styles.hero, wide && styles.heroWide]}>
        <View style={[styles.heroCopy, wide && styles.heroCopyWide]}>
          <Row style={styles.eyebrowRow}><View style={styles.orangeLine} /><AppText variant="caption" color={colors.accent} style={styles.eyebrow}>KONYS PIZZA · BUCARAMANGA</AppText></Row>
          <AppText variant="title" color={colors.surface} style={[styles.heroTitle, wide && styles.heroTitleWide]}>Un cono de sabor.{ '\n' }Un lugar para{ '\n' }compartir.</AppText>
          <AppText color={colors.onDark} style={styles.heroDescription}>Tu próxima visita empieza aquí. Elige tu mesa y disfruta un buen momento en KONYS PIZZA.</AppText>
          <View style={styles.cta}><Button label="Reservar mesa" icon="arrow" onPress={() => router.push('/reservar')} /></View>
          <Row style={styles.heroCaption}><Icon name="calendar" size={15} color={colors.onDark} /><AppText variant="caption" color={colors.onDark}>Elige tu mesa, fecha y horario</AppText></Row>
        </View>
        <View style={[styles.heroArt, wide && styles.heroArtWide]}><ProductArt hero /><View style={styles.heroStamp}><AppText variant="caption" color={colors.onDark}>HECHO PARA</AppText><AppText variant="label" color={colors.surface}>compartir.</AppText></View></View>
      </View>
      {ready && <Card style={styles.hours}>
        <View style={styles.hoursLabel}><View style={styles.clockIcon}><Icon name="clock" size={24} /></View><View><AppText variant="label">Hoy en KONYS</AppText><AppText variant="caption" color={colors.muted}>Hora de Colombia</AppText></View></View>
        <View style={styles.hoursContent}>{enabledShifts.length ? enabledShifts.map((shift) => (
          <View key={shift.id} style={styles.shift}><AppText variant="caption" color={colors.muted}>{shift.name}</AppText><AppText variant="label">{shift.start} – {shift.end}</AppText></View>
        )) : <AppText color={colors.muted}>No hay jornadas habilitadas para hoy. Consulta otra fecha al reservar.</AppText>}</View>
      </Card>}
      {ready && <Section title="Tu mesa te espera" action={<Badge label={`${tables.filter((table) => table.status === 'disponible').length} habilitadas`} tone="success" />}>
        <AppText color={colors.muted}>Encuentra el espacio ideal para tu visita.</AppText>
        <Row>{zones.map((item) => <Chip key={item} label={item} selected={zone === item} onPress={() => setZone(item)} />)}</Row>
        <View style={styles.grid}>
          {filtered.map((table) => (
            <Card key={table.id} style={[styles.table, { width: width >= 1000 ? '31.8%' : wide ? '48%' : '100%' }]}>
              <Row style={styles.tableTop}><View style={[styles.tableIcon, table.status !== 'disponible' && styles.tableInactive]}><Icon name="table" size={30} /></View><Badge label={tableLabels[table.status]} tone={tableTones[table.status]} /></Row>
              <View style={styles.tableInfo}><AppText variant="subtitle">{table.name}</AppText><Row style={styles.detail}><Icon name="pin" size={15} color={colors.muted} /><AppText variant="caption" color={colors.muted}>{table.zone}</AppText></Row></View>
              <Row style={styles.capacity}><Icon name="people" size={17} /><AppText variant="label">Hasta {table.capacity} personas</AppText></Row>
              <Button label={table.status === 'disponible' ? `Ver horarios · ${table.name}` : 'No disponible'} variant="secondary" icon="arrow" disabled={table.status !== 'disponible'} onPress={() => router.push({ pathname: '/reservar', params: { tableId: table.id } })} />
            </Card>
          ))}
        </View>
        {!filtered.length && <EmptyState title={tables.length ? 'Sin mesas en esta zona' : 'Sin mesas registradas'} message={tables.length ? 'Selecciona otra zona para consultar las mesas.' : 'Pronto podrás consultar las mesas del restaurante.'} />}
      </Section>}
      <Row><Icon name="info" size={16} color={colors.muted} /><AppText variant="caption" color={colors.muted}>La disponibilidad final depende de la fecha y el horario que selecciones.</AppText></Row>
      <Card style={styles.menuInvite}><View style={styles.inviteCopy}><AppText variant="caption" color={colors.accentDark} style={styles.eyebrow}>EL PLAN SE COMPLETA EN LA MESA</AppText><AppText variant="subtitle">Dale un vistazo al sabor.</AppText><AppText color={colors.muted}>Explora nuestra carta antes de tu visita.</AppText></View><Button label="Explorar la carta" variant="secondary" icon="menu" onPress={() => router.push('/carta')} /></Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.deep, borderRadius: radii.xl, overflow: 'hidden' },
  heroWide: { flexDirection: 'row', alignItems: 'center' },
  heroCopy: { padding: 26, gap: 20, zIndex: 1 },
  heroCopyWide: { width: '58%', padding: 44, paddingRight: 12 },
  eyebrowRow: { gap: 9 }, orangeLine: { width: 20, height: 2, backgroundColor: colors.accent },
  eyebrow: { fontSize: 9, letterSpacing: 1.5, fontWeight: '800', lineHeight: 16 },
  heroTitle: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -1.2 },
  heroTitleWide: { fontSize: 48, lineHeight: 55, letterSpacing: -1.8 },
  heroDescription: { maxWidth: 380, lineHeight: 25 },
  cta: { alignSelf: 'flex-start', minWidth: 190, marginTop: 3 },
  heroCaption: { gap: 7 },
  heroArt: { width: '100%', maxWidth: 290, alignSelf: 'center', marginTop: -20 },
  heroArtWide: { width: '42%', maxWidth: 430, marginTop: 0, paddingRight: 16 },
  heroStamp: { position: 'absolute', bottom: 20, right: 18, borderLeftWidth: 2, borderLeftColor: colors.accent, paddingLeft: 10 },
  hours: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 22, paddingVertical: 20 },
  hoursLabel: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clockIcon: { width: 46, height: 46, borderRadius: radii.md, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  hoursContent: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, flexGrow: 1, flexShrink: 1, minWidth: 0, flexBasis: 250 },
  shift: { gap: 3, borderLeftWidth: 2, borderLeftColor: colors.accent, paddingLeft: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  table: { minWidth: 0, flexShrink: 1, flexGrow: 1 },
  tableTop: { justifyContent: 'space-between', gap: 8 },
  tableIcon: { width: 56, height: 56, borderRadius: radii.md, backgroundColor: colors.warm, alignItems: 'center', justifyContent: 'center' },
  tableInactive: { backgroundColor: colors.soft },
  tableInfo: { gap: 5 }, detail: { gap: 5 },
  capacity: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, gap: 8 },
  menuInvite: { backgroundColor: colors.warm, borderColor: '#F0DCCB', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 20 },
  inviteCopy: { flexGrow: 1, flexShrink: 1, minWidth: 0, flexBasis: 250, gap: 7 },
});
