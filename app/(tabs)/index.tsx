import React, { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SummaryCard } from '@/components/SummaryCard';
import { TransactionItem } from '@/components/TransactionItem';
import { useTransactions } from '@/hooks/useTransactions';

export default function DashboardScreen() {
  const router = useRouter();
  const {
    transactions,
    monthlySummary,
    isLoading,
    refresh,
    removeTransaction,
    selectedYear,
    selectedMonth,
  } = useTransactions();

  // İlk açılışta useTransactions içindeki useEffect zaten veri çektiği için
  // useFocusEffect'in ilk montajda çift sorgu atmasını engelle
  const isFirstMountRef = useRef(true);

  // Ekran her odaklandığında (örneğin modal kapandığında) verileri tazele
  useFocusEffect(
    useCallback(() => {
      if (isFirstMountRef.current) {
        isFirstMountRef.current = false;
        return;
      }
      refresh();
    }, [refresh])
  );

  // Türkçe ay adı (örn: "Eylül 2026")
  const currentMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
  const monthName = new Intl.DateTimeFormat('tr-TR', {
    month: 'long',
    year: 'numeric',
  }).format(currentMonthDate);

  // Son 10 işlem
  const recentTransactions = transactions.slice(0, 10);

  return (
    <View style={styles.container}>
      <FlatList
        data={recentTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onDelete={removeTransaction}
          />
        )}
        ListHeaderComponent={
          <View>
            {/* Özet Kartı */}
            <SummaryCard
              netBalance={monthlySummary?.netBalance ?? 0}
              totalIncome={monthlySummary?.totalIncome ?? 0}
              totalExpense={monthlySummary?.totalExpense ?? 0}
              monthName={monthName}
            />

            {/* Bölüm Başlığı */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Son İşlemler</Text>
              {transactions.length > 0 && (
                <Text style={styles.sectionBadge}>
                  {transactions.length} işlem
                </Text>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="receipt-outline" size={40} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>Henüz işlem kaydedilmedi</Text>
              <Text style={styles.emptySubtitle}>
                Aşağıdaki + butonuna dokunarak ilk gelir veya giderinizi ekleyin.
              </Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
      />

      {/* Floating Action Button (FAB - İşlem Ekle Modalı) */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.fab}
        onPress={() => router.push('/modal')}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingBottom: 90,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 50,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
