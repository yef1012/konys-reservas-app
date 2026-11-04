import { router } from 'expo-router';
import { useRef, useState } from 'react';

import { tableStates } from '@/components/admin/options';
import { AppText, Button, Card, Chip, Field, Notice, Row, Screen } from '@/components/konys/ui';
import { useDemo } from '@/state/demo-store';
import type { TableStatus } from '@/types/demo';

export default function NewTableScreen() {
  const { addTable } = useDemo();
  const [name, setName] = useState('');
  const [zone, setZone] = useState('Terraza');
  const [capacity, setCapacity] = useState('4');
  const [status, setStatus] = useState<TableStatus>('disponible');
  const [error, setError] = useState('');
  const saved = useRef(false);
  const save = () => {
    if (saved.current) return;
    if (!/^\d+$/.test(capacity)) { setError('La capacidad debe ser un número entero positivo.'); return; }
    const result = addTable({ name, zone, capacity: Number(capacity), status });
    if (!result.ok) { setError(result.error); return; }
    saved.current = true;
    router.replace('/admin/mesas');
  };
  return (
    <Screen title="Nueva mesa" subtitle="Agrega un espacio para compartir." backHref="/admin/mesas">
      <Card>
        <Field label="Nombre o número de mesa" placeholder="Ej. Mesa 9" value={name} onChangeText={setName} maxLength={50} />
        <Field label="Zona" placeholder="Ej. Terraza" value={zone} onChangeText={setZone} maxLength={40} />
        <Row>{['Terraza', 'Salón', 'Patio'].map((item) => <Chip key={item} label={item} selected={zone === item} onPress={() => setZone(item)} />)}</Row>
        <Field label="Capacidad de personas" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" maxLength={2} />
        <AppText variant="label">Estado inicial</AppText>
        <Row>{tableStates.map((state) => <Chip key={state.value} label={state.label} selected={status === state.value} onPress={() => setStatus(state.value)} />)}</Row>
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Button label="Guardar mesa" onPress={save} />
        <Button label="Cancelar" variant="ghost" onPress={() => router.replace('/admin/mesas')} />
      </Card>
    </Screen>
  );
}
