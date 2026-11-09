import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAdminAction } from '@/components/admin/use-admin-action';
import { Icon } from '@/components/konys/icon';
import { AppText, Badge, Button, Card, Field, Notice, Row, Screen } from '@/components/konys/ui';
import { colors, radii, space } from '@/constants/konys';
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
    <Screen eyebrow="ADMINISTRACIÓN" title="Acceso administrador" subtitle="Tu sesión no tiene acceso a este panel.">
      <Notice tone="error">{authError || 'Esta cuenta no tiene permisos de administrador. Contacta al responsable del restaurante.'}</Notice>
      {action.error ? <Notice tone="error">{action.error}</Notice> : null}
      <Button label={action.pending ? 'Cerrando sesión…' : 'Cerrar sesión y usar otra cuenta'} disabled={action.pending} onPress={() => { void action.run(logout); }} />
    </Screen>
  );

  if (!isAdmin) return (
    <Screen eyebrow="EL EQUIPO KONYS" title="Acceso administrador" subtitle="El espacio para organizar tu restaurante.">
      <View style={styles.login}>
        <Card style={styles.hero}>
          <View style={styles.heroIcon}><Icon name="admin" size={30} color={colors.accent} /></View>
          <AppText variant="caption" color="#C3D6DB" style={styles.eyebrow}>DETRÁS DE CADA GRAN VISITA</AppText>
          <AppText variant="title" color="#FFFFFF" style={styles.heroTitle}>Cada detalle,{ '\n' }en su lugar.</AppText>
          <AppText color="#D7E4E7">Mesas, horarios y reservas en un solo lugar.</AppText>
          <View style={styles.heroFooter}><View style={styles.orangeLine} /><AppText variant="caption" color="#D7E4E7">KONYS PIZZA · Administración</AppText></View>
        </Card>
        <Card style={styles.loginForm}>
        <Row><View style={styles.smallIcon}><Icon name="lock" size={20} color={colors.primary} /></View><AppText variant="subtitle">Bienvenido de nuevo</AppText></Row>
        <AppText color={colors.muted}>Ingresa con tu cuenta de administrador.</AppText>
        <Field label="Correo electrónico" placeholder="tu.correo@ejemplo.com" value={email}
          onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
          autoComplete="email" editable={!action.pending} maxLength={254} />
        <Field label="Contraseña" placeholder="Tu contraseña" value={password}
          onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="current-password"
          editable={!action.pending} onSubmitEditing={enter} returnKeyType="go" />
        {action.error || authError ? <Notice tone="error">{action.error || authError}</Notice> : null}
        <Button label={action.pending ? 'Ingresando…' : 'Ingresar al panel'} onPress={enter} disabled={action.pending || !email.trim() || !password} />
        </Card>
      </View>
    </Screen>
  );

  const sections: { title: string; count: string; description: string; href: Href; icon: 'table' | 'clock' | 'calendar' | 'menu' }[] = [
    { title: 'Mesas', count: `${tables.length} mesas`, description: 'Agrega mesas y actualiza su estado.', href: '/admin/mesas', icon: 'table' },
    { title: 'Horarios', count: `${shifts.filter((shift) => shift.enabled).length} jornadas activas`, description: 'Define horas y duración de las reservas.', href: '/admin/horarios', icon: 'clock' },
    { title: 'Reservas', count: `${reservations.filter((reservation) => reservation.date === todayISO() && reservation.status === 'confirmada').length} confirmadas hoy`, description: 'Consulta, filtra y gestiona las visitas.', href: '/admin/reservas', icon: 'calendar' },
    { title: 'Carta', count: `${dishes.filter((dish) => dish.visible).length} platos visibles`, description: 'Actualiza platos, precios y disponibilidad.', href: '/admin/carta', icon: 'menu' },
  ];
  return (
    <Screen eyebrow="TU RESTAURANTE, EN ORDEN" title="Panel administrativo" subtitle="Todo listo para recibir a tus clientes.">
      <Row style={styles.sessionBar}><Row><Icon name="admin" size={20} color={colors.primary} /><Badge label="Administrador" tone="success" /></Row><Button label={action.pending ? 'Cerrando sesión…' : 'Cerrar sesión'} variant="ghost" disabled={action.pending} onPress={() => { void action.run(logout); }} /></Row>
      {action.error ? <Notice tone="error">{action.error}</Notice> : null}
      <View style={styles.grid}>
        {sections.map((section) => (
          <Card key={section.title} style={styles.section}>
            <Row style={styles.cardHeading}><View style={styles.sectionIcon}><Icon name={section.icon} size={26} color={colors.primary} /></View><AppText variant="label" color={colors.muted}>{section.title}</AppText></Row>
            <AppText variant="title" style={styles.count}>{section.count}</AppText>
            <AppText color={colors.muted} style={styles.description}>{section.description}</AppText>
            <Button label={`Gestionar ${section.title.toLowerCase()}`} variant="secondary" onPress={() => router.push(section.href)} />
          </Card>
        ))}
      </View>
      <Notice>Los cambios guardados estarán disponibles también en el módulo cliente.</Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  login: { width: '100%', maxWidth: 960, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.xl },
  hero: { backgroundColor: colors.deep, borderColor: colors.deep, padding: space.xl, gap: space.lg, flexBasis: 300, flexGrow: 1, flexShrink: 1, minWidth: 0, justifyContent: 'center', borderRadius: radii.lg },
  heroIcon: { width: 64, height: 64, borderRadius: radii.md, backgroundColor: '#164957', alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  heroTitle: { fontSize: 34, lineHeight: 41, letterSpacing: -1 },
  heroFooter: { gap: space.md, marginTop: space.xl },
  orangeLine: { width: 36, height: 3, backgroundColor: colors.accent, borderRadius: radii.pill },
  loginForm: { flexBasis: 340, flexGrow: 1, flexShrink: 1, minWidth: 0, padding: space.xl, gap: space.xl },
  smallIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft, borderRadius: radii.sm },
  sessionBar: { justifyContent: 'space-between', paddingBottom: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  section: { flexGrow: 1, flexShrink: 1, flexBasis: 400, minWidth: 0, gap: space.lg, padding: space.xl },
  cardHeading: { justifyContent: 'space-between' },
  sectionIcon: { width: 54, height: 54, borderRadius: radii.md, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  count: { fontSize: 27, lineHeight: 34 },
  description: { flexGrow: 1 },
});
