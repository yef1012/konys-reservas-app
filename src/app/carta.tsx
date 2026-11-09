import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Card, Chip, EmptyState, Row, Screen, Section } from '@/components/konys/ui';
import { Icon } from '@/components/konys/icon';
import { ProductArt } from '@/components/konys/product-art';
import { colors, radii } from '@/constants/konys';
import { useRestaurant } from '@/state/restaurant-store';
import { useLayoutWidth } from '@/hooks/use-layout-width';
import type { Category } from '@/types/restaurant';
import { formatMoney } from '@/utils/reservations';

const categories: { id: Category; label: string }[] = [
  { id: 'pizzas', label: 'Pizzas' }, { id: 'entradas', label: 'Entradas' },
  { id: 'postres', label: 'Postres' }, { id: 'bebidas', label: 'Bebidas' },
];

export default function MenuScreen() {
  const { dishes, loading, error } = useRestaurant();
  const width = useLayoutWidth();
  const cardWidth = width >= 1000 ? '31.8%' : width >= 640 ? '48%' : '100%';
  const [category, setCategory] = useState<Category | 'todas'>('todas');
  const visibleDishes = dishes.filter((dish) => dish.visible);

  return (
    <Screen title="El sabor tiene su lugar." subtitle="Explora la carta de KONYS PIZZA y encuentra tu próximo favorito." eyebrow="NUESTRA CARTA">
      <View style={styles.menuBanner}><View style={styles.bannerIcon}><Icon name="menu" size={24} color={colors.accent} /></View><View style={styles.bannerCopy}><AppText variant="label" color={colors.surface}>Buenos sabores. Mejores momentos.</AppText><AppText variant="caption" color={colors.onDark}>Carta de consulta · Precios en pesos colombianos (COP)</AppText></View></View>
      {!loading && !error && <Row>
        <Chip label="Todo" selected={category === 'todas'} onPress={() => setCategory('todas')} />
        {categories.map((item) => <Chip key={item.id} label={item.label} selected={category === item.id} onPress={() => setCategory(item.id)} />)}
      </Row>}
      {!loading && !error && category === 'todas' && !visibleDishes.length && <EmptyState title="Estamos preparando la carta" message="Pronto podrás descubrir los platos disponibles del restaurante." />}
      {!loading && !error && categories.filter((item) => category === 'todas' ? visibleDishes.some((dish) => dish.category === item.id) : category === item.id).map((item) => {
        const products = visibleDishes.filter((dish) => dish.category === item.id);
        return (
          <Section key={item.id} title={item.label} action={<Badge label={`${products.length} platos`} />}>
            <View style={styles.grid}>
              {products.map((dish) => (
                <Card key={dish.id} style={[styles.dish, { width: cardWidth }]}>
                  <ProductArt category={dish.category} dishId={dish.id} name={dish.name} />
                  <View style={styles.dishBody}>
                    <AppText variant="caption" color={colors.accentDark} style={styles.category}>{item.label}</AppText>
                    <AppText variant="subtitle">{dish.name}</AppText>
                    <AppText color={colors.muted} style={styles.description}>{dish.description}</AppText>
                    <Row style={styles.priceRow}><AppText variant="subtitle" color={colors.primary} style={styles.price}>{formatMoney(dish.price)}</AppText><AppText variant="caption" color={colors.muted}>COP</AppText></Row>
                  </View>
                </Card>
              ))}
            </View>
            {!products.length && <EmptyState title="Pronto tendremos más sabores" message="No hay platos visibles en esta categoría por ahora." />}
          </Section>
        );
      })}
      <View style={styles.reference}><Icon name="info" size={16} color={colors.muted} /><AppText variant="caption" color={colors.muted}>Precios de referencia publicados en Rappi para KONYS PIZZA El Prado. Pueden variar en el punto de venta.</AppText></View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  menuBanner: { backgroundColor: colors.primary, padding: 22, borderRadius: radii.lg, flexDirection: 'row', alignItems: 'center', gap: 16 },
  bannerIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF12', borderRadius: radii.md },
  bannerCopy: { flex: 1, minWidth: 0, gap: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  dish: { minWidth: 0, padding: 0, gap: 0, overflow: 'hidden' },
  dishBody: { flex: 1, padding: 22, gap: 10 },
  category: { textTransform: 'uppercase', letterSpacing: 1.4, fontSize: 10, fontWeight: '700' },
  description: { flexGrow: 1, fontSize: 14, lineHeight: 23 },
  priceRow: { paddingTop: 16, marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, justifyContent: 'space-between' },
  price: { fontSize: 24, fontWeight: '800', lineHeight: 30 },
  reference: { padding: 16, borderRadius: radii.md, backgroundColor: colors.soft, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
});
