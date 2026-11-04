import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Card, Chip, EmptyState, Notice, Row, Screen, Section } from '@/components/konys/ui';
import { colors } from '@/constants/konys';
import { useDemo } from '@/state/demo-store';
import type { Category } from '@/types/demo';
import { formatMoney } from '@/utils/reservations';

const categories: { id: Category; label: string }[] = [
  { id: 'pizzas', label: 'Pizzas' }, { id: 'entradas', label: 'Entradas' },
  { id: 'postres', label: 'Postres' }, { id: 'bebidas', label: 'Bebidas' },
];

export default function MenuScreen() {
  const { dishes } = useDemo();
  const [category, setCategory] = useState<Category | 'todas'>('todas');
  const visibleDishes = dishes.filter((dish) => dish.visible);

  return (
    <Screen title="Carta digital" subtitle="Sabores para compartir, del primer bocado al postre.">
      <Notice>Productos y precios ilustrativos en pesos colombianos (COP). Carta de consulta.</Notice>
      <Row>
        <Chip label="Todo" selected={category === 'todas'} onPress={() => setCategory('todas')} />
        {categories.map((item) => <Chip key={item.id} label={item.label} selected={category === item.id} onPress={() => setCategory(item.id)} />)}
      </Row>
      {categories.filter((item) => category === 'todas' || category === item.id).map((item) => {
        const products = visibleDishes.filter((dish) => dish.category === item.id);
        return (
          <Section key={item.id} title={item.label} action={<Badge label={`${products.length} platos`} />}>
            <View style={styles.grid}>
              {products.map((dish) => (
                <Card key={dish.id} style={styles.dish}>
                  <AppText variant="subtitle">{dish.name}</AppText>
                  <AppText color={colors.muted} style={styles.description}>{dish.description}</AppText>
                  <AppText variant="subtitle" color={colors.primary}>{formatMoney(dish.price)}</AppText>
                </Card>
              ))}
            </View>
            {!products.length && <EmptyState title="Pronto tendremos más sabores" message="No hay platos visibles en esta categoría por ahora." />}
          </Section>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  dish: { flexBasis: 290, flexGrow: 1, minWidth: 0, borderTopColor: colors.accent, borderTopWidth: 3 },
  description: { flexGrow: 1 },
});
