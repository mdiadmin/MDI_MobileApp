import { Stack } from 'expo-router';

export default function BookingsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="facility" />
      <Stack.Screen name="zakat" />
      <Stack.Screen name="funeral" />
      <Stack.Screen name="enrollment" />
      <Stack.Screen name="submitted" />
    </Stack>
  );
}
