import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryBadge } from './CategoryBadge';
import { Transaction } from '@/types';
import { getCategoryById } from '@/utils/constants';
import { formatCurrency, formatShortDate } from '@/utils/formatters';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete?: (id: string | number) => void;
}

export function TransactionItem({ transaction, onDelete }: TransactionItemProps) {
  const category = getCategoryById(transaction.categoryId);
  const isIncome = transaction.type === 'income';

  const handleLongPress = () => {
    if (!onDelete) return;

    Alert.alert(
      'İşlemi Sil',
      `"${transaction.note || category.name}" kaydını silmek istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(transaction.id);
            } catch (err) {
              console.error('İşlem silinemedi:', err);
              Alert.alert(
                'Hata',
                'İşlem silinirken bir hata oluştu. Lütfen tekrar deneyiniz.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onLongPress={handleLongPress}
      style={styles.card}
    >
      {/* Sol: Kategori Rozeti / İkonu */}
      <CategoryBadge categoryId={transaction.categoryId} size="medium" />

      {/* Orta: Kategori Adı ve Açıklama/Not */}
      <View style={styles.detailsContainer}>
        <Text style={styles.categoryName} numberOfLines={1}>
          {category.name}
        </Text>
        <Text style={styles.note} numberOfLines={1}>
          {transaction.note ? transaction.note : formatShortDate(transaction.date)}
        </Text>
      </View>

      {/* Sağ: Tarih ve Tutar */}
      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.amount,
            isIncome ? styles.incomeText : styles.expenseText,
          ]}
        >
          {isIncome ? '+' : '-'} {formatCurrency(Math.abs(transaction.amount))}
        </Text>
        <Text style={styles.dateText}>{formatShortDate(transaction.date)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  note: {
    fontSize: 13,
    color: '#64748B',
  },
  amountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  incomeText: {
    color: '#10B981',
  },
  expenseText: {
    color: '#EF4444',
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
