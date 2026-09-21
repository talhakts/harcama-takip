import { type SQLiteDatabase } from 'expo-sqlite';

/**
 * SQLite veritabanı tablolarını ve gerekli indexleri oluşturan başlatma fonksiyonu.
 */
export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  try {
    // Performans ve veri tutarlılığı için PRAGMA ayarları
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
        categoryId TEXT NOT NULL,
        note TEXT,
        date TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_categoryId ON transactions(categoryId);

      CREATE TABLE IF NOT EXISTS budgets (
        categoryId TEXT PRIMARY KEY,
        monthlyLimit REAL NOT NULL
      );
    `);
  } catch (error) {
    console.error('Veritabanı tabloları oluşturulurken hata oluştu:', error);
    throw error;
  }
}
