import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAdminAction } from '@/components/admin/use-admin-action';
import { AppText, Badge, Button, Card, Field, Notice, Row, Screen } from '@/components/konys/ui';
import { colors } from '@/constants/konys';
import { useRestaurant } from '@/state/restaurant-store';
import { todayISO } from '@/utils/reservations';

export default function AdminScreen() {
  const { isAdmin, authError, session, login, logout, tables, reservations, dishes, shifts } = useRestaurant();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const action = useAdminAction();
  const enter = () => {
    if (!email.trim() || !password) { action.setError('Escribe tu correo y contraseña.'); return; }
    void action.run(() => login(email.trim(), password), '', () => setPassword(''));
  };

  if (session && !isAdmin) return (
    <Screen title="Acceso administrador" subtitle="Tu sesión no tiene acceso a este panel.">
      <Notice tone="error">{authError || 'Esta cuenta no tiene permisos de administrador. Contacta al responsable del restaurante.'}</Notice>
      {action.error ? <Notice tone="error">{action.error}</Notice> : null}
      <Button label={action.pending ? 'Cerrando sesión…' : 'Cerrar sesión y usar otra cuenta'} disabled={action.pending} onPress={() => { void action.run(logout); }} />
    </Screen>
  );

  if (!isAdmin) return (
    <Screen title="Acceso administrador" subtitle="El espacio para organizar tu restaurante.">
      <View style={styles.login}>
        <Card style={styles.hero}>
          <AppText variant="caption" color="#FFFFFF">KONYS PIZZA</AppText>
          <AppText variant="title" color="#FFFFFF">ADMIN</AppText>
          <AppText color="#FFFFFF">Mesas, horarios y reservas en un solo lugar.</AppText>
        </Card>
        <Field label="Correo electrónico" placeholder="tu.correo@ejemplo.com" value={email}
          onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
          autoComplete="email" editable={!action.pending} maxLength={254} />
        <Field label="Contraseña" placeholder="Tu contraseña" value={password}
          onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="current-password"
          editable={!action.pending} onSubmitEditing={enter} returnKeyType="go" />
        {action.error || authError ? <Notice tone="error">{action.error || authError}</Notice> : null}
        <Button label={action.pending ? 'Ingresando…' : 'Ingresar al panel'} onPress={enter} disabled={action.pending || !email.trim() || !password} />
      </View>
    </Screen>
  );

  const sections: { title: string; count: string; description: string; href: Href }[] = [
    { title: 'Mesas', count: `${tables.length} mesas`, description: 'Agrega mesas y actualiza su estado.', href: '/admin/mesas' },
    { title: 'Horarios', count: `${shifts.filter((shift) => shift.enabled).length} jornadas activas`, description: 'Define horas y duración de las reservas.', href: '/admin/horarios' },
    { title: 'Reservas', count: `${reservations.filter((reservation) => reservation.date === todayISO() && reservation.status === 'confirmada').length} confirmadas hoy`, description: 'Consulta, filtra y gestiona las visitas.', href: '/admin/reservas' },
    { title: 'Carta', count: `${dishes.filter((dish) => dish.visible).length} platos visibles`, description: 'Actualiza platos, precios y disponibilidad.', href: '/admin/carta' },
  ];
  return (
    <Screen title="Panel administrativo" subtitle="Todo listo para recibir a tus clientes.">
      <Row><Badge label="Administrador" tone="success" /><Button label={action.pending ? 'Cerrando sesión…' : 'Cerrar sesión'} variant="ghost" disabled={action.pending} onPress={() => { void action.run(logout); }} /></Row>
      {action.error ? <Notice tone="error">{action.error}</Notice> : null}
      <View style={styles.grid}>
        {sections.map((section) => (
          <Card key={section.title} style={styles.section}>
            <AppText variant="caption" color={colors.accent}>{section.count}</AppText>
            <AppText variant="subtitle">{section.title}</AppText>
            <AppText color={colors.muted}>{section.description}</AppText>
            <Button label={`Gestionar ${section.title.toLowerCase()}`} variant="secondary" onPress={() => router.push(section.href)} />
          </Card>
        ))}
      </View>
      <Notice>Los cambios guardados estarán disponibles también en el módulo cliente.</Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  login: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: 18 },
  hero: { backgroundColor: colors.primary, padding: 26, gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  section: { flexGrow: 1, flexBasis: 300, gap: 14 },
});
