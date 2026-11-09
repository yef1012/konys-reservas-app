import { type Href, router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput,
  type StyleProp, type TextInputProps, type TextStyle, View, type ViewStyle,
} from 'react-native';
import { colors, radii, shadows, space, typography } from '@/constants/konys';
import { useRestaurant } from '@/state/restaurant-store';
import { useLayoutWidth } from '@/hooks/use-layout-width';
import { Icon, type IconName } from '@/components/konys/icon';

type Children = { children: ReactNode };
type TextVariant = 'title' | 'subtitle' | 'body' | 'caption' | 'label';

export function AppText({ children, variant = 'body', color, style }: Children & {
  variant?: TextVariant; color?: string; style?: StyleProp<TextStyle>;
}) {
  return <Text accessibilityRole={variant === 'title' || variant === 'subtitle' ? 'header' : undefined}
    style={[styles.text, textStyles[variant], color ? { color } : undefined, style]}>{children}</Text>;
}

export function Screen({ title, subtitle, children, backHref, eyebrow, hideHeading = false }: Children & {
  title: string; subtitle?: string; backHref?: Href; eyebrow?: string; hideHeading?: boolean;
}) {
  const { loading, error, refresh } = useRestaurant();
  const width = useLayoutWidth();
  return <KeyboardAvoidingView style={styles.flex} enabled={Platform.OS !== 'web'}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <View style={[styles.content, width >= 760 && styles.contentWide]}>
        {backHref && <View style={styles.back}><Button label="‹ Volver" variant="ghost"
          onPress={() => router.canGoBack() ? router.back() : router.replace(backHref)} /></View>}
        {!hideHeading && <View style={styles.heading}>
          <AppText variant="caption" color={colors.accentDark} style={styles.eyebrow}>{eyebrow ?? 'KONYS PIZZA'}</AppText>
          <AppText variant="title">{title}</AppText>
          {subtitle && <AppText color={colors.muted}>{subtitle}</AppText>}
        </View>}
        {loading && <Notice>Actualizando datos…</Notice>}
        {!!error && <View style={styles.section}><Notice tone="error">{error}</Notice><Button label="Reintentar conexión" variant="secondary" onPress={() => { void refresh(); }} disabled={loading} /></View>}
        {children}
        <View style={styles.footer}><AppText variant="label" color={colors.primary} style={styles.footerBrand}>KONYS PIZZA</AppText>
          <AppText variant="caption" color={colors.muted}>Buenos momentos, alrededor de la mesa.</AppText>
          <AppText variant="caption" color={colors.muted}>Bucaramanga · Horarios de Colombia</AppText>
        </View>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

export function Card({ children, style }: Children & { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Row({ children, style }: Children & { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}
export function Section({ title, children, action }: Children & { title: string; action?: ReactNode }) {
  return <View style={styles.section}>
    <Row style={styles.sectionHeading}><AppText variant="subtitle">{title}</AppText>{action}</Row>{children}
  </View>;
}
export function Button({ label, onPress, variant = 'primary', disabled = false, icon }: {
  label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; disabled?: boolean; icon?: IconName;
}) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const textColor = variant === 'danger' ? colors.surface : colors.primary;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }}
    disabled={disabled} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}
    style={({ pressed }) => [styles.button, buttonStyles[variant], hovered && styles.hovered, focused && styles.focusRing, disabled && styles.disabled, pressed && styles.pressed]}>
    <AppText variant="label" color={textColor} style={styles.center}>{label}</AppText>
    {icon && <Icon name={icon} size={18} color={textColor} />}
  </Pressable>;
}
export function Chip({ label, selected = false, onPress, disabled = false }: {
  label: string; selected?: boolean; onPress: () => void; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected, disabled }}
    disabled={disabled} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.chip, selected && styles.chipSelected, focused && styles.focusRing, disabled && styles.disabled, pressed && styles.pressed]}>
    <AppText variant="caption" color={selected ? '#FFFFFF' : colors.primary} style={styles.chipText}>{label}</AppText>
  </Pressable>;
}
export function Field({ label, error, style, ...props }: TextInputProps & { label: string; error?: string }) {
  const [focused, setFocused] = useState(false);
  return <View style={styles.field}>
    <AppText variant="label">{label}</AppText>
    <TextInput {...props} accessibilityLabel={props.accessibilityLabel ?? label}
      placeholderTextColor={colors.muted} selectionColor={colors.accent}
      onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
      onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
      style={[styles.input, props.multiline && styles.multiline, focused && styles.focused, props.editable === false && styles.disabled, error ? styles.invalid : undefined, style]} />
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}
const tones = {
  success: { backgroundColor: colors.successSoft, color: colors.success },
  warning: { backgroundColor: colors.warm, color: colors.accentDark },
  danger: { backgroundColor: colors.dangerSoft, color: colors.danger },
  neutral: { backgroundColor: colors.soft, color: colors.primary },
};
export function Badge({ label, tone = 'neutral' }: { label: string; tone?: keyof typeof tones }) {
  return <View style={[styles.badge, { backgroundColor: tones[tone].backgroundColor }]}>
    <View style={[styles.badgeDot, { backgroundColor: tones[tone].color }]} />
    <AppText variant="caption" color={tones[tone].color} style={styles.chipText}>{label}</AppText>
  </View>;
}
export function Notice({ children, tone = 'info' }: Children & { tone?: 'info' | 'success' | 'error' }) {
  const palette = tones[tone === 'info' ? 'neutral' : tone === 'error' ? 'danger' : 'success'];
  return <View accessibilityRole={tone === 'error' ? 'alert' : undefined} accessibilityLiveRegion="polite"
    style={[styles.notice, { backgroundColor: palette.backgroundColor }]}>
    <Icon name={tone === 'success' ? 'check' : 'info'} size={18} color={palette.color} />
    <AppText variant="caption" color={palette.color}>{children}</AppText>
  </View>;
}
export function EmptyState({ title, message }: { title: string; message: string }) {
  return <Card style={styles.empty}><View style={styles.emptyIcon}><Icon name="menu" size={28} /></View><AppText variant="subtitle" style={styles.center}>{title}</AppText>
    <AppText color={colors.muted} style={styles.center}>{message}</AppText></Card>;
}
const textStyles = StyleSheet.create(typography);
const buttonStyles = StyleSheet.create({
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
});
const styles = StyleSheet.create({
  flex: { flex: 1 }, text: { color: colors.ink, flexShrink: 1 },
  scroll: { flexGrow: 1, alignItems: 'center' },
  content: { width: '100%', maxWidth: 1200, padding: 20, paddingTop: 28, gap: space.xl },
  contentWide: { padding: 36, gap: space.xxl },
  heading: { gap: space.sm, paddingBottom: space.xs },
  eyebrow: { letterSpacing: 2, fontWeight: '800', fontSize: 10 },
  back: { alignSelf: 'flex-start', marginLeft: -12, marginBottom: -12 },
  card: { padding: 22, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: space.lg, ...shadows.card },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  section: { gap: space.lg }, sectionHeading: { justifyContent: 'space-between', gap: space.sm },
  button: { minHeight: 50, maxWidth: '100%', borderRadius: radii.md, paddingHorizontal: 20, paddingVertical: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 2, flexDirection: 'row', gap: 10 },
  chip: { minHeight: 44, maxWidth: '100%', paddingVertical: 10, paddingHorizontal: 17, borderRadius: radii.pill, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontWeight: '700' }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] }, center: { textAlign: 'center' },
  hovered: { opacity: 0.88 }, focusRing: { borderColor: colors.accentDark },
  field: { gap: 7 },
  input: { minHeight: 54, borderWidth: 2, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.background, fontSize: 16, color: colors.ink },
  multiline: { minHeight: 110, textAlignVertical: 'top' }, focused: { borderColor: colors.primary, backgroundColor: colors.surface }, invalid: { borderColor: colors.danger },
  error: { fontSize: 13, color: colors.danger, lineHeight: 20 },
  badge: { alignSelf: 'flex-start', maxWidth: '100%', paddingVertical: 5, paddingHorizontal: 11, borderRadius: radii.pill, flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeDot: { width: 5, height: 5, borderRadius: radii.pill },
  notice: { padding: 16, borderRadius: radii.md, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  empty: { alignItems: 'center', paddingVertical: 36, backgroundColor: colors.background, borderStyle: 'dashed', boxShadow: 'none' },
  emptyIcon: { width: 60, height: 60, borderRadius: radii.pill, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  footer: { alignItems: 'center', gap: 4, paddingTop: 28, marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  footerBrand: { fontSize: 13, letterSpacing: 2 },
});
