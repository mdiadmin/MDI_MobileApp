import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '@/constants/theme';
import { Field } from '@/components/forms/fields';

export type TimeValue = { hour: number; minute: number; period: 'AM' | 'PM' };

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// ─── Formatters / helpers (also used by forms to build the payload) ──────────
export function formatDate(d: Date | null): string {
  if (!d) return '';
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function formatTime(t: TimeValue | null): string {
  if (!t) return '';
  return `${t.hour}:${t.minute.toString().padStart(2, '0')} ${t.period}`;
}

function to24Hour(t: TimeValue): number {
  if (t.period === 'AM') return t.hour === 12 ? 0 : t.hour;
  return t.hour === 12 ? 12 : t.hour + 12;
}

// Combines a date-only value with a time into a UTC ISO string (for calendar).
export function combineDateTimeISO(date: Date, t: TimeValue): string {
  return new Date(
    date.getFullYear(), date.getMonth(), date.getDate(), to24Hour(t), t.minute, 0, 0,
  ).toISOString();
}

function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// ─── One scrollable column of choices ────────────────────────────────────────
function Column<T extends string | number>({
  items,
  selected,
  onSelect,
}: {
  items: { label: string; value: T }[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <ScrollView style={styles.column} showsVerticalScrollIndicator={false}>
      {items.map((it) => {
        const isSel = it.value === selected;
        return (
          <TouchableOpacity
            key={String(it.value)}
            style={[styles.colItem, isSel && styles.colItemSelected]}
            onPress={() => onSelect(it.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.colText, isSel && styles.colTextSelected]}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function PickerModal({
  visible,
  title,
  onClose,
  onConfirm,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <View style={styles.columns}>{children}</View>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={styles.doneBtn} activeOpacity={0.85}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Date field ───────────────────────────────────────────────────────────────
export function FormDateField({
  label,
  value,
  onChange,
  required,
  hint,
  error,
}: {
  label: string;
  value: Date | null;
  onChange: (d: Date) => void;
  required?: boolean;
  hint?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(1);
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => thisYear + i);

  const openModal = () => {
    const base = value ?? new Date();
    setDay(base.getDate());
    setMonth(base.getMonth());
    setYear(base.getFullYear());
    setOpen(true);
  };

  const confirm = () => {
    const clampedDay = Math.min(day, daysInMonth(month, year));
    onChange(new Date(year, month, clampedDay));
    setOpen(false);
  };

  const maxDay = daysInMonth(month, year);

  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <TouchableOpacity
        style={[styles.trigger, !!error && styles.triggerError]}
        onPress={openModal}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]}>
          {value ? formatDate(value) : 'DD / MM / YYYY'}
        </Text>
        <MaterialCommunityIcons name="calendar-month-outline" size={18} color={colors.muted} />
      </TouchableOpacity>

      <PickerModal visible={open} title={label} onClose={() => setOpen(false)} onConfirm={confirm}>
        <Column
          items={Array.from({ length: maxDay }, (_, i) => ({ label: String(i + 1), value: i + 1 }))}
          selected={Math.min(day, maxDay)}
          onSelect={setDay}
        />
        <Column
          items={MONTHS.map((m, i) => ({ label: m, value: i }))}
          selected={month}
          onSelect={setMonth}
        />
        <Column
          items={years.map((y) => ({ label: String(y), value: y }))}
          selected={year}
          onSelect={setYear}
        />
      </PickerModal>
    </Field>
  );
}

// ─── Time field ───────────────────────────────────────────────────────────────
export function FormTimeField({
  label,
  value,
  onChange,
  required,
  hint,
  error,
}: {
  label: string;
  value: TimeValue | null;
  onChange: (t: TimeValue) => void;
  required?: boolean;
  hint?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  const openModal = () => {
    if (value) {
      setHour(value.hour);
      setMinute(value.minute);
      setPeriod(value.period);
    }
    setOpen(true);
  };

  const confirm = () => {
    onChange({ hour, minute, period });
    setOpen(false);
  };

  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <TouchableOpacity
        style={[styles.trigger, !!error && styles.triggerError]}
        onPress={openModal}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]}>
          {value ? formatTime(value) : '-- : --'}
        </Text>
        <MaterialCommunityIcons name="clock-outline" size={18} color={colors.muted} />
      </TouchableOpacity>

      <PickerModal visible={open} title={label} onClose={() => setOpen(false)} onConfirm={confirm}>
        <Column
          items={Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1), value: i + 1 }))}
          selected={hour}
          onSelect={setHour}
        />
        <Column
          items={Array.from({ length: 12 }, (_, i) => ({
            label: (i * 5).toString().padStart(2, '0'),
            value: i * 5,
          }))}
          selected={minute}
          onSelect={setMinute}
        />
        <Column
          items={[
            { label: 'AM', value: 'AM' as const },
            { label: 'PM', value: 'PM' as const },
          ]}
          selected={period}
          onSelect={setPeriod}
        />
      </PickerModal>
    </Field>
  );
}

const styles = StyleSheet.create({
  trigger: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerError: { borderColor: '#C0392B' },
  triggerText: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.foreground },
  triggerPlaceholder: { color: colors.muted },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,44,30,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: { backgroundColor: colors.card, borderRadius: 18, padding: 16 },
  sheetTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.foreground,
    marginBottom: 10,
    textAlign: 'center',
  },
  columns: { flexDirection: 'row', gap: 8, height: 200 },
  column: { flex: 1, backgroundColor: colors.background, borderRadius: 10 },
  colItem: { paddingVertical: 11, alignItems: 'center', borderRadius: 8, marginHorizontal: 4 },
  colItemSelected: { backgroundColor: colors.secondary },
  colText: { fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular', color: colors.foreground },
  colTextSelected: { fontFamily: 'PlusJakartaSans_700Bold', color: colors.primary },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 12, backgroundColor: colors.secondary },
  cancelText: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.primaryLight },
  doneBtn: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 12, backgroundColor: colors.primary },
  doneText: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});
