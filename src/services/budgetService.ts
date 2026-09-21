import { type SQLiteDatabase } from 'expo-sqlite';
import { getDatabaseAsync } from '@/db/database';
import { BudgetLimit, CategoryId } from '@/types';
import { DEFAULT_CATEGORIES } from '@/utils/constants';
import { roundAmount } from '@/utils/formatters';

async function resolveDb(db?: SQLiteDatabase): Promise<SQLiteDatabase> {
  return db ?? (await getDatabaseAsync());
}

/**
 * Belirli bir kategori için aylık bütçe tavanı belirler veya günceller.
 */
export async function setBudgetLimit(
  categoryId: CategoryId,
  monthlyLimit: number,
  dbInstance?: SQLiteDatabase
): Promise<void> {
  try {
    const db = await resolveDb(dbInstance);
    const limit = roundAmount(monthlyLimit);

    await db.runAsync(
      `INSERT INTO budgets (categoryId, monthlyLimit)
       VALUES (?, ?)
       ON CONFLICT(categoryId) DO UPDATE SET monthlyLimit = excluded.monthlyLimit;`,
      [categoryId, limit]
    );
  } catch (error) {
    console.error('Bütçe limiti kaydedilirken hata oluştu:', error);
    throw error;
  }
}

/**
 * Belirli bir ay için tüm kategorilerin bütçe limitlerini ve gerçekleşen harcama tutarlarını getirir.
 */
export async function getBudgetLimits(
  year: number,
  month: number,
  dbInstance?: SQLiteDatabase
): Promise<BudgetLimit[]> {
  try {
    const db = await resolveDb(dbInstance);
    const paddedMonth = month.toString().padStart(2, '0');
    const monthKey = `${year}-${paddedMonth}`;

    // 1. Kayıtlı bütçeleri al
    const budgetRows = await db.getAllAsync<{
      categoryId: CategoryId;
      monthlyLimit: number;
    }>(`SELECT categoryId, monthlyLimit FROM budgets;`);

    const budgetMap = new Map<CategoryId, number>();
    for (const b of budgetRows) {
      budgetMap.set(b.categoryId, roundAmount(b.monthlyLimit));
    }

    // 2. İlgili aydaki gerçekleşen harcamaları al
    const spentRows = await db.getAllAsync<{
      categoryId: CategoryId;
      totalSpent: number;
    }>(
      `SELECT categoryId, COALESCE(SUM(amount), 0) as totalSpent
       FROM transactions
       WHERE substr(date, 1, 7) = ? AND type = 'expense'
       GROUP BY categoryId;`,
      [monthKey]
    );

    const spentMap = new Map<CategoryId, number>();
    for (const s of spentRows) {
      spentMap.set(s.categoryId, roundAmount(s.totalSpent));
    }

    // Sadece gider kategorilerini listele (salary hariç)
    return DEFAULT_CATEGORIES.filter((cat) => cat.id !== 'salary').map((cat) => ({
      categoryId: cat.id,
      monthlyLimit: budgetMap.get(cat.id) ?? 0,
      currentSpent: spentMap.get(cat.id) ?? 0,
    }));
  } catch (error) {
    console.error('Bütçe limitleri getirilirken hata oluştu:', error);
    throw error;
  }
}
