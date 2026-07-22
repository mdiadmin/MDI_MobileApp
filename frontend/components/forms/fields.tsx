import React, { ReactNode, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardTypeOptions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '@/constants/theme';

// ─── Field wrapper: label + optional required mark, hint, and error ──────────
export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.req}> *</Text> : null}
      </Text>
      {children}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

// ─── Text input ──────────────────────────────────────────────────────────────
export function FormText({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  hint,
  error,
  multiline,
  keyboardType,
  autoCapitalize = 'sentences',
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
}) {
  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <TextInput
        style={[styles.input, multiline && styles.multiline, !!error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
      />
    </Field>
  );
}

// ─── Dropdown select (modal list) ────────────────────────────────────────────
export function FormSelect({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select…',
  required,
  hint,
  error,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <TouchableOpacity
        style={[styles.input, styles.selectRow, !!error && styles.inputError]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]}>
          {value || placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={colors.muted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {options.map((opt) => {
                const selected = opt === value;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionRow, selected && styles.optionRowSelected]}
                    onPress={() => {
                      onSelect(opt);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{opt}</Text>
                    {selected ? (
                      <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </Field>
  );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────
export function FormCheckbox({
  label,
  value,
  onValueChange,
  error,
}: {
  label: ReactNode;
  value: boolean;
  onValueChange: (v: boolean) => void;
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => onValueChange(!value)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, value && styles.checkboxChecked]}>
          {value ? <MaterialCommunityIcons name="check" size={15} color="#fff" /> : null}
        </View>
        <View style={styles.checkboxLabel}>
          {typeof label === 'string' ? <Text style={styles.checkboxText}>{label}</Text> : label}
        </View>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

// ─── Quantity stepper (used for optional services / AV) ──────────────────────
export function FormStepper({
  label,
  sublabel,
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  label: string;
  sublabel?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <View style={styles.stepperRow}>
      <View style={styles.stepperLabelWrap}>
        <Text style={styles.stepperLabel}>{label}</Text>
        {sublabel ? <Text style={styles.stepperSub}>{sublabel}</Text> : null}
      </View>
      <View style={styles.stepper}>
        <TouchableOpacity onPress={dec} style={styles.stepBtn} disabled={value <= min} activeOpacity={0.7}>
          <MaterialCommunityIcons name="minus" size={16} color={value <= min ? colors.muted : colors.primary} />
        </TouchableOpacity>
        <Text style={styles.stepValue}>{value}</Text>
        <TouchableOpacity onPress={inc} style={styles.stepBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Section header + card container ─────────────────────────────────────────
export function FormSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

// ─── Read-only bulleted policy list ──────────────────────────────────────────
export function PolicyList({ items }: { items: string[] }) {
  return (
    <View style={styles.policyBox}>
      {items.map((it, i) => (
        <View key={i} style={styles.policyRow}>
          <MaterialCommunityIcons name="information-outline" size={15} color={colors.accent} />
          <Text style={styles.policyText}>{it}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Submit button ────────────────────────────────────────────────────────────
export function SubmitButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.submit, (disabled || loading) && styles.submitDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.submitText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  label: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.foreground,
    marginBottom: 6,
  },
  req: { color: colors.accent },
  hint: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.muted,
    marginTop: 4,
  },
  error: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#C0392B',
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.foreground,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  inputError: { borderColor: '#C0392B' },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.foreground, flex: 1 },
  selectPlaceholder: { color: colors.muted },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,44,30,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
  },
  sheetTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.foreground,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  optionRowSelected: { backgroundColor: colors.secondary },
  optionText: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.foreground },
  optionTextSelected: { fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.primary },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxLabel: { flex: 1 },
  checkboxText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.foreground,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 12,
  },
  stepperLabelWrap: { flex: 1 },
  stepperLabel: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.foreground },
  stepperSub: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.accent, marginTop: 2 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 10,
  },
  stepBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  stepValue: {
    minWidth: 22,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.foreground,
  },
  section: { marginBottom: 22 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'DMSerifDisplay_400Regular',
    color: colors.primary,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.muted,
    marginBottom: 12,
  },
  sectionBody: { marginTop: 8 },
  policyBox: {
    backgroundColor: colors.accentBg,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  policyRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  policyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.primaryLight,
  },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});
