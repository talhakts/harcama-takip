import { type SQLiteDatabase } from 'expo-sqlite';
import { getDatabaseAsync } from '@/db/database';
import { CategoryId, Transaction, TransactionType } from '@/types';
import { roundAmount } from '@/utils/formatters';

export interface NewTransactionInput {
  amount: number;
  type: TransactionType;
  categoryId: CategoryId;
  note?: string;
  date: string;
  createdAt?: string;
}

export interface MonthlyCategoryBreakdown {
  categoryId: CategoryId;
  total: number;
  percentage: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  categoryBreakdown: MonthlyCategoryBreakdown[];
}

/**
 * SQLite instance yardımcısı: Verilen db'yi kullanır veya varsayılan db bağlantısını alır.
 */
async function resolveDb(db?: SQLiteDatabase): Promise<SQLiteDatabase> {
  return db ?? (await getDatabaseAsync());
}

/**
 * Yeni bir gelir veya gider işlemi ekler.
 */
export async function addTransaction(
  input: NewTransactionInput,
  dbInstance?: SQLiteDatabase
): Promise<Transaction> {
  try {
    const db = await resolveDb(dbInstance);
    const amount = roundAmount(input.amount);
    const createdAt = input.createdAt || new Date().toISOString();
    const note = input.note?.trim() || null;

    const result = await db.runAsync(
      `INSERT INTO transactions (amount, type, categoryId, note, date, createdAt)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [amount, input.type, input.categoryId, note, input.date, createdAt]
    );

    return {
      id: result.lastInsertRowId,
      amount,
      type: input.type,
      categoryId: input.categoryId,
      note: note ?? undefined,
      date: input.date,
      createdAt,
    };
  } catch (error) {
    console.error('İşlem eklenirken hata oluştu:', error);
    throw error;
  }
}

/**
 * İşlemleri tarihe göre azalan sırada (en yeniden eskiye) getirir.
 */
export async function getTransactions(
  limit: number = 50,
  offset: number = 0,
  dbInstance?: SQLiteDatabase
): Promise<Transaction[]> {
  try {
    const db = await resolveDb(dbInstance);
    const rows = await db.getAllAsync<{
      id: number;
      amount: number;
      type: TransactionType;
      categoryId: CategoryId;
      note: string | null;
      date: string;
      createdAt: string;
    }>(
      `SELECT id, amount, type, categoryId, note, date, createdAt
       FROM transactions
       ORDER BY date DESC, id DESC
       LIMIT ? OFFSET ?;`,
      [limit, offset]
    );

    return rows.map((row) => ({
      id: row.id,
      amount: roundAmount(row.amount),
      type: row.type,
      categoryId: row.categoryId,
      note: row.note ?? undefined,
      date: row.date,
      createdAt: row.createdAt,
    }));
  } catch (error) {
    console.error('İşlemler listelenirken hata oluştu:', error);
    throw error;
  }
}

/**
 * Belirli bir ayın (Yıl, Ay: 1-12) gelir, gider, bakiye ve kategori bazlı harcama dağılımını hesaplar.
 */
export async function getMonthlySummary(
  year: number,
  month: number,
  dbInstance?: SQLiteDatabase
): Promise<MonthlySummary> {
  try {
    const db = await resolveDb(dbInstance);
    const paddedMonth = month.toString().padStart(2, '0');
    const monthKey = `${year}-${paddedMonth}`;

    // 1. Toplam Gelir ve Gider
    const totals = await db.getAllAsync<{
      type: TransactionType;
      total: number;
    }>(
      `SELECT type, COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE substr(date, 1, 7) = ?
       GROUP BY type;`,
      [monthKey]
    );

    let totalIncome = 0;
    let totalExpense = 0;

    for (const item of totals) {
      if (item.type === 'income') {
        totalIncome = roundAmount(item.total);
      } else if (item.type === 'expense') {
        totalExpense = roundAmount(item.total);
      }
    }

    const netBalance = roundAmount(totalIncome - totalExpense);

    // 2. Kategori bazlı gider dağılımı
    const categoryRows = await db.getAllAsync<{
      categoryId: CategoryId;
      total: number;
    }>(
      `SELECT categoryId, COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE substr(date, 1, 7) = ? AND type = 'expense'
       GROUP BY categoryId
       ORDER BY total DESC;`,
      [monthKey]
    );

    const categoryBreakdown: MonthlyCategoryBreakdown[] = categoryRows.map((row) => {
      const catTotal = roundAmount(row.total);
      const percentage =
        totalExpense > 0 ? Math.round((catTotal / totalExpense) * 100) : 0;
      return {
        categoryId: row.categoryId,
        total: catTotal,
        percentage,
      };
    });

    return {
      year,
      month,
      totalIncome,
      totalExpense,
      netBalance,
      categoryBreakdown,
    };
  } catch (error) {
    console.error('Aylık özet hesaplanırken hata oluştu:', error);
    throw error;
  }
}

/**
 * Belirtilen ID'ye sahip işlemi siler.
 */
export async function deleteTransaction(
  id: string | number,
  dbInstance?: SQLiteDatabase
): Promise<boolean> {
  try {
    const db = await resolveDb(dbInstance);
    const result = await db.runAsync(`DELETE FROM transactions WHERE id = ?;`, [id]);
    return result.changes > 0;
  } catch (error) {
    console.error('İşlem silinirken hata oluştu:', error);
    throw error;
  }
}
