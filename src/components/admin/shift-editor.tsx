import { useState } from 'react';

import { weekDays } from '@/components/admin/options';
import { useAdminAction } from '@/components/admin/use-admin-action';
import { AppText, Badge, Button, Card, Chip, Field, Notice, Row } from '@/components/konys/ui';
import { useRestaurant } from '@/state/restaurant-store';
import type { Shift } from '@/types/restaurant';

export function ShiftEditor({ shift, onCreated, onCancel }: { shift: Shift; onCreated?: () => void; onCancel?: () => void }) {
  const { saveShift } = useRestaurant();
  const [name, setName] = useState(shift.name);
  const [start, setStart] = useState(shift.start);
  const [end, setEnd] = useState(shift.end);
  const [duration, setDuration] = useState(String(shift.duration));
  const [enabled, setEnabled] = useState(shift.enabled);
  const [day, setDay] = useState(shift.day);
  const action = useAdminAction();
  const save = () => {
    if (!/^\d+$/.test(duration)) { action.setError('La duración debe ser un número entero de minutos.'); return; }
    void action.run(() => saveShift({ id: shift.id, name, start, end, duration: Number(duration), enabled, day }), 'Jornada guardada para el día seleccionado.', onCreated);
  };
  return (
    <Card>
      <Row><AppText variant="subtitle">{shift.id ? shift.name : 'Nueva jornada'}</AppText><Badge label={enabled ? 'Activa' : 'Pausada'} tone={enabled ? 'success' : 'neutral'} /></Row>
      <AppText variant="label">Día de la semana</AppText>
      <Row>{weekDays.map((item) => <Chip key={item.value} label={item.label} selected={day === item.value} disabled={action.pending} onPress={() => setDay(item.value)} />)}</Row>
      <Field label="Nombre de la jornada" value={name} onChangeText={setName} placeholder="Ej. Almuerzo" maxLength={40} editable={!action.pending} />
      <Field label="Hora de apertura (HH:mm)" value={start} onChangeText={setStart} placeholder="12:30" maxLength={5} keyboardType="numbers-and-punctuation" editable={!action.pending} />
      <Field label="Hora de cierre (HH:mm)" value={end} onChangeText={setEnd} placeholder="14:30" maxLength={5} keyboardType="numbers-and-punctuation" editable={!action.pending} />
      <Field label="Duración de cada reserva (minutos)" value={duration} onChangeText={setDuration} keyboardType="number-pad" maxLength={3} editable={!action.pending} />
      <Row>{[30, 60, 90, 120].map((minutes) => <Chip key={minutes} label={`${minutes} min`} selected={duration === String(minutes)} disabled={action.pending} onPress={() => setDuration(String(minutes))} />)}</Row>
      <Row><Chip label="Jornada activa" selected={enabled} disabled={action.pending} onPress={() => setEnabled(true)} /><Chip label="Jornada pausada" selected={!enabled} disabled={action.pending} onPress={() => setEnabled(false)} /></Row>
      {action.error ? <Notice tone="error">{action.error}</Notice> : null}
      {action.message ? <Notice tone="success">{action.message}</Notice> : null}
      <Button label={action.pending ? 'Guardando jornada…' : shift.id ? `Guardar ${name}` : 'Guardar nueva jornada'} onPress={save} disabled={action.pending} />
      {onCancel ? <Button label="Cancelar" variant="ghost" onPress={onCancel} disabled={action.pending} /> : null}
    </Card>
  );
}
