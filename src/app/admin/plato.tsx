import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { categories } from '@/components/admin/options';
import { useAdminAction } from '@/components/admin/use-admin-action';
import { AppText, Button, Card, Chip, EmptyState, Field, Notice, Row, Screen } from '@/components/konys/ui';
import { useRestaurant } from '@/state/restaurant-store';
import type { Category, Dish } from '@/types/restaurant';

export default function DishScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const { dishes, loading, error } = useRestaurant();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const dish = dishes.find((item) => item.id === id);
  if (id && loading) return <Screen title="Editar plato" backHref="/admin/carta"><Notice>Cargando información del plato…</Notice></Screen>;
  if (id && !dish) return <Screen title="Plato no encontrado" backHref="/admin/carta"><EmptyState title="Este plato no está disponible" message={error || 'Vuelve a la carta para seleccionar un plato disponible.'} /><Button label="Volver a la carta" onPress={() => router.replace('/admin/carta')} /></Screen>;
  return <DishForm key={id ?? 'nuevo'} dish={dish} />;
}

function DishForm({ dish }: { dish?: Dish }) {
  const { saveDish } = useRestaurant();
  const [name, setName] = useState(dish?.name ?? '');
  const [description, setDescription] = useState(dish?.description ?? '');
  const [category, setCategory] = useState<Category>(dish?.category ?? 'pizzas');
  const [price, setPrice] = useState(dish ? String(dish.price) : '');
  const [visible, setVisible] = useState(dish?.visible ?? true);
  const action = useAdminAction();
  const save = () => {
    if (!/^\d+$/.test(price)) { action.setError('Escribe el precio en pesos, sin puntos ni comas. Ejemplo: 28000.'); return; }
    void action.run(() => saveDish({ id: dish?.id, name, description, category, price: Number(price), visible }), '', () => router.replace('/admin/carta'));
  };
  return (
    <Screen title={dish ? 'Editar plato' : 'Nuevo plato'} subtitle="Información que verán tus clientes." backHref="/admin/carta">
      <Card>
        <Field label="Nombre del plato" placeholder="Ej. Pizza especial" value={name} onChangeText={setName} maxLength={80} editable={!action.pending} />
        <Field label="Descripción" placeholder="Ingredientes y detalles del plato" value={description} onChangeText={setDescription} multiline maxLength={300} editable={!action.pending} />
        <AppText variant="label">Categoría</AppText>
        <Row>{categories.map((item) => <Chip key={item.value} label={item.label} selected={category === item.value} disabled={action.pending} onPress={() => setCategory(item.value)} />)}</Row>
        <Field label="Precio en pesos colombianos (COP)" placeholder="Ej. 28000" value={price} onChangeText={setPrice} keyboardType="number-pad" maxLength={8} editable={!action.pending} />
        <AppText variant="label">Visibilidad en la carta</AppText>
        <Row><Chip label="Visible" selected={visible} disabled={action.pending} onPress={() => setVisible(true)} /><Chip label="Oculto" selected={!visible} disabled={action.pending} onPress={() => setVisible(false)} /></Row>
        {action.error ? <Notice tone="error">{action.error}</Notice> : null}
        <Button label={action.pending ? 'Guardando plato…' : dish ? 'Guardar cambios' : 'Agregar plato'} onPress={save} disabled={action.pending} />
        <Button label="Cancelar" variant="ghost" disabled={action.pending} onPress={() => router.replace('/admin/carta')} />
      </Card>
    </Screen>
  );
}
