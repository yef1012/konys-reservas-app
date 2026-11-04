import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Button, Card, Field, Notice, Row, Screen } from '@/components/konys/ui';
import { colors } from '@/constants/konys';
import { useDemo } from '@/state/demo-store';
import { todayISO } from '@/utils/reservations';

export default function AdminScreen() {
  const { isAdmin, login, logout, tables, reservations, dishes, shifts } = useDemo();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const enter = () => {
    if (!login(pin)) setError('PIN incorrecto. Usa 1234 para esta demostración.');
    else { setError(''); setPin(''); }
  };

  if (!isAdmin) return (
    <Screen title="Acceso administrador" subtitle="El espacio para organizar tu restaurante.">
      <View style={styles.login}>
        <Card style={styles.hero}>
          <AppText variant="caption" color="#FFFFFF">KONYS PIZZA</AppText>
          <AppText variant="title" color="#FFFFFF">ADMIN</AppText>
          <AppText color="#FFFFFF">Mesas, horarios y reservas en un solo lugar.</AppText>
        </Card>
        <Notice>Acceso de demostración · PIN: 1234. No es autenticación real.</Notice>
        <Field label="PIN de acceso" placeholder="Ingresa los 4 dígitos" value={pin}
          onChangeText={(value) => { setPin(value.replace(/\D/g, '')); setError(''); }}
          keyboardType="number-pad" secureTextEntry maxLength={4} error={error}
          onSubmitEditing={enter} returnKeyType="go" />
        <Button label="Ingresar al panel" onPress={enter} disabled={pin.length !== 4} />
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
      <Row><Badge label="Sesión de demostración" tone="success" /><Button label="Cerrar sesión" variant="ghost" onPress={logout} /></Row>
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
      <Notice>Los cambios se comparten con el módulo cliente durante esta sesión y se reinician al recargar.</Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  login: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: 18 },
  hero: { backgroundColor: colors.primary, padding: 26, gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  section: { flexGrow: 1, flexBasis: 300, gap: 14 },
});
