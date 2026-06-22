import { Redirect } from "expo-router";

export default function Index() {
  // TODO: replace with auth check from store
  const isAuthenticated = false;
  return <Redirect href={isAuthenticated ? "/(tabs)" : "/(auth)/login"} />;
}
