import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { categories } from '@/components/admin/options';
import { useAdminAction } from '@/components/admin/use-admin-action';
import { ProductArt } from '@/components/konys/product-art';
import { AppText, Badge, Button, Card, Chip, EmptyState, Notice, Row, Screen } from '@/components/konys/ui';
import { colors, space } from '@/constants/konys';
import { useRestaurant } from '@/state/restaurant-store';
import type { Category } from '@/types/restaurant';
import { formatMoney } from '@/utils/reservations';

export default function AdminMenuScreen() {
  const { dishes, toggleDish, loading } = useRestaurant();
  const [category, setCategory] = useState<Category | 'todas'>('todas');
  const action = useAdminAction();
  const filtered = dishes.filter((dish) => category === 'todas' || dish.category === category);
  return (
    <Screen eyebrow="ADMINISTRACIÓN / CARTA" title="Gestión de carta" subtitle="Sabores, precios y disponibilidad." backHref="/admin">
      <Row style={styles.toolbar}><AppText variant="label" color={colors.muted}>{dishes.length} platos en tu carta</AppText><Button label="+ Agregar plato" onPress={() => router.push('/admin/plato')} /></Row>
      <Row><Chip label="Todos" selected={category === 'todas'} onPress={() => setCategory('todas')} />{categories.map((item) => <Chip key={item.value} label={item.label} selected={category === item.value} onPress={() => setCategory(item.value)} />)}</Row>
      {action.message ? <Notice tone="success">{action.message}</Notice> : null}
      {action.error ? <Notice tone="error">{action.error}</Notice> : null}
      {action.pending ? <Notice>Actualizando visibilidad…</Notice> : null}
      {!filtered.length && !loading ? <EmptyState title="Sin platos en esta categoría" message="Agrega el primer plato para mostrarlo en la carta digital." /> : null}
      <View style={styles.grid}>{filtered.map((dish) => <Card key={dish.id} style={styles.dishCard}>
        <View style={styles.art}><ProductArt category={dish.category} dishId={dish.id} name={dish.name} /><View style={styles.visibility}><Badge label={dish.visible ? 'Visible' : 'Oculto'} tone={dish.visible ? 'success' : 'neutral'} /></View></View>
        <View style={styles.cardBody}>
          <AppText variant="caption" color={colors.muted} style={styles.category}>{categories.find((item) => item.value === dish.category)?.label}</AppText>
          <AppText variant="subtitle">{dish.name}</AppText>
          <AppText color={colors.muted} style={styles.description}>{dish.description}</AppText>
          <AppText variant="subtitle" color={colors.primary} style={styles.price}>{formatMoney(dish.price)}</AppText>
          <View style={styles.actions}><Button label={`Editar ${dish.name}`} variant="secondary" disabled={action.pending} onPress={() => router.push({ pathname: '/admin/plato', params: { id: dish.id } })} /><Button label={dish.visible ? 'Ocultar plato' : 'Mostrar plato'} variant="ghost" disabled={action.pending} onPress={() => { void action.run(() => toggleDish(dish.id), `${dish.name} ${dish.visible ? 'se ocultó de' : 'ya aparece en'} la carta del cliente.`); }} /></View>
        </View>
      </Card>)}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, alignItems: 'stretch' },
  dishCard: { padding: 0, gap: 0, overflow: 'hidden', flexBasis: 300, flexGrow: 1, flexShrink: 1, minWidth: 0 },
  art: { borderBottomWidth: 1, borderBottomColor: colors.border },
  visibility: { position: 'absolute', top: space.md, left: space.md },
  cardBody: { padding: space.xl, gap: space.md, flexGrow: 1 },
  category: { textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700', fontSize: 10 },
  description: { flexGrow: 1 },
  price: { fontSize: 24, lineHeight: 31, paddingTop: space.xs },
  actions: { gap: space.sm, marginTop: space.xs, paddingTop: space.lg, borderTopWidth: 1, borderTopColor: colors.border },
});
