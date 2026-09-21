import * as SQLite from 'expo-sqlite';
import { initializeDatabase } from './schema';

export const DATABASE_NAME = 'expense_tracker.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * SQLite veritabanı bağlantısını döndürür ve henüz başlatılmamışsa tabloları kurar.
 */
export async function getDatabaseAsync(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await initializeDatabase(db);
  dbInstance = db;
  return db;
}
