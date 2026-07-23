import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArchHeader from '@/components/ArchHeader';
import { colors } from '@/constants/theme';
import { FormText, FormSelect, FormSection, SubmitButton } from '@/components/forms/fields';
import { PROGRAMS } from '@/constants/bookingsForms';
import { submitBooking, BookingsNotConfiguredError } from '@/services/bookingsApi';

const SERVICE_LABEL = 'Program Enrollment';

export default function EnrollmentForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [program, setProgram] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentDob, setStudentDob] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!program) e.program = 'Please choose a program';
    if (!studentName.trim()) e.studentName = 'Required';
    if (!guardianName.trim()) e.guardianName = 'Required';
    if (!guardianPhone.trim()) e.guardianPhone = 'Required';
    if (guardianEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail.trim()))
      e.guardianEmail = 'Enter a valid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) {
      Alert.alert('Please check the form', 'Some required fields are missing.');
      return;
    }
    setSubmitting(true);
    try {
      const { reference } = await submitBooking({
        formType: 'enrollment',
        serviceLabel: SERVICE_LABEL,
        fields: {
          Program: program,
          'Student Name': studentName.trim(),
          'Student Date of Birth': studentDob.trim(),
          'Parent/Guardian Name': guardianName.trim(),
          'Guardian Phone': guardianPhone.trim(),
          'Guardian Email': guardianEmail.trim(),
          'Notes / Medical / Allergies': notes.trim(),
        },
      });
      router.replace({
        pathname: '/bookings/submitted',
        params: { reference, service: SERVICE_LABEL },
      });
    } catch (err) {
      if (err instanceof BookingsNotConfiguredError) {
        Alert.alert('Not available yet', 'Online enrollment isn’t switched on yet. Please try again later or contact the masjid.');
      } else {
        Alert.alert('Could not send', err instanceof Error ? err.message : 'Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ArchHeader title="Program Enrollment" showBack onBack={() => router.back()} />
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
          <Text style={styles.intro}>
            Register for an Iman Academy program. The academy will confirm
            availability and next steps by email or phone.
          </Text>

          <FormSection title="Program">
            <FormSelect label="Choose a program" value={program} options={PROGRAMS} onSelect={setProgram} required error={errors.program} />
          </FormSection>

          <FormSection title="Student">
            <FormText label="Student full name" value={studentName} onChangeText={setStudentName} required error={errors.studentName} />
            <FormText label="Student date of birth" value={studentDob} onChangeText={setStudentDob} placeholder="DD/MM/YYYY" keyboardType="numbers-and-punctuation" />
          </FormSection>

          <FormSection title="Parent / Guardian">
            <FormText label="Guardian full name" value={guardianName} onChangeText={setGuardianName} required error={errors.guardianName} />
            <FormText label="Phone" value={guardianPhone} onChangeText={setGuardianPhone} keyboardType="phone-pad" required error={errors.guardianPhone} />
            <FormText label="Email" value={guardianEmail} onChangeText={setGuardianEmail} keyboardType="email-address" autoCapitalize="none" error={errors.guardianEmail} />
            <FormText label="Notes, medical conditions, or allergies" value={notes} onChangeText={setNotes} multiline />
          </FormSection>

          <SubmitButton label="Submit Enrollment" onPress={onSubmit} loading={submitting} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 18 },
  intro: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.primaryLight,
    marginBottom: 18,
  },
});
