import React, { useState } from 'react';
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
import { colors } from '@/constants/theme';
import {
  FormText,
  FormSelect,
  FormCheckbox,
  FormSection,
  SubmitButton,
} from '@/components/forms/fields';
import { PROVINCES } from '@/constants/bookingsForms';
import { submitBooking, BookingsNotConfiguredError } from '@/services/bookingsApi';

const SERVICE_LABEL = 'Zakat Application';
const YEAR = new Date().getFullYear();

type Dependent = { name: string; dob: string; student: boolean };

export default function ZakatForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Personal
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');

  // Dependents
  const [dependents, setDependents] = useState<Dependent[]>([]);

  // Income (monthly)
  const [incomeCurrent, setIncomeCurrent] = useState('');
  const [incomeOther, setIncomeOther] = useState('');
  const [childSupport, setChildSupport] = useState('');
  const [childBenefit, setChildBenefit] = useState('');
  const [welfare, setWelfare] = useState('');
  const [trillium, setTrillium] = useState('');
  const [trilliumAmount, setTrilliumAmount] = useState('');
  const [taxLast, setTaxLast] = useState('');
  const [taxPrev, setTaxPrev] = useState('');

  // Expenses (monthly)
  const [rent, setRent] = useState('');
  const [food, setFood] = useState('');
  const [childcare, setChildcare] = useState('');
  const [transport, setTransport] = useState('');
  const [insurance, setInsurance] = useState('');
  const [medical, setMedical] = useState('');
  const [otherExpenses, setOtherExpenses] = useState('');

  // Agreement
  const [certifyAccurate, setCertifyAccurate] = useState(false);
  const [ackFalsified, setAckFalsified] = useState(false);
  const [ackVerify, setAckVerify] = useState(false);
  const [signatureName, setSignatureName] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const addDependent = () => setDependents((p) => [...p, { name: '', dob: '', student: false }]);
  const removeDependent = (i: number) => setDependents((p) => p.filter((_, idx) => idx !== i));
  const updateDependent = (i: number, patch: Partial<Dependent>) =>
    setDependents((p) => p.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'Required';
    if (!lastName.trim()) e.lastName = 'Required';
    if (!phone.trim()) e.phone = 'Required';
    if (!signatureName.trim()) e.signatureName = 'Type your full name to sign';
    if (!certifyAccurate || !ackFalsified || !ackVerify) e.certify = 'Please accept all three statements';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildFields = (): Record<string, string | number> => {
    const depStr = dependents
      .map((d, i) => `${i + 1}) ${d.name || '—'} (DOB ${d.dob || '—'}) — Student: ${d.student ? 'Yes' : 'No'}`)
      .join('; ');
    return {
      'First Name': firstName.trim(),
      'Middle Name': middleName.trim(),
      'Last Name': lastName.trim(),
      Address: address.trim(),
      City: city.trim(),
      Province: province,
      'Postal Code': postalCode.trim(),
      'Date of Birth': dob.trim(),
      Phone: phone.trim(),
      'Number of Dependents': dependents.length,
      Dependents: depStr,
      'Income — Current (monthly)': incomeCurrent.trim(),
      'Income — Other Household (monthly)': incomeOther.trim(),
      'Income — Child Support (monthly)': childSupport.trim(),
      'Income — Child Benefit (monthly)': childBenefit.trim(),
      'Income — Welfare/Ontario Works (monthly)': welfare.trim(),
      'Trillium Drug Benefits': trillium,
      'Trillium Approx Amount': trilliumAmount.trim(),
      [`Tax Return Line 150 (${YEAR - 1})`]: taxLast.trim(),
      [`Tax Return Line 150 (${YEAR - 2})`]: taxPrev.trim(),
      'Expense — Rent': rent.trim(),
      'Expense — Food/Groceries': food.trim(),
      'Expense — Childcare': childcare.trim(),
      'Expense — Transportation': transport.trim(),
      'Expense — Insurance': insurance.trim(),
      'Expense — Medical': medical.trim(),
      'Expense — Other': otherExpenses.trim(),
      Certified: 'Yes',
      Signature: signatureName.trim(),
    };
  };

  const onSubmit = async () => {
    if (!validate()) {
      Alert.alert('Please check the form', 'Some required fields are missing.');
      return;
    }
    setSubmitting(true);
    try {
      const { reference } = await submitBooking({
        formType: 'zakat',
        serviceLabel: SERVICE_LABEL,
        fields: buildFields(),
      });
      router.replace({
        pathname: '/bookings/submitted',
        params: { reference, service: SERVICE_LABEL },
      });
    } catch (err) {
      if (err instanceof BookingsNotConfiguredError) {
        Alert.alert('Not available yet', 'Online applications aren’t switched on yet. Please try again later or contact the masjid.');
      } else {
        Alert.alert('Could not send', err instanceof Error ? err.message : 'Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const money = (label: string, value: string, setter: (v: string) => void) => (
    <FormText label={label} value={value} onChangeText={setter} keyboardType="numeric" placeholder="$0" />
  );

  return (
    <View style={styles.screen}>
      <ArchHeader title="Zakat Application" showBack onBack={() => router.back()} />
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
          <View style={styles.privacy}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={colors.primary} />
            <Text style={styles.privacyText}>
              This application is private and goes only to the zakat team — not to
              the general inbox. We don’t collect your SIN here; identity is verified
              later in person. Please answer honestly.
            </Text>
          </View>

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
            <FormText label="Address" value={address} onChangeText={setAddress} />
            <View style={styles.row2}>
              <View style={styles.col}>
                <FormText label="City" value={city} onChangeText={setCity} />
              </View>
              <View style={styles.col}>
                <FormSelect label="Province" value={province} options={PROVINCES} onSelect={setProvince} />
              </View>
            </View>
            <View style={styles.row2}>
              <View style={styles.col}>
                <FormText label="Postal Code" value={postalCode} onChangeText={setPostalCode} autoCapitalize="characters" maxLength={7} />
              </View>
              <View style={styles.col}>
                <FormText label="Date of Birth" value={dob} onChangeText={setDob} placeholder="DD/MM/YYYY" keyboardType="numbers-and-punctuation" />
              </View>
            </View>
            <FormText label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" required error={errors.phone} />
          </FormSection>

          <FormSection title="Dependents" subtitle="Add anyone who depends on you financially.">
            {dependents.map((d, i) => (
              <View key={i} style={styles.depCard}>
                <View style={styles.depHead}>
                  <Text style={styles.depTitle}>Dependent {i + 1}</Text>
                  <TouchableOpacity onPress={() => removeDependent(i)} hitSlop={8}>
                    <MaterialCommunityIcons name="close-circle" size={20} color={colors.muted} />
                  </TouchableOpacity>
                </View>
                <FormText label="Full Name" value={d.name} onChangeText={(v) => updateDependent(i, { name: v })} />
                <View style={styles.row2}>
                  <View style={styles.col}>
                    <FormText label="Date of Birth" value={d.dob} onChangeText={(v) => updateDependent(i, { dob: v })} placeholder="DD/MM/YYYY" keyboardType="numbers-and-punctuation" />
                  </View>
                  <View style={styles.col}>
                    <FormCheckbox label="Student" value={d.student} onValueChange={(v) => updateDependent(i, { student: v })} />
                  </View>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addBtn} onPress={addDependent} activeOpacity={0.7}>
              <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
              <Text style={styles.addText}>Add dependent</Text>
            </TouchableOpacity>
          </FormSection>

          <FormSection title="Monthly Income">
            {money('Current income', incomeCurrent, setIncomeCurrent)}
            {money('Other household / family income', incomeOther, setIncomeOther)}
            {money('Child support', childSupport, setChildSupport)}
            {money('Child benefit (Ontario & Federal)', childBenefit, setChildBenefit)}
            {money('Welfare incl. Ontario Works', welfare, setWelfare)}
            <FormSelect label="Trillium Drug Benefits" value={trillium} options={['Yes', 'No']} onSelect={setTrillium} />
            {trillium === 'Yes' ? money('Trillium — approx. amount', trilliumAmount, setTrilliumAmount) : null}
            {money(`Tax return — Line 150 (${YEAR - 1})`, taxLast, setTaxLast)}
            {money(`Tax return — Line 150 (${YEAR - 2})`, taxPrev, setTaxPrev)}
          </FormSection>

          <FormSection title="Monthly Expenses">
            {money('Rent', rent, setRent)}
            {money('Food / Groceries', food, setFood)}
            {money('Childcare', childcare, setChildcare)}
            {money('Transportation', transport, setTransport)}
            {money('Insurance', insurance, setInsurance)}
            {money('Medical expenses', medical, setMedical)}
            <FormText label="Other expenses" value={otherExpenses} onChangeText={setOtherExpenses} multiline />
          </FormSection>

          <FormSection title="Declaration">
            {errors.certify ? <Text style={styles.sectionError}>{errors.certify}</Text> : null}
            <FormCheckbox label="I certify that the information provided is accurate to the best of my knowledge." value={certifyAccurate} onValueChange={setCertifyAccurate} />
            <FormCheckbox label="I understand that submitting false information will result in my application being declined, and legal action may be taken." value={ackFalsified} onValueChange={setAckFalsified} />
            <FormCheckbox label="I acknowledge that Masjid Darul Iman may verify any information in this application as needed." value={ackVerify} onValueChange={setAckVerify} />
            <View style={{ height: 6 }} />
            <FormText label="Signature (type your full name)" value={signatureName} onChangeText={setSignatureName} placeholder="Full name" required error={errors.signatureName} />
          </FormSection>

          <SubmitButton label="Submit Application" onPress={onSubmit} loading={submitting} />
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
  privacy: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.secondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.primaryLight,
  },
  sectionError: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#C0392B',
    marginBottom: 8,
  },
  depCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 14,
    marginBottom: 12,
  },
  depHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  depTitle: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: colors.foreground },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addText: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.primary },
});
