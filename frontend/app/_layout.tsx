// @ts-ignore: Side-effect CSS import without type declarations
import "@/global.css";
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}