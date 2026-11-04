import { useState } from 'react';

import { AppText, Badge, Button, Card, Chip, Field, Notice, Row } from '@/components/konys/ui';
import { useDemo } from '@/state/demo-store';
import type { Shift } from '@/types/demo';

export function ShiftEditor({ shift, onCreated, onCancel }: { shift: Shift; onCreated?: () => void; onCancel?: () => void }) {
  const { saveShift } = useDemo();
  const [name, setName] = useState(shift.name);
  const [start, setStart] = useState(shift.start);
  const [end, setEnd] = useState(shift.end);
  const [duration, setDuration] = useState(String(shift.duration));
  const [enabled, setEnabled] = useState(shift.enabled);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const save = () => {
    setMessage('');
    if (!/^\d+$/.test(duration)) { setError('La duración debe ser un número entero de minutos.'); return; }
    const result = saveShift({ id: shift.id, name, start, end, duration: Number(duration), enabled });
    if (!result.ok) { setError(result.error); return; }
    setError('');
    setMessage('Jornada guardada. Los nuevos horarios ya están disponibles para los clientes.');
    onCreated?.();
  };
  return (
    <Card>
      <Row><AppText variant="subtitle">{shift.id ? shift.name : 'Nueva jornada'}</AppText><Badge label={enabled ? 'Activa' : 'Pausada'} tone={enabled ? 'success' : 'neutral'} /></Row>
      <Field label="Nombre de la jornada" value={name} onChangeText={setName} placeholder="Ej. Almuerzo" maxLength={40} />
      <Field label="Hora de apertura (HH:mm)" value={start} onChangeText={setStart} placeholder="12:30" maxLength={5} keyboardType="numbers-and-punctuation" />
      <Field label="Hora de cierre (HH:mm)" value={end} onChangeText={setEnd} placeholder="14:30" maxLength={5} keyboardType="numbers-and-punctuation" />
      <Field label="Duración de cada reserva (minutos)" value={duration} onChangeText={setDuration} keyboardType="number-pad" maxLength={3} />
      <Row>{[30, 60, 90, 120].map((minutes) => <Chip key={minutes} label={`${minutes} min`} selected={duration === String(minutes)} onPress={() => setDuration(String(minutes))} />)}</Row>
      <Row><Chip label="Jornada activa" selected={enabled} onPress={() => setEnabled(true)} /><Chip label="Jornada pausada" selected={!enabled} onPress={() => setEnabled(false)} /></Row>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {message ? <Notice tone="success">{message}</Notice> : null}
      <Button label={shift.id ? `Guardar ${shift.name}` : 'Guardar nueva jornada'} onPress={save} />
      {onCancel ? <Button label="Cancelar" variant="ghost" onPress={onCancel} /> : null}
    </Card>
  );
}
