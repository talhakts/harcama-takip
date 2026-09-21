import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { DATABASE_NAME } from '@/db/database';
import { initializeDatabase } from '@/db/schema';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'İşlem Ekle' }} />
      </Stack>
    </SQLiteProvider>
  );
}
