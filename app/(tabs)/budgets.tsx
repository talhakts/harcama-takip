import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { CategoryBadge } from '@/components/CategoryBadge';
import { getBudgetLimits, setBudgetLimit } from '@/services/budgetService';
import { BudgetLimit, CategoryId } from '@/types';
import { getCategoryById } from '@/utils/constants';
import { formatCurrency } from '@/utils/formatters';

export default function BudgetsScreen() {
  const db = useSQLiteContext();
  const today = new Date();

  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth() + 1);

  const [budgets, setBudgets] = useState<BudgetLimit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Düzenleme Modalı State
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<CategoryId | null>(null);
  const [newLimitInput, setNewLimitInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadBudgets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getBudgetLimits(year, month, db);
      setBudgets(data);
    } catch (error) {
      console.error('Bütçeler yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db, year, month]);

  useFocusEffect(
    useCallback(() => {
      loadBudgets();
    }, [loadBudgets])
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
  };

  const monthDate = new Date(year, month - 1, 1);
  const monthLabel = new Intl.DateTimeFormat('tr-TR', {
    month: 'long',
    year: 'numeric',
  }).format(monthDate);

  // Toplam Bütçe ve Harcama İstatistikleri
  const totalBudgeted = budgets.reduce((acc, b) => acc + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.currentSpent, 0);

  const openEditModal = (budget: BudgetLimit) => {
    setEditingCategory(budget.categoryId);
    setNewLimitInput(budget.monthlyLimit > 0 ? budget.monthlyLimit.toString() : '');
    setModalVisible(true);
  };

  const handleLimitChange = (text: string) => {
    // Sadece sayı, virgül ve noktaya izin ver
    const sanitized = text.replace(/,/g, '.').replace(/[^0-9.]/g, '');

    // Birden fazla noktayı engelle
    const parts = sanitized.split('.');
    if (parts.length > 2) return;

    // Kuruş hanesini en fazla 2 basamak ile sınırla
    if (parts[1] && parts[1].length > 2) return;

    setNewLimitInput(sanitized);
  };

  const handleSaveLimit = async () => {
    if (!editingCategory) return;

    const parsed = parseFloat(newLimitInput);
    if (isNaN(parsed) || parsed < 0) {
      Alert.alert('Geçersiz Tutar', 'Lütfen geçerli bir bütçe tutarı giriniz.');
      return;
    }

    if (parsed > 100000000) {
      Alert.alert('Tutar Sınırı Aşıldı', 'Bütçe limiti 100.000.000 TL tavan sınırını aşamaz.');
      return;
    }

    setIsSaving(true);
    try {
      await setBudgetLimit(editingCategory, parsed, db);
      setModalVisible(false);
      await loadBudgets();
    } catch (error) {
      console.error('Bütçe güncellenemedi:', error);
      Alert.alert('Hata', 'Bütçe kaydedilirken bir hata meydana geldi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadBudgets} />
        }
      >
        {/* Ay Gezintisi Başlığı */}
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

        {/* Bütçe Genel Durum Kartı */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>GENEL BÜTÇE DURUMU</Text>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Tanımlı Bütçe</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totalBudgeted)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View>
              <Text style={styles.summaryLabel}>Gerçekleşen</Text>
              <Text
                style={[
                  styles.summaryValue,
                  totalBudgeted > 0 && totalSpent > totalBudgeted
                    ? styles.dangerText
                    : styles.normalText,
                ]}
              >
                {formatCurrency(totalSpent)}
              </Text>
            </View>
          </View>
        </View>

        {/* Kategori Bütçe Kartları */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Kategori Limitleri</Text>
          <Text style={styles.listSubtitle}>Limit belirlemek için karta dokunun</Text>
        </View>

        {isLoading && budgets.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          budgets.map((item) => {
            const category = getCategoryById(item.categoryId);
            const hasLimit = item.monthlyLimit > 0;
            // Erken yuvarlama hatasını engelle: harcama bütçeyi aşmamışsa %99'a sabitle, tam eşitlikte %100
            const rawPercentage = hasLimit ? (item.currentSpent / item.monthlyLimit) * 100 : 0;
            const percentage = hasLimit
              ? item.currentSpent < item.monthlyLimit
                ? Math.min(99, Math.round(rawPercentage))
                : Math.round(rawPercentage)
              : 0;

            // Kural:
            // currentSpent > monthlyLimit -> Kırmızı: Limit Aşıldı (%${percentage})
            // currentSpent === monthlyLimit -> Turuncu: %100 Bütçeye Ulaşıldı
            // percentage >= 80 -> Turuncu/Sarı: %${percentage} Dikkat
            // Diğer -> Yeşil: %${percentage}
            let statusColor = '#10B981'; // Yeşil
            let statusBadgeText = `%${percentage}`;
            const isExceeded = hasLimit && item.currentSpent > item.monthlyLimit;

            if (hasLimit) {
              if (item.currentSpent > item.monthlyLimit) {
                statusColor = '#EF4444'; // Kırmızı
                statusBadgeText =
                  percentage > 999
                    ? 'Limit Aşıldı (>%999)'
                    : `Limit Aşıldı (%${percentage})`;
              } else if (item.currentSpent === item.monthlyLimit) {
                statusColor = '#F59E0B'; // Turuncu
                statusBadgeText = '%100 Bütçeye Ulaşıldı';
              } else if (percentage >= 80) {
                statusColor = '#F59E0B'; // Turuncu
                statusBadgeText = `%${percentage} Dikkat`;
              }
            }

            return (
              <TouchableOpacity
                key={item.categoryId}
                activeOpacity={0.8}
                style={[
                  styles.budgetCard,
                  isExceeded && styles.budgetCardExceeded,
                ]}
                onPress={() => openEditModal(item)}
              >
                <View style={styles.cardTopRow}>
                  <CategoryBadge categoryId={item.categoryId} size="medium" />

                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.limitSubtitle}>
                      {hasLimit
                        ? `Aylık Limit: ${formatCurrency(item.monthlyLimit)}`
                        : 'Limit belirlenmedi'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.editIconButton}
                    onPress={() => openEditModal(item)}
                  >
                    <Ionicons name="pencil" size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Harcama ve Limit Bilgisi */}
                <View style={styles.cardMiddleRow}>
                  <Text style={styles.spentText}>
                    Harcanan: {formatCurrency(item.currentSpent)}
                  </Text>
                  {hasLimit && (
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${statusColor}18` },
                      ]}
                    >
                      {isExceeded && (
                        <Ionicons
                          name="alert-circle"
                          size={13}
                          color={statusColor}
                          style={{ marginRight: 3 }}
                        />
                      )}
                      <Text
                        style={[styles.statusBadgeText, { color: statusColor }]}
                      >
                        {statusBadgeText}
                      </Text>
                    </View>
                  )}
                </View>

                {/* İlerleme Çubuğu (Progress Bar) */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: hasLimit
                          ? `${Math.min(100, Math.max(percentage, 3))}%`
                          : '0%',
                        backgroundColor: hasLimit ? statusColor : '#CBD5E1',
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Bütçe Limiti Düzenleme Modalı */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bütçe Limiti Belirle</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {editingCategory && (
              <View style={styles.modalCategoryRow}>
                <CategoryBadge categoryId={editingCategory} size="small" />
                <Text style={styles.modalCategoryName}>
                  {getCategoryById(editingCategory).name}
                </Text>
              </View>
            )}

            <Text style={styles.modalInputLabel}>Aylık Bütçe Tavanı (TL)</Text>
            <View style={styles.modalInputWrapper}>
              <Text style={styles.modalCurrencySymbol}>₺</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Örn: 4000"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                value={newLimitInput}
                onChangeText={handleLimitChange}
                maxLength={12}
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveLimit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
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
  summaryCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 2,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  normalText: {
    color: '#34D399',
  },
  dangerText: {
    color: '#F87171',
  },
  listHeader: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  listSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  budgetCardExceeded: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  limitSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  editIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  spentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalDialog: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalCategoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  modalCurrencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563EB',
    marginRight: 6,
  },
  modalInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    padding: 0,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
