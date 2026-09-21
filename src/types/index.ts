import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export type TransactionType = 'expense' | 'income';

export type CategoryId =
  | 'food'
  | 'transport'
  | 'bills'
  | 'entertainment'
  | 'shopping'
  | 'salary'
  | 'other';

export interface Category {
  id: CategoryId;
  name: string;
  icon: IoniconsName;
  color: string;
}

export interface Transaction {
  id: string | number;
  amount: number; // TL cinsinden ondalıklı sayı (örn: 150.50)
  type: TransactionType;
  categoryId: CategoryId;
  note?: string;
  date: string; // ISO string (örn: '2026-09-21T00:00:00.000Z' veya '2026-09-21')
  createdAt: string; // ISO timestamp
}

export interface BudgetLimit {
  categoryId: CategoryId;
  monthlyLimit: number;
  currentSpent: number;
}
