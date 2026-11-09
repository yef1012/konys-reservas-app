import { router, usePathname, type Href } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '@/constants/konys';
import { Icon, type IconName } from '@/components/konys/icon';
import { RestaurantProvider } from '@/state/restaurant-store';
import { useLayoutWidth } from '@/hooks/use-layout-width';

const tabs: { label: string; icon: IconName; href: Href }[] = [
  { label: 'Inicio', icon: 'home', href: '/' },
  { label: 'Carta', icon: 'menu', href: '/carta' },
  { label: 'Admin', icon: 'admin', href: '/admin' },
];

function AppShell() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const width = useLayoutWidth();
  const active = path.startsWith('/admin') ? 'Admin' : path === '/carta' ? 'Carta' : 'Inicio';
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.app}>
    <StatusBar style="dark" />
    <View style={styles.header}><View style={styles.headerInner}>
      <View style={styles.brand}><View style={styles.logo}><Text style={styles.logoText}>K</Text></View>
        <View><Text style={styles.brandName}>KONYS PIZZA</Text><Text style={styles.brandCaption}>RESERVA TU MOMENTO</Text></View>
      </View>
      {width >= 420 && <View style={styles.location}><Icon name="pin" size={15} /><Text style={styles.locationText}>BUCARAMANGA</Text></View>}
    </View></View>
    <View style={styles.main}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </View>
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.navInner}>
        {tabs.map((tab) => <Pressable key={tab.label} accessibilityRole="tab" accessibilityLabel={tab.label}
          accessibilityState={{ selected: active === tab.label }} onPress={() => router.replace(tab.href)}
          style={({ pressed }) => [styles.tab, active === tab.label && styles.tabActive, pressed && { opacity: 0.7 }]}>
          <View style={[styles.tabIcon, active === tab.label && styles.iconSelected]}><Icon name={tab.icon} size={22} color={active === tab.label ? colors.primary : colors.muted} /></View>
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
  headerInner: { width: '100%', maxWidth: 1200, paddingVertical: 14, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  logo: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: colors.accent },
  logoText: { fontSize: 25, fontWeight: '900', color: colors.surface, fontStyle: 'italic' },
  brandName: { fontSize: 15, fontWeight: '800', letterSpacing: 1, color: colors.primary },
  brandCaption: { fontSize: 8, lineHeight: 15, letterSpacing: 1.3, color: colors.muted, fontWeight: '600' },
  location: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { fontSize: 10, fontWeight: '700', color: colors.muted, letterSpacing: 1 },
  nav: { paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  navInner: { flexDirection: 'row', width: '100%', maxWidth: 600, paddingHorizontal: 20, gap: 8 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 58, borderRadius: radii.md },
  tabActive: { backgroundColor: colors.soft }, tabIcon: { width: 44, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
  iconSelected: { backgroundColor: '#F47A2024' },
  tabLabel: { fontSize: 11, fontWeight: '700', color: colors.muted }, selected: { color: colors.primary },
});
