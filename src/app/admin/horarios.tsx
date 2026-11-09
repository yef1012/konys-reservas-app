import { useState } from 'react';

import { ShiftEditor } from '@/components/admin/shift-editor';
import { Button, EmptyState, Notice, Screen } from '@/components/konys/ui';
import { useRestaurant } from '@/state/restaurant-store';

export default function AdminShiftsScreen() {
  const { shifts, loading } = useRestaurant();
  const [adding, setAdding] = useState(false);
  return (
    <Screen eyebrow="ADMINISTRACIÓN / HORARIOS" title="Jornadas y horarios" subtitle="Define cuándo y por cuánto tiempo recibir reservas." backHref="/admin">
      <Notice>Cada jornada se aplica únicamente al día de la semana indicado, en hora de Colombia. Las reservas existentes conservan su hora y duración.</Notice>
      {!shifts.length && !loading ? <EmptyState title="Todavía no hay jornadas" message="Agrega una jornada y selecciona su día, horas y duración." /> : null}
      {[...shifts].sort((a, b) => (a.day || 7) - (b.day || 7) || a.start.localeCompare(b.start)).map((shift) => <ShiftEditor key={shift.id} shift={shift} />)}
      {adding ? <ShiftEditor shift={{ id: '', name: '', start: '09:00', end: '11:00', duration: 60, enabled: true, day: 1 }} onCancel={() => setAdding(false)} onCreated={() => setAdding(false)} /> : <Button label="+ Agregar jornada" variant="secondary" onPress={() => setAdding(true)} />}
    </Screen>
  );
}
