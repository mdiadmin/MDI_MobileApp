import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import ArchHeader from '@/components/ArchHeader';
import { colors, shadows } from '@/constants/theme';
import {
  FormText,
  FormSelect,
  FormCheckbox,
  FormStepper,
  FormSection,
  PolicyList,
  SubmitButton,
} from '@/components/forms/fields';
import {
  FormDateField,
  FormTimeField,
  TimeValue,
  formatDate,
  formatTime,
  combineDateTimeISO,
} from '@/components/forms/datetime';
import { PROVINCES, FACILITY_POLICIES } from '@/constants/bookingsForms';
import { useFacilityPricing } from '@/services/bookingsPricing';
import { submitBooking, BookingsNotConfiguredError } from '@/services/bookingsApi';

const SERVICE_LABEL = 'Facility Booking';

export default function FacilityForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Prices come from the staff-editable "Pricing" tab in the Google Sheet,
  // with bundled defaults as an instant/offline fallback.
  const pricing = useFacilityPricing();

  // Client information
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organization, setOrganization] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [homePhone, setHomePhone] = useState('');
  const [cellPhone, setCellPhone] = useState('');
  const [email, setEmail] = useState('');

  // Event information
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [setupTime, setSetupTime] = useState<TimeValue | null>(null);
  const [startTime, setStartTime] = useState<TimeValue | null>(null);
  const [endTime, setEndTime] = useState<TimeValue | null>(null);
  const [cleanupTime, setCleanupTime] = useState<TimeValue | null>(null);
  const [eventType, setEventType] = useState('');
  const [eventSummary, setEventSummary] = useState('');
  const [brothers, setBrothers] = useState('');
  const [sisters, setSisters] = useState('');

  // Facilities & add-ons
  const [spaces, setSpaces] = useState<Record<string, boolean>>({});
  const [optional, setOptional] = useState<Record<string, number>>({});
  const [av, setAv] = useState<Record<string, number>>({});
  const [otherRequests, setOtherRequests] = useState('');

  // Agreement
  const [agree, setAgree] = useState(false);
  const [signatureName, setSignatureName] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const estimate = useMemo(() => {
    let total = 0;
    pricing.spaces.forEach((s) => {
      if (spaces[s.key]) total += s.base + s.mandatory;
    });
    pricing.optional.forEach((s) => {
      total += (optional[s.key] ?? 0) * s.price;
    });
    pricing.av.forEach((s) => {
      total += (av[s.key] ?? 0) * s.price;
    });
    return total;
  }, [spaces, optional, av, pricing]);

  const toggleSpace = (key: string) => setSpaces((p) => ({ ...p, [key]: !p[key] }));
  const setOpt = (key: string, v: number) => setOptional((p) => ({ ...p, [key]: v }));
  const setAvQty = (key: string, v: number) => setAv((p) => ({ ...p, [key]: v }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'Required';
    if (!lastName.trim()) e.lastName = 'Required';
    if (!email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email';
    if (!cellPhone.trim() && !homePhone.trim()) e.cellPhone = 'A phone number is required';
    if (!eventDate) e.eventDate = 'Required';
    if (!startTime) e.startTime = 'Required';
    if (!endTime) e.endTime = 'Required';
    if (!eventType.trim()) e.eventType = 'Required';
    if (!Object.values(spaces).some(Boolean)) e.spaces = 'Select at least one facility';
    if (!signatureName.trim()) e.signatureName = 'Type your full name to sign';
    if (!agree) e.agree = 'You must agree to the terms and waiver';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildFields = (): Record<string, string | number> => {
    const selectedSpaces = pricing.spaces.filter((s) => spaces[s.key]).map((s) => s.label);
    const optList = pricing.optional.filter((s) => (optional[s.key] ?? 0) > 0).map(
      (s) => `${s.label} ×${optional[s.key]}`,
    );
    const avList = pricing.av.filter((s) => (av[s.key] ?? 0) > 0).map(
      (s) => `${s.label} ×${av[s.key]}`,
    );
    const brothersN = parseInt(brothers, 10) || 0;
    const sistersN = parseInt(sisters, 10) || 0;

    return {
      'First Name': firstName.trim(),
      'Middle Name': middleName.trim(),
      'Last Name': lastName.trim(),
      Organization: organization.trim(),
      Address: address.trim(),
      City: city.trim(),
      Province: province,
      'Postal Code': postalCode.trim(),
      'Home Phone': homePhone.trim(),
      'Cell Phone': cellPhone.trim(),
      Email: email.trim(),
      'Event Date': formatDate(eventDate),
      'Set-up Time': formatTime(setupTime),
      'Start Time': formatTime(startTime),
      'End Time': formatTime(endTime),
      'Clean-up Time': formatTime(cleanupTime),
      'Event Type': eventType.trim(),
      'Event Summary': eventSummary.trim(),
      'Attendees (Brothers)': brothersN,
      'Attendees (Sisters)': sistersN,
      'Attendees (Total)': brothersN + sistersN,
      Facilities: selectedSpaces.join('; '),
      'Optional Services': optList.join('; '),
      'AV Requirements': avList.join('; '),
      'Other Requests': otherRequests.trim(),
      'Estimated Total': `$${estimate.toFixed(2)}`,
      'Agreed to Terms & Waiver': agree ? 'Yes' : 'No',
      Signature: signatureName.trim(),
    };
  };

  const buildCalendar = () => {
    if (!eventDate || !startTime || !endTime) return undefined;
    const start = setupTime ?? startTime;
    const end = cleanupTime ?? endTime;
    return {
      title: `⏳ PENDING — ${eventType.trim() || 'Facility Booking'} (${firstName.trim()} ${lastName.trim()})`,
      startISO: combineDateTimeISO(eventDate, start),
      endISO: combineDateTimeISO(eventDate, end),
      description: `Facility booking request. Est. ${`$${estimate.toFixed(2)}`}. Contact: ${cellPhone || homePhone} / ${email}`,
    };
  };

  const onSubmit = async () => {
    if (!validate()) {
      Alert.alert('Please check the form', 'Some required fields are missing or invalid.');
      return;
    }
    setSubmitting(true);
    try {
      const { reference } = await submitBooking({
        formType: 'facility',
        serviceLabel: SERVICE_LABEL,
        fields: buildFields(),
        calendar: buildCalendar(),
      });
      router.replace({
        pathname: '/bookings/submitted',
        params: { reference, service: SERVICE_LABEL },
      });
    } catch (err) {
      if (err instanceof BookingsNotConfiguredError) {
        Alert.alert('Not available yet', 'Online booking isn’t switched on yet. Please try again later or contact the masjid.');
      } else {
        Alert.alert('Could not send', err instanceof Error ? err.message : 'Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ArchHeader title="Facility Booking" showBack onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FormSection title="Your Information">
            <View style={styles.row2}>
              <View style={styles.col}>
                <FormText label="First Name" value={firstName} onChangeText={setFirstName} required error={errors.firstName} />
              </View>
              <View style={styles.col}>
                <FormText label="Last Name" value={lastName} onChangeText={setLastName} required error={errors.lastName} />
              </View>
            </View>
            <FormText label="Middle Name" value={middleName} onChangeText={setMiddleName} />
            <FormText label="Organization (if any)" value={organization} onChangeText={setOrganization} />
            <FormText label="Address" value={address} onChangeText={setAddress} />
            <View style={styles.row2}>
              <View style={styles.col}>
                <FormText label="City" value={city} onChangeText={setCity} />
              </View>
              <View style={styles.col}>
                <FormSelect label="Province" value={province} options={PROVINCES} onSelect={setProvince} />
              </View>
            </View>
            <FormText label="Postal Code" value={postalCode} onChangeText={setPostalCode} autoCapitalize="characters" maxLength={7} />
            <View style={styles.row2}>
              <View style={styles.col}>
                <FormText label="Cell Phone" value={cellPhone} onChangeText={setCellPhone} keyboardType="phone-pad" required error={errors.cellPhone} />
              </View>
              <View style={styles.col}>
                <FormText label="Home Phone" value={homePhone} onChangeText={setHomePhone} keyboardType="phone-pad" />
              </View>
            </View>
            <FormText label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" required error={errors.email} />
          </FormSection>

          <FormSection title="Event Details">
            <FormDateField label="Event Date" value={eventDate} onChange={setEventDate} required error={errors.eventDate} />
            <View style={styles.row2}>
              <View style={styles.col}>
                <FormTimeField label="Set-up Time" value={setupTime} onChange={setSetupTime} />
              </View>
              <View style={styles.col}>
                <FormTimeField label="Start Time" value={startTime} onChange={setStartTime} required error={errors.startTime} />
              </View>
            </View>
            <View style={styles.row2}>
              <View style={styles.col}>
                <FormTimeField label="End Time" value={endTime} onChange={setEndTime} required error={errors.endTime} />
              </View>
              <View style={styles.col}>
                <FormTimeField label="Clean-up Time" value={cleanupTime} onChange={setCleanupTime} />
              </View>
            </View>
            <FormText label="Event Type" value={eventType} onChangeText={setEventType} placeholder="e.g. banquet dinner, meeting" required error={errors.eventType} />
            <FormText label="Event Summary" value={eventSummary} onChangeText={setEventSummary} multiline />
            <View style={styles.row2}>
              <View style={styles.col}>
                <FormText label="Attendees — Brothers" value={brothers} onChangeText={setBrothers} keyboardType="number-pad" />
              </View>
              <View style={styles.col}>
                <FormText label="Attendees — Sisters" value={sisters} onChangeText={setSisters} keyboardType="number-pad" />
              </View>
            </View>
          </FormSection>

          <FormSection title="Facilities" subtitle="Select the space(s) you'd like to reserve.">
            {errors.spaces ? <Text style={styles.sectionError}>{errors.spaces}</Text> : null}
            {pricing.spaces.map((s) => {
              const selected = !!spaces[s.key];
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.spaceCard, selected && styles.spaceCardSelected]}
                  onPress={() => toggleSpace(s.key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.spaceCheck, selected && styles.spaceCheckOn]}>
                    {selected ? <MaterialCommunityIcons name="check" size={14} color="#fff" /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.spaceHead}>
                      <Text style={styles.spaceTitle}>{s.label}</Text>
                      <Text style={styles.spacePrice}>${(s.base + s.mandatory).toFixed(0)}</Text>
                    </View>
                    {s.capacity ? <Text style={styles.spaceMeta}>Capacity {s.capacity}</Text> : null}
                    <Text style={styles.spaceIncluded}>{s.included}</Text>
                    {s.mandatory > 0 ? (
                      <Text style={styles.spaceFee}>Includes ${s.mandatory} {s.mandatoryNote?.toLowerCase()}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </FormSection>

          <FormSection title="Optional Services" subtitle="Add any extras and quantities.">
            {pricing.optional.map((s) => (
              <FormStepper
                key={s.key}
                label={s.label}
                sublabel={`$${s.price.toFixed(2)} each`}
                value={optional[s.key] ?? 0}
                onChange={(v) => setOpt(s.key, v)}
              />
            ))}
          </FormSection>

          <FormSection title="Audio / Video" subtitle="Microphones, speakers, screens, and support.">
            {pricing.av.map((s) => (
              <FormStepper
                key={s.key}
                label={s.label}
                sublabel={`$${s.price.toFixed(2)} each`}
                value={av[s.key] ?? 0}
                onChange={(v) => setAvQty(s.key, v)}
              />
            ))}
            <View style={{ height: 8 }} />
            <FormText label="Any other requirements?" value={otherRequests} onChangeText={setOtherRequests} multiline />
          </FormSection>

          <View style={[styles.totalCard, shadows.action]}>
            <View>
              <Text style={styles.totalLabel}>Estimated Total</Text>
              <Text style={styles.totalNote}>Refundable deposits may apply · confirmed by ICM office</Text>
            </View>
            <Text style={styles.totalValue}>${estimate.toFixed(2)}</Text>
          </View>

          <FormSection title="Terms & Agreement">
            <PolicyList items={FACILITY_POLICIES} />
            <View style={{ height: 14 }} />
            <FormCheckbox
              label="I have read and agree to ICM's booking Terms & Conditions and Waiver of Liability. I understand availability is not confirmed until the ICM office responds."
              value={agree}
              onValueChange={setAgree}
              error={errors.agree}
            />
            <FormText
              label="Signature (type your full name)"
              value={signatureName}
              onChangeText={setSignatureName}
              placeholder="Full name"
              required
              error={errors.signatureName}
            />
          </FormSection>

          <SubmitButton label="Submit Booking Request" onPress={onSubmit} loading={submitting} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 18 },
  row2: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  sectionError: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#C0392B',
    marginBottom: 8,
  },
  spaceCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  spaceCardSelected: { borderColor: colors.primary, backgroundColor: colors.secondary },
  spaceCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  spaceCheckOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  spaceHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spaceTitle: { fontSize: 14.5, fontFamily: 'PlusJakartaSans_700Bold', color: colors.foreground },
  spacePrice: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.primary },
  spaceMeta: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.accent, marginTop: 2 },
  spaceIncluded: { fontSize: 12, lineHeight: 17, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 4 },
  spaceFee: { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: colors.primaryLight, marginTop: 4 },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  totalLabel: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: colors.foreground },
  totalNote: { fontSize: 10.5, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 3, maxWidth: 200 },
  totalValue: { fontSize: 24, fontFamily: 'DMSerifDisplay_400Regular', color: colors.primary },
});
