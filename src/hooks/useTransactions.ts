import { useCallback, useEffect, useRef, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import {
  addTransaction as apiAddTransaction,
  deleteTransaction as apiDeleteTransaction,
  getMonthlySummary as apiGetMonthlySummary,
  getTransactions as apiGetTransactions,
  MonthlySummary,
  NewTransactionInput,
} from '@/services/transactionService';
import { Transaction } from '@/types';

export interface UseTransactionsResult {
  transactions: Transaction[];
  monthlySummary: MonthlySummary | null;
  isLoading: boolean;
  error: string | null;
  selectedYear: number;
  selectedMonth: number;
  changeMonth: (year: number, month: number) => void;
  refresh: () => Promise<void>;
  addNewTransaction: (input: NewTransactionInput) => Promise<Transaction>;
  removeTransaction: (id: string | number) => Promise<boolean>;
}

/**
 * İşlem listesi, aylık özet ve veritabanı mutasyonlarını (ekleme/silme)
 * yöneten reaktif Custom React Hook.
 */
export function useTransactions(
  initialYear: number = new Date().getFullYear(),
  initialMonth: number = new Date().getMonth() + 1
): UseTransactionsResult {
  const db = useSQLiteContext();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);

  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const [txList, summary] = await Promise.all([
        apiGetTransactions(100, 0, db),
        apiGetMonthlySummary(selectedYear, selectedMonth, db),
      ]);
      // Sadece en son istek ise ve bileşen mount durumundaysa state'i güncelle
      if (isMountedRef.current && currentRequestId === requestIdRef.current) {
        setTransactions(txList);
        setMonthlySummary(summary);
      }
    } catch (err) {
      if (isMountedRef.current && currentRequestId === requestIdRef.current) {
        console.error('Veriler yüklenirken hata oluştu:', err);
        setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu');
      }
    } finally {
      if (isMountedRef.current && currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [db, selectedYear, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const changeMonth = useCallback((year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  }, []);

  const addNewTransaction = useCallback(
    async (input: NewTransactionInput): Promise<Transaction> => {
      setError(null);
      try {
        const created = await apiAddTransaction(input, db);
        await loadData();
        return created;
      } catch (err) {
        console.error('İşlem eklenirken hata oluştu:', err);
        const errMsg = err instanceof Error ? err.message : 'İşlem eklenemedi';
        setError(errMsg);
        throw err;
      }
    },
    [db, loadData]
  );

  const removeTransaction = useCallback(
    async (id: string | number): Promise<boolean> => {
      setError(null);
      try {
        const success = await apiDeleteTransaction(id, db);
        if (success) {
          await loadData();
        }
        return success;
      } catch (err) {
        console.error('İşlem silinirken hata oluştu:', err);
        const errMsg = err instanceof Error ? err.message : 'İşlem silinemedi';
        setError(errMsg);
        throw err;
      }
    },
    [db, loadData]
  );

  return {
    transactions,
    monthlySummary,
    isLoading,
    error,
    selectedYear,
    selectedMonth,
    changeMonth,
    refresh: loadData,
    addNewTransaction,
    removeTransaction,
  };
}
