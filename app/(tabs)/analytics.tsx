import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CategoryBadge } from '@/components/CategoryBadge';
import { ExpenseChart } from '@/components/ExpenseChart';
import { useTransactions } from '@/hooks/useTransactions';
import { getCategoryById } from '@/utils/constants';
import { formatCurrency } from '@/utils/formatters';

export default function AnalyticsScreen() {
  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth() + 1);

  const { monthlySummary, isLoading, refresh, changeMonth } = useTransactions(
    year,
    month
  );

  // Ekran her odaklandığında güncelle
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setYear(newYear);
    setMonth(newMonth);
    changeMonth(newYear, newMonth);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setYear(newYear);
    setMonth(newMonth);
    changeMonth(newYear, newMonth);
  };

  // Seçili ayın Türkçe başlığı
  const monthDate = new Date(year, month - 1, 1);
  const monthLabel = new Intl.DateTimeFormat('tr-TR', {
    month: 'long',
    year: 'numeric',
  }).format(monthDate);

  const categoryBreakdown = monthlySummary?.categoryBreakdown ?? [];
  const totalExpense = monthlySummary?.totalExpense ?? 0;
  const hasExpenses = totalExpense > 0 && categoryBreakdown.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refresh} />
      }
    >
      {/* Ay Değiştirme Başlığı */}
      <View style={styles.monthSelector}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.monthButton}
          onPress={handlePrevMonth}
        >
          <Ionicons name="chevron-back" size={20} color="#334155" />
        </TouchableOpacity>

        <View style={styles.monthTitleWrapper}>
          <Ionicons name="calendar" size={16} color="#2563EB" />
          <Text style={styles.monthTitleText}>{monthLabel}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.monthButton}
          onPress={handleNextMonth}
        >
          <Ionicons name="chevron-forward" size={20} color="#334155" />
        </TouchableOpacity>
      </View>

      {/* Yükleniyor Durumu */}
      {isLoading && !monthlySummary ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : hasExpenses ? (
        <View>
          {/* Donut Grafik Kartı */}
          <ExpenseChart
            data={categoryBreakdown}
            totalExpense={totalExpense}
          />

          {/* Kategori Dağılımı (Legend & Detaylar) */}
          <View style={styles.legendContainer}>
            <View style={styles.legendHeader}>
              <Text style={styles.legendTitle}>Kategori Dağılımı</Text>
              <Text style={styles.legendSubtitle}>
                {categoryBreakdown.length} kategori
              </Text>
            </View>

            {categoryBreakdown.map((item) => {
              const category = getCategoryById(item.categoryId);
              return (
                <View key={item.categoryId} style={styles.legendItem}>
                  <CategoryBadge categoryId={item.categoryId} size="medium" />

                  <View style={styles.legendItemBody}>
                    <View style={styles.legendItemTopRow}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.categoryAmount}>
                        {formatCurrency(item.total)}
                      </Text>
                    </View>

                    {/* Yüzdelik İlerleme Çubuğu */}
                    <View style={styles.progressBarBackground}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min(100, Math.max(item.percentage, 4))}%`,
                            backgroundColor: category.color,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View
                    style={[
                      styles.percentageBadge,
                      { backgroundColor: `${category.color}15` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.percentageText,
                        { color: category.color },
                      ]}
                    >
                      %{item.percentage}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        /* Boş Durum (Empty State) */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="pie-chart-outline" size={48} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Harcama Kaydı Yok</Text>
          <Text style={styles.emptySubtitle}>
            {monthLabel} dönemine ait herhangi bir gider kaydı bulunmuyor.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingBottom: 40,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  legendSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 12,
  },
  legendItemBody: {
    flex: 1,
  },
  legendItemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  percentageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 70,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
