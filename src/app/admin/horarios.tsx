import { useState } from 'react';

import { ShiftEditor } from '@/components/admin/shift-editor';
import { Button, Notice, Screen } from '@/components/konys/ui';
import { useDemo } from '@/state/demo-store';

export default function AdminShiftsScreen() {
  const { shifts } = useDemo();
  const [adding, setAdding] = useState(false);
  return (
    <Screen title="Jornadas y horarios" subtitle="Define cuándo y por cuánto tiempo recibir reservas." backHref="/admin">
      <Notice>Estas jornadas se aplican todos los días, de lunes a domingo, en hora de Colombia. Las reservas existentes conservan su hora y duración.</Notice>
      {shifts.map((shift) => <ShiftEditor key={shift.id} shift={shift} />)}
      {adding ? <ShiftEditor shift={{ id: '', name: '', start: '09:00', end: '11:00', duration: 60, enabled: true }} onCancel={() => setAdding(false)} onCreated={() => setAdding(false)} /> : <Button label="+ Agregar jornada" variant="secondary" onPress={() => setAdding(true)} />}
    </Screen>
  );
}
