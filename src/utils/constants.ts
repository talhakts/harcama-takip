import { Category, CategoryId } from '@/types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'food',
    name: 'Yemek',
    icon: 'restaurant-outline',
    color: '#F97316', // Turuncu
  },
  {
    id: 'transport',
    name: 'Ulaşım',
    icon: 'car-outline',
    color: '#3B82F6', // Mavi
  },
  {
    id: 'bills',
    name: 'Faturalar',
    icon: 'receipt-outline',
    color: '#EF4444', // Kırmızı
  },
  {
    id: 'entertainment',
    name: 'Eğlence',
    icon: 'game-controller-outline',
    color: '#8B5CF6', // Mor
  },
  {
    id: 'shopping',
    name: 'Alışveriş',
    icon: 'cart-outline',
    color: '#EC4899', // Pembe
  },
  {
    id: 'salary',
    name: 'Maaş / Gelir',
    icon: 'cash-outline',
    color: '#10B981', // Yeşil
  },
  {
    id: 'other',
    name: 'Diğer',
    icon: 'ellipsis-horizontal-circle-outline',
    color: '#64748B', // Gri / Slate
  },
];

export const CATEGORIES_MAP: Record<CategoryId, Category> = DEFAULT_CATEGORIES.reduce(
  (acc, category) => {
    acc[category.id] = category;
    return acc;
  },
  {} as Record<CategoryId, Category>
);

export function getCategoryById(id: CategoryId): Category {
  return (
    CATEGORIES_MAP[id] || {
      id: 'other',
      name: 'Diğer',
      icon: 'ellipsis-horizontal-circle-outline',
      color: '#64748B',
    }
  );
}
