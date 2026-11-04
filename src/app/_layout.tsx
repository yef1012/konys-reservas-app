import { router, usePathname, type Href } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/konys';
import { RestaurantProvider } from '@/state/restaurant-store';

const tabs: { label: string; icon: string; href: Href }[] = [
  { label: 'Inicio', icon: '⌂', href: '/' },
  { label: 'Carta', icon: '▤', href: '/carta' },
  { label: 'Admin', icon: '⚙', href: '/admin' },
];

function AppShell() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const active = path.startsWith('/admin') ? 'Admin' : path === '/carta' ? 'Carta' : 'Inicio';
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.app}>
    <StatusBar style="dark" />
    <View style={styles.header}><View style={styles.headerInner}>
      <View style={styles.brand}><View style={styles.logo}><Text style={styles.logoText}>K</Text></View>
        <View><Text style={styles.brandName}>KONYS PIZZA</Text><Text style={styles.brandCaption}>RESERVA TU MOMENTO</Text></View>
      </View>
      <View style={styles.demo}><Text style={styles.demoText}>RESERVAS</Text></View>
    </View></View>
    <View style={styles.main}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </View>
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.navInner}>
        {tabs.map((tab) => <Pressable key={tab.label} accessibilityRole="tab" accessibilityLabel={tab.label}
          accessibilityState={{ selected: active === tab.label }} onPress={() => router.replace(tab.href)}
          style={({ pressed }) => [styles.tab, active === tab.label && styles.tabActive, pressed && { opacity: 0.7 }]}>
          <Text style={[styles.tabIcon, active === tab.label && styles.selected]}>{tab.icon}</Text>
          <Text style={[styles.tabLabel, active === tab.label && styles.selected]}>{tab.label}</Text>
        </Pressable>)}
      </View>
    </View>
  </SafeAreaView>;
}

export default function RootLayout() {
  return <RestaurantProvider><AppShell /></RestaurantProvider>;
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.surface }, main: { flex: 1 },
  header: { borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  headerInner: { width: '100%', maxWidth: 1080, paddingVertical: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  logo: { width: 35, height: 35, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 23, fontWeight: '800', color: colors.accent },
  brandName: { fontSize: 15, fontWeight: '800', letterSpacing: 1, color: colors.primary },
  brandCaption: { fontSize: 8, lineHeight: 15, letterSpacing: 1.3, color: colors.muted, fontWeight: '600' },
  demo: { borderRadius: 6, paddingVertical: 5, paddingHorizontal: 7, backgroundColor: '#FFF0DF' },
  demoText: { fontSize: 9, fontWeight: '700', color: '#8C4C10', letterSpacing: 0.4 },
  nav: { paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  navInner: { flexDirection: 'row', width: '100%', maxWidth: 600, paddingHorizontal: 20, gap: 8 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 56, borderRadius: 12 },
  tabActive: { backgroundColor: '#EAF0F2' }, tabIcon: { fontSize: 24, lineHeight: 28, color: colors.muted },
  tabLabel: { fontSize: 12, fontWeight: '600', color: colors.muted }, selected: { color: colors.primary },
});
