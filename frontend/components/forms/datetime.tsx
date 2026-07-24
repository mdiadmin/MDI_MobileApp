import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, shadows } from '@/constants/theme';
import { Field } from '@/components/forms/fields';

export type TimeValue = { hour: number; minute: number; period: 'AM' | 'PM' };

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ─── Bottom-sheet shell shared by both pickers ───────────────────────────────
function BottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        {/* Full-screen backdrop sits *behind* the sheet (not as its ancestor),
            so tapping outside dismisses without capturing the sheet's scroll. */}
        <Pressable style={styles.backdropFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

// ─── Calendar grid ───────────────────────────────────────────────────────────
function Calendar({
  value,
  min,
  onPick,
}: {
  value: Date | null;
  min: Date | null;
  onPick: (d: Date) => void;
}) {
  const initial = value ?? new Date();
  const [view, setView] = useState({ y: initial.getFullYear(), m: initial.getMonth() });
  const today = new Date();

  const firstWeekday = new Date(view.y, view.m, 1).getDay();
  const total = daysInMonth(view.m, view.y);

  // Leading blanks so the 1st lands under the right weekday, then the days.
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(new Date(view.y, view.m, d));

  const step = (delta: number) => {
    const next = new Date(view.y, view.m + delta, 1);
    setView({ y: next.getFullYear(), m: next.getMonth() });
  };

  return (
    <View>
      <View style={styles.calHeader}>
        <TouchableOpacity onPress={() => step(-1)} hitSlop={10} style={styles.calNav} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.calTitle}>{MONTHS_FULL[view.m]} {view.y}</Text>
        <TouchableOpacity onPress={() => step(1)} hitSlop={10} style={styles.calNav} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={styles.weekLabel}>{w}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((c, i) => {
          if (!c) return <View key={`b${i}`} style={styles.cell} />;
          const disabled = !!min && c < min;
          const selected = !!value && sameDay(c, value);
          const isToday = sameDay(c, today);
          return (
            <TouchableOpacity
              key={c.getTime()}
              style={styles.cell}
              activeOpacity={0.7}
              disabled={disabled}
              onPress={() => onPick(c)}
            >
              <View style={[styles.dayCircle, selected && styles.dayCircleSelected]}>
                <Text
                  style={[
                    styles.dayText,
                    isToday && !selected && styles.dayToday,
                    selected && styles.dayTextSelected,
                    disabled && styles.dayDisabled,
                  ]}
                >
                  {c.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Date field ──────────────────────────────────────────────────────────────
export function FormDateField({
  label,
  value,
  onChange,
  required,
  hint,
  error,
  minDate,
}: {
  label: string;
  value: Date | null;
  onChange: (d: Date) => void;
  required?: boolean;
  hint?: string;
  error?: string;
  // Earliest selectable day. Defaults to today, since event bookings are in the
  // future; pass `null` to allow any past date (e.g. a date of birth).
  minDate?: Date | null;
}) {
  const [open, setOpen] = useState(false);
  // Bumped on each open so <Calendar> remounts and re-derives its viewed month
  // from `value` (RN keeps Modal children mounted while hidden).
  const [seq, setSeq] = useState(0);
  const min = minDate === undefined ? startOfDay(new Date()) : minDate;

  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <TouchableOpacity
        style={[styles.trigger, !!error && styles.triggerError]}
        onPress={() => { setSeq((s) => s + 1); setOpen(true); }}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]}>
          {value ? formatDate(value) : 'DD / MM / YYYY'}
        </Text>
        <MaterialCommunityIcons name="calendar-month-outline" size={18} color={colors.muted} />
      </TouchableOpacity>

      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10} activeOpacity={0.7}>
            <MaterialCommunityIcons name="close" size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>
        <Calendar
          key={seq}
          value={value}
          min={min}
          onPick={(d) => {
            onChange(d);
            setOpen(false);
          }}
        />
      </BottomSheet>
    </Field>
  );
}

// ─── Snap wheel ──────────────────────────────────────────────────────────────
const ITEM_H = 44;
const VISIBLE = 5; // odd, so one row sits in the centre

function Wheel({
  items,
  index,
  onIndexChange,
}: {
  items: string[];
  index: number;
  onIndexChange: (i: number) => void;
}) {
  const ref = useRef<ScrollView>(null);
  const current = useRef(index);

  // Jump (no animation) to the incoming selection when the sheet opens.
  useEffect(() => {
    const id = setTimeout(() => ref.current?.scrollTo({ y: index * ITEM_H, animated: false }), 0);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update the value continuously as the wheel scrolls (snapToInterval handles
  // the physical snap), so it doesn't rely on a fling to fire momentum-end.
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const raw = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, raw));
    if (clamped !== current.current) {
      current.current = clamped;
      onIndexChange(clamped);
    }
  };

  return (
    <ScrollView
      ref={ref}
      style={{ height: ITEM_H * VISIBLE }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      scrollEventThrottle={16}
      onScroll={onScroll}
      contentContainerStyle={{ paddingVertical: ITEM_H * ((VISIBLE - 1) / 2) }}
    >
      {items.map((it, i) => (
        <View key={it} style={styles.wheelItem}>
          <Text style={[styles.wheelText, i === index && styles.wheelTextSelected]}>{it}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Time field ──────────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

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
  // Bumped on each open so the wheels remount and re-scroll to the current
  // selection (RN keeps Modal children mounted while hidden).
  const [seq, setSeq] = useState(0);
  const [hourIdx, setHourIdx] = useState(8); // 9
  const [minIdx, setMinIdx] = useState(0); // :00
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  const openSheet = () => {
    if (value) {
      setHourIdx(HOURS.indexOf(String(value.hour)));
      setMinIdx(MINUTES.indexOf(value.minute.toString().padStart(2, '0')));
      setPeriod(value.period);
    }
    setSeq((s) => s + 1);
    setOpen(true);
  };

  const confirm = () => {
    onChange({ hour: Number(HOURS[hourIdx]), minute: Number(MINUTES[minIdx]), period });
    setOpen(false);
  };

  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <TouchableOpacity
        style={[styles.trigger, !!error && styles.triggerError]}
        onPress={openSheet}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]}>
          {value ? formatTime(value) : '-- : --'}
        </Text>
        <MaterialCommunityIcons name="clock-outline" size={18} color={colors.muted} />
      </TouchableOpacity>

      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10} activeOpacity={0.7}>
            <MaterialCommunityIcons name="close" size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Wheels + a fixed centre band that marks the current selection. */}
        <View style={styles.wheelsRow}>
          <View pointerEvents="none" style={styles.selectionBand} />
          <View style={styles.wheelCol}>
            <Wheel key={`h${seq}`} items={HOURS} index={hourIdx} onIndexChange={setHourIdx} />
          </View>
          <Text style={styles.wheelColon}>:</Text>
          <View style={styles.wheelCol}>
            <Wheel key={`m${seq}`} items={MINUTES} index={minIdx} onIndexChange={setMinIdx} />
          </View>
        </View>

        <View style={styles.segment}>
          {(['AM', 'PM'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.segmentBtn, period === p && styles.segmentBtnOn]}
              onPress={() => setPeriod(p)}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, period === p && styles.segmentTextOn]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={confirm} style={styles.doneBtn} activeOpacity={0.85}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </BottomSheet>
    </Field>
  );
}

const styles = StyleSheet.create({
  // Trigger (the field the user taps)
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

  // Bottom sheet
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,44,30,0.45)',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    ...shadows.card,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 10,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.foreground,
  },

  // Calendar
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 4,
  },
  calNav: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  calTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.foreground,
  },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.muted,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: { backgroundColor: colors.primary },
  dayText: { fontSize: 14.5, fontFamily: 'PlusJakartaSans_400Regular', color: colors.foreground },
  dayTextSelected: { color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },
  dayToday: { color: colors.primary, fontFamily: 'PlusJakartaSans_700Bold' },
  dayDisabled: { color: colors.muted, opacity: 0.4 },

  // Time wheels
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  wheelCol: { width: 78 },
  wheelColon: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.foreground,
    marginHorizontal: 4,
  },
  selectionBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ITEM_H * ((VISIBLE - 1) / 2),
    height: ITEM_H,
    borderRadius: 12,
    backgroundColor: colors.secondary,
  },
  wheelItem: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  wheelText: { fontSize: 18, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  wheelTextSelected: { fontSize: 20, fontFamily: 'PlusJakartaSans_700Bold', color: colors.primary },

  // AM/PM segmented control
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 4,
    marginTop: 18,
    gap: 4,
  },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  segmentBtnOn: { backgroundColor: colors.primary },
  segmentText: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.primaryLight },
  segmentTextOn: { color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },

  // Done
  doneBtn: {
    marginTop: 18,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  doneText: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});
