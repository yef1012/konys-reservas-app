import { Redirect, Slot, usePathname } from 'expo-router';

import { useDemo } from '@/state/demo-store';

export default function AdminLayout() {
  const { isAdmin } = useDemo();
  const pathname = usePathname().replace(/\/$/, '');

  if (!isAdmin && pathname !== '/admin') return <Redirect href="/admin" />;
  return <Slot />;
}
