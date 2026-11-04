import { useEffect, useState } from 'react';
import { errorMessage, fetchOccupancy } from '@/services/restaurant';
import { useRestaurant } from '@/state/restaurant-store';
import { availableTimes, weekday } from '@/utils/availability';
import { isValidDate } from '@/utils/reservations';

export function useAvailability(tableId: string, date: string, shiftId: string) {
  const { tables, shifts } = useRestaurant();
  const table = tables.find((item) => item.id === tableId);
  const shift = shifts.find((item) => item.id === shiftId);
  const [revision, setRevision] = useState(0);
  const key = JSON.stringify([tableId, date, shiftId, table?.status, shift, revision]);
  const valid = !!table && table.status === 'disponible' && !!shift?.enabled && isValidDate(date) && shift.day === weekday(date);
  const [result, setResult] = useState({ key: '', slots: [] as string[], error: '', loading: true });
  useEffect(() => {
    if (!valid || !shift) return;
    const controller = new AbortController();
    void fetchOccupancy(tableId, date, controller.signal)
      .then((intervals) => { if (!controller.signal.aborted) setResult({ key, slots: availableTimes(shift, date, intervals), error: '', loading: false }); })
      .catch((cause) => { if (!controller.signal.aborted) setResult({ key, slots: [], error: errorMessage(cause), loading: false }); });
    return () => controller.abort();
  }, [key, valid, tableId, date, shift]);
  const refresh = () => setRevision((previous) => previous + 1);
  if (!valid) return { slots: [], loading: false, error: '', refresh };
  // Nunca reutilizar horarios de otra selección, ni durante el primer render del efecto.
  if (result.key !== key) return { slots: [], loading: true, error: '', refresh };
  return { slots: result.slots, loading: result.loading, error: result.error, refresh };
}
