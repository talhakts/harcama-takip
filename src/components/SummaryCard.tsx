import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/utils/formatters';

interface SummaryCardProps {
  netBalance: number;
  totalIncome: number;
  totalExpense: number;
  monthName?: string;
}

export function SummaryCard({
  netBalance,
  totalIncome,
  totalExpense,
  monthName,
}: SummaryCardProps) {
  const isPositive = netBalance >= 0;

  const incomeDisplay =
    totalIncome === 0 ? formatCurrency(0) : `+${formatCurrency(totalIncome)}`;
  const expenseDisplay =
    totalExpense === 0 ? formatCurrency(0) : `-${formatCurrency(totalExpense)}`;

  return (
    <View style={styles.card}>
      {/* Kart Başlığı / Ay Bilgisi */}
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>TOPLAM BAKİYE</Text>
        {monthName && (
          <View style={styles.monthBadge}>
            <Text style={styles.monthText}>{monthName}</Text>
          </View>
        )}
      </View>

      {/* Ana Bakiye Tutarı */}
      <Text
        style={[
          styles.balanceAmount,
          !isPositive && styles.negativeBalanceText,
        ]}
      >
        {formatCurrency(netBalance)}
      </Text>

      {/* Gelir & Gider İki Sütunlu Alt Panel */}
      <View style={styles.statsContainer}>
        {/* Gelir */}
        <View style={styles.statItem}>
          <View style={[styles.iconCircle, styles.incomeIconBg]}>
            <Ionicons name="arrow-up" size={16} color="#10B981" />
          </View>
          <View>
            <Text style={styles.statLabel}>Aylık Gelir</Text>
            <Text style={styles.incomeValue}>{incomeDisplay}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Gider */}
        <View style={styles.statItem}>
          <View style={[styles.iconCircle, styles.expenseIconBg]}>
            <Ionicons name="arrow-down" size={16} color="#EF4444" />
          </View>
          <View>
            <Text style={styles.statLabel}>Aylık Gider</Text>
            <Text style={styles.expenseValue}>{expenseDisplay}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A', // Şık koyu lacivert zemin
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  monthBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  monthText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  negativeBalanceText: {
    color: '#F87171',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeIconBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  expenseIconBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  incomeValue: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '700',
  },
  expenseValue: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '700',
  },
});
