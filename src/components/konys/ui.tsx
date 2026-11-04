import { type Href, router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput,
  type StyleProp, type TextInputProps, type TextStyle, View, type ViewStyle,
} from 'react-native';
import { colors } from '@/constants/konys';

type Children = { children: ReactNode };
type TextVariant = 'title' | 'subtitle' | 'body' | 'caption' | 'label';

export function AppText({ children, variant = 'body', color, style }: Children & {
  variant?: TextVariant; color?: string; style?: StyleProp<TextStyle>;
}) {
  return <Text accessibilityRole={variant === 'title' || variant === 'subtitle' ? 'header' : undefined}
    style={[styles.text, textStyles[variant], color ? { color } : undefined, style]}>{children}</Text>;
}

export function Screen({ title, subtitle, children, backHref }: Children & {
  title: string; subtitle?: string; backHref?: Href;
}) {
  return <KeyboardAvoidingView style={styles.flex} enabled={Platform.OS !== 'web'}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <View style={styles.content}>
        {backHref && <View style={styles.back}><Button label="‹ Volver" variant="ghost"
          onPress={() => router.canGoBack() ? router.back() : router.replace(backHref)} /></View>}
        <View style={styles.heading}><View style={styles.headingMark} />
          <AppText variant="title">{title}</AppText>
          {subtitle && <AppText color={colors.muted}>{subtitle}</AppText>}
        </View>
        {children}
        <AppText variant="caption" color={colors.muted} style={styles.footnote}>
          Proyecto académico · KONYS PIZZA{ '\n' }Datos de demostración. Se reinician al recargar.
        </AppText>
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
export function Button({ label, onPress, variant = 'primary', disabled = false }: {
  label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; disabled?: boolean;
}) {
  const solid = variant === 'primary' || variant === 'danger';
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }}
    disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, buttonStyles[variant], disabled && styles.disabled, pressed && styles.pressed]}>
    <AppText variant="label" color={solid ? '#FFFFFF' : colors.primary} style={styles.center}>{label}</AppText>
  </Pressable>;
}
export function Chip({ label, selected = false, onPress, disabled = false }: {
  label: string; selected?: boolean; onPress: () => void; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected, disabled }}
    disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.chip, selected && styles.chipSelected, disabled && styles.disabled, pressed && styles.pressed]}>
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
      style={[styles.input, props.multiline && styles.multiline, focused && styles.focused, error ? styles.invalid : undefined, style]} />
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}
const tones = {
  success: { backgroundColor: '#E7F3EB', color: colors.success },
  warning: { backgroundColor: '#FFF0DF', color: '#8C4C10' },
  danger: { backgroundColor: '#FDEBEC', color: colors.danger },
  neutral: { backgroundColor: '#EAF0F2', color: colors.primary },
};
export function Badge({ label, tone = 'neutral' }: { label: string; tone?: keyof typeof tones }) {
  return <View style={[styles.badge, { backgroundColor: tones[tone].backgroundColor }]}>
    <AppText variant="caption" color={tones[tone].color} style={styles.chipText}>{label}</AppText>
  </View>;
}
export function Notice({ children, tone = 'info' }: Children & { tone?: 'info' | 'success' | 'error' }) {
  const palette = tones[tone === 'info' ? 'neutral' : tone === 'error' ? 'danger' : 'success'];
  return <View accessibilityRole={tone === 'error' ? 'alert' : undefined} accessibilityLiveRegion="polite"
    style={[styles.notice, { backgroundColor: palette.backgroundColor }]}>
    <AppText variant="caption" color={palette.color}>{children}</AppText>
  </View>;
}
export function EmptyState({ title, message }: { title: string; message: string }) {
  return <Card style={styles.empty}><AppText variant="subtitle">{title}</AppText>
    <AppText color={colors.muted} style={styles.center}>{message}</AppText></Card>;
}
const textStyles = StyleSheet.create({
  title: { fontSize: 28, lineHeight: 35, fontWeight: '700', letterSpacing: -0.6 },
  subtitle: { fontSize: 18, lineHeight: 25, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 23 },
  caption: { fontSize: 13, lineHeight: 20 },
  label: { fontSize: 14, lineHeight: 21, fontWeight: '600' },
});
const buttonStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  secondary: { backgroundColor: '#EEF3F4', borderColor: colors.border },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
});
const styles = StyleSheet.create({
  flex: { flex: 1 }, text: { color: colors.ink, flexShrink: 1 },
  scroll: { flexGrow: 1, alignItems: 'center' },
  content: { width: '100%', maxWidth: 1080, padding: 24, gap: 20 },
  heading: { gap: 8, paddingBottom: 4 },
  headingMark: { width: 34, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginBottom: 4 },
  back: { alignSelf: 'flex-start', marginLeft: -12, marginBottom: -12 },
  card: { padding: 18, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  section: { gap: 14 }, sectionHeading: { justifyContent: 'space-between' },
  button: { minHeight: 48, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  chip: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontWeight: '600' }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.75 }, center: { textAlign: 'center' },
  field: { gap: 7 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.surface, fontSize: 16, color: colors.ink },
  multiline: { minHeight: 100, textAlignVertical: 'top' }, focused: { borderColor: colors.primary }, invalid: { borderColor: colors.danger },
  error: { fontSize: 13, color: colors.danger, lineHeight: 20 },
  badge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  notice: { padding: 14, borderRadius: 10 }, empty: { alignItems: 'center', paddingVertical: 32 },
  footnote: { textAlign: 'center', marginTop: 16, paddingBottom: 8 },
});
