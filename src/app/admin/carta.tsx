import { router } from 'expo-router';
import { useState } from 'react';

import { categories } from '@/components/admin/options';
import { AppText, Badge, Button, Card, Chip, EmptyState, Notice, Row, Screen } from '@/components/konys/ui';
import { colors } from '@/constants/konys';
import { useDemo } from '@/state/demo-store';
import type { Category } from '@/types/demo';
import { formatMoney } from '@/utils/reservations';

export default function AdminMenuScreen() {
  const { dishes, toggleDish } = useDemo();
  const [category, setCategory] = useState<Category | 'todas'>('todas');
  const [message, setMessage] = useState('');
  const filtered = dishes.filter((dish) => category === 'todas' || dish.category === category);
  return (
    <Screen title="Gestión de carta" subtitle="Sabores, precios y disponibilidad." backHref="/admin">
      <Button label="+ Agregar plato" onPress={() => router.push('/admin/plato')} />
      <Row><Chip label="Todos" selected={category === 'todas'} onPress={() => setCategory('todas')} />{categories.map((item) => <Chip key={item.value} label={item.label} selected={category === item.value} onPress={() => setCategory(item.value)} />)}</Row>
      {message ? <Notice tone="success">{message}</Notice> : null}
      {!filtered.length ? <EmptyState title="Sin platos en esta categoría" message="Agrega el primer plato para mostrarlo en la carta digital." /> : null}
      {filtered.map((dish) => <Card key={dish.id}>
        <Row><AppText variant="subtitle">{dish.name}</AppText><Badge label={dish.visible ? 'Visible' : 'Oculto'} tone={dish.visible ? 'success' : 'neutral'} /></Row>
        <AppText color={colors.muted}>{categories.find((item) => item.value === dish.category)?.label} · {formatMoney(dish.price)}</AppText>
        <AppText>{dish.description}</AppText>
        <Row><Button label={`Editar ${dish.name}`} variant="secondary" onPress={() => router.push({ pathname: '/admin/plato', params: { id: dish.id } })} /><Button label={dish.visible ? 'Ocultar plato' : 'Mostrar plato'} variant="ghost" onPress={() => { toggleDish(dish.id); setMessage(`${dish.name} ${dish.visible ? 'se ocultó de' : 'ya aparece en'} la carta del cliente.`); }} /></Row>
      </Card>)}
    </Screen>
  );
}
