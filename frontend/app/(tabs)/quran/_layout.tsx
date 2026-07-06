import { Stack } from 'expo-router';

export default function QuranStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[surahNumber]" />
    </Stack>
  );
}
