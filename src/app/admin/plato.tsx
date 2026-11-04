import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';

import { categories } from '@/components/admin/options';
import { AppText, Button, Card, Chip, EmptyState, Field, Notice, Row, Screen } from '@/components/konys/ui';
import { useDemo } from '@/state/demo-store';
import type { Category, Dish } from '@/types/demo';

export default function DishScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const { dishes } = useDemo();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const dish = dishes.find((item) => item.id === id);
  if (id && !dish) return <Screen title="Plato no encontrado" backHref="/admin/carta"><EmptyState title="Este plato no está disponible" message="Los datos locales se reinician al recargar. Vuelve a la carta para seleccionar un plato." /><Button label="Volver a la carta" onPress={() => router.replace('/admin/carta')} /></Screen>;
  return <DishForm key={id ?? 'nuevo'} dish={dish} />;
}

function DishForm({ dish }: { dish?: Dish }) {
  const { saveDish } = useDemo();
  const [name, setName] = useState(dish?.name ?? '');
  const [description, setDescription] = useState(dish?.description ?? '');
  const [category, setCategory] = useState<Category>(dish?.category ?? 'pizzas');
  const [price, setPrice] = useState(dish ? String(dish.price) : '');
  const [visible, setVisible] = useState(dish?.visible ?? true);
  const [error, setError] = useState('');
  const saved = useRef(false);
  const save = () => {
    if (saved.current) return;
    if (!/^\d+$/.test(price)) { setError('Escribe el precio en pesos, sin puntos ni comas. Ejemplo: 28000.'); return; }
    const result = saveDish({ id: dish?.id, name, description, category, price: Number(price), visible });
    if (!result.ok) { setError(result.error); return; }
    saved.current = true;
    router.replace('/admin/carta');
  };
  return (
    <Screen title={dish ? 'Editar plato' : 'Nuevo plato'} subtitle="Información que verán tus clientes." backHref="/admin/carta">
      <Card>
        <Field label="Nombre del plato" placeholder="Ej. Pizza especial" value={name} onChangeText={setName} maxLength={80} />
        <Field label="Descripción" placeholder="Ingredientes y detalles del plato" value={description} onChangeText={setDescription} multiline maxLength={300} />
        <AppText variant="label">Categoría</AppText>
        <Row>{categories.map((item) => <Chip key={item.value} label={item.label} selected={category === item.value} onPress={() => setCategory(item.value)} />)}</Row>
        <Field label="Precio en pesos colombianos (COP)" placeholder="Ej. 28000" value={price} onChangeText={setPrice} keyboardType="number-pad" maxLength={8} />
        <AppText variant="label">Visibilidad en la carta</AppText>
        <Row><Chip label="Visible" selected={visible} onPress={() => setVisible(true)} /><Chip label="Oculto" selected={!visible} onPress={() => setVisible(false)} /></Row>
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Button label={dish ? 'Guardar cambios' : 'Agregar plato'} onPress={save} />
        <Button label="Cancelar" variant="ghost" onPress={() => router.replace('/admin/carta')} />
      </Card>
    </Screen>
  );
}
