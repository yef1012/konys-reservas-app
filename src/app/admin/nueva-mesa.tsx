import { router } from 'expo-router';
import { useState } from 'react';

import { tableStates } from '@/components/admin/options';
import { useAdminAction } from '@/components/admin/use-admin-action';
import { AppText, Button, Card, Chip, Field, Notice, Row, Screen } from '@/components/konys/ui';
import { useRestaurant } from '@/state/restaurant-store';
import type { TableStatus } from '@/types/restaurant';

export default function NewTableScreen() {
  const { addTable } = useRestaurant();
  const [name, setName] = useState('');
  const [zone, setZone] = useState('Terraza');
  const [capacity, setCapacity] = useState('4');
  const [status, setStatus] = useState<TableStatus>('disponible');
  const action = useAdminAction();
  const save = () => {
    if (!/^\d+$/.test(capacity)) { action.setError('La capacidad debe ser un número entero positivo.'); return; }
    void action.run(() => addTable({ name, zone, capacity: Number(capacity), status }), '', () => router.replace('/admin/mesas'));
  };
  return (
    <Screen title="Nueva mesa" subtitle="Agrega un espacio para compartir." backHref="/admin/mesas">
      <Card>
        <Field label="Nombre o número de mesa" placeholder="Ej. Mesa 9" value={name} onChangeText={setName} maxLength={50} editable={!action.pending} />
        <Field label="Zona" placeholder="Ej. Terraza" value={zone} onChangeText={setZone} maxLength={40} editable={!action.pending} />
        <Row>{['Terraza', 'Salón', 'Patio'].map((item) => <Chip key={item} label={item} selected={zone === item} disabled={action.pending} onPress={() => setZone(item)} />)}</Row>
        <Field label="Capacidad de personas" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" maxLength={2} editable={!action.pending} />
        <AppText variant="label">Estado inicial</AppText>
        <Row>{tableStates.map((state) => <Chip key={state.value} label={state.label} selected={status === state.value} disabled={action.pending} onPress={() => setStatus(state.value)} />)}</Row>
        {action.error ? <Notice tone="error">{action.error}</Notice> : null}
        <Button label={action.pending ? 'Guardando mesa…' : 'Guardar mesa'} onPress={save} disabled={action.pending} />
        <Button label="Cancelar" variant="ghost" disabled={action.pending} onPress={() => router.replace('/admin/mesas')} />
      </Card>
    </Screen>
  );
}
