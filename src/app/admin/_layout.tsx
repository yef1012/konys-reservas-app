import { Redirect, Slot, usePathname } from 'expo-router';

import { Notice, Screen } from '@/components/konys/ui';
import { useRestaurant } from '@/state/restaurant-store';

export default function AdminLayout() {
  const { isAdmin, authLoading } = useRestaurant();
  const pathname = usePathname().replace(/\/$/, '');

  if (authLoading) return <Screen title="Administración"><Notice>Verificando sesión y permisos…</Notice></Screen>;
  if (!isAdmin && pathname !== '/admin') return <Redirect href="/admin" />;
  return <Slot />;
}
