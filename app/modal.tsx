import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { addTransaction } from '@/services/transactionService';
import { CategoryId, TransactionType } from '@/types';
import { DEFAULT_CATEGORIES } from '@/utils/constants';

/**
 * Kullanıcının yerel saat dilimine (local time) göre YYYY-MM-DD formatında tarih üretir.
 */
function getLocalDateString(offsetDays = 0): string {
  const date = new Date();
  if (offsetDays !== 0) {
    date.setDate(date.getDate() + offsetDays);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AddTransactionModal() {
  const router = useRouter();
  const db = useSQLiteContext();

  // Form State
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('food');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(() => getLocalDateString(0));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // İşlem türüne göre kategorileri filtrele
  const categories = DEFAULT_CATEGORIES.filter((cat) => {
    if (type === 'income') {
      return cat.id === 'salary' || cat.id === 'other';
    }
    return cat.id !== 'salary';
  });

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      setSelectedCategory('salary');
    } else {
      setSelectedCategory('food');
    }
  };

  const handleAmountChange = (text: string) => {
    // Sadece sayı, virgül ve noktaya izin ver
    const sanitized = text.replace(/,/g, '.').replace(/[^0-9.]/g, '');

    // Birden fazla noktayı engelle
    const parts = sanitized.split('.');
    if (parts.length > 2) return;

    // Kuruş hanesini en fazla 2 basamak ile sınırla
    if (parts[1] && parts[1].length > 2) return;

    setAmountStr(sanitized);
  };

  const handleSave = async () => {
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Geçersiz Tutar', 'Lütfen sıfırdan büyük geçerli bir tutar giriniz.');
      return;
    }

    if (amount > 100000000) {
      Alert.alert('Tutar Sınırı Aşıldı', 'İşlem tutarı 100.000.000 TL tavan sınırını aşamaz.');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Kategori Seçilmedi', 'Lütfen bir kategori belirleyiniz.');
      return;
    }

    const trimmedDate = date.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
      Alert.alert('Geçersiz Tarih', 'Lütfen YYYY-AA-GG formatında geçerli bir tarih giriniz.');
      return;
    }

    const [yearStr, monthStr, dayStr] = trimmedDate.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const testDate = new Date(year, month - 1, day);
    if (
      testDate.getFullYear() !== year ||
      testDate.getMonth() !== month - 1 ||
      testDate.getDate() !== day
    ) {
      Alert.alert('Geçersiz Tarih', 'Lütfen YYYY-AA-GG formatında geçerli bir tarih giriniz.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction(
        {
          amount,
          type,
          categoryId: selectedCategory,
          note: note.trim() || undefined,
          date: trimmedDate,
        },
        db
      );

      // Başarıyla eklendi, modalı kapat
      router.back();
    } catch (error) {
      console.error('İşlem kaydedilemedi:', error);
      Alert.alert('Hata', 'İşlem kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Üst Kapatma Çubuğu */}
        <View style={styles.topBar}>
          <Text style={styles.modalTitle}>İşlem Ekle</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* 1. Gelir / Gider Segmented Control */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.segmentTab,
              type === 'expense' && styles.segmentTabExpenseActive,
            ]}
            onPress={() => handleTypeChange('expense')}
          >
            <Ionicons
              name="arrow-down-circle"
              size={18}
              color={type === 'expense' ? '#EF4444' : '#64748B'}
            />
            <Text
              style={[
                styles.segmentText,
                type === 'expense' && styles.segmentTextExpenseActive,
              ]}
            >
              Gider
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.segmentTab,
              type === 'income' && styles.segmentTabIncomeActive,
            ]}
            onPress={() => handleTypeChange('income')}
          >
            <Ionicons
              name="arrow-up-circle"
              size={18}
              color={type === 'income' ? '#10B981' : '#64748B'}
            />
            <Text
              style={[
                styles.segmentText,
                type === 'income' && styles.segmentTextIncomeActive,
              ]}
            >
              Gelir
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Tutar Girişi (Büyük Fontlu) */}
        <View style={styles.amountInputContainer}>
          <Text
            style={[
              styles.currencyPrefix,
              type === 'income' ? styles.incomeText : styles.expenseText,
            ]}
          >
            ₺
          </Text>
          <TextInput
            style={[
              styles.amountInput,
              type === 'income' ? styles.incomeText : styles.expenseText,
            ]}
            placeholder="0,00"
            placeholderTextColor="#CBD5E1"
            keyboardType="decimal-pad"
            value={amountStr}
            onChangeText={handleAmountChange}
            maxLength={12}
            autoFocus
          />
        </View>

        {/* 3. Kategori Seçimi (Yatay Kaydırılabilir) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Kategori</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  activeOpacity={0.7}
                  style={[
                    styles.categoryChip,
                    isSelected && {
                      borderColor: category.color,
                      backgroundColor: `${category.color}15`,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <View
                    style={[
                      styles.categoryIconCircle,
                      {
                        backgroundColor: isSelected
                          ? category.color
                          : `${category.color}20`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={category.icon}
                      size={18}
                      color={isSelected ? '#FFFFFF' : category.color}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      isSelected && {
                        color: category.color,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Tarih Seçimi */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tarih</Text>
          <View style={styles.dateSelectorRow}>
            <TouchableOpacity
              style={[
                styles.dateQuickButton,
                date === getLocalDateString(0) &&
                  styles.dateQuickButtonActive,
              ]}
              onPress={() => {
                setDate(getLocalDateString(0));
              }}
            >
              <Text
                style={[
                  styles.dateQuickText,
                  date === getLocalDateString(0) &&
                    styles.dateQuickTextActive,
                ]}
              >
                Bugün
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dateQuickButton,
                date === getLocalDateString(-1) &&
                  styles.dateQuickButtonActive,
              ]}
              onPress={() => {
                setDate(getLocalDateString(-1));
              }}
            >
              <Text
                style={[
                  styles.dateQuickText,
                  date === getLocalDateString(-1) &&
                    styles.dateQuickTextActive,
                ]}
              >
                Dün
              </Text>
            </TouchableOpacity>

            <View style={styles.dateInputWrapper}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <TextInput
                style={styles.dateTextInput}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-AA-GG"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        </View>

        {/* 5. Opsiyonel Açıklama / Not */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Not (Opsiyonel)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Örn: Market alışverişi, Yemeksepeti vb."
            placeholderTextColor="#94A3B8"
            value={note}
            onChangeText={setNote}
            maxLength={100}
          />
        </View>

        {/* 6. Kaydet Butonu */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.saveButton,
            type === 'income' ? styles.saveButtonIncome : styles.saveButtonExpense,
            isSubmitting && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {type === 'income' ? 'Geliri Kaydet' : 'Gideri Kaydet'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  segmentTabExpenseActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentTabIncomeActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextExpenseActive: {
    color: '#EF4444',
  },
  segmentTextIncomeActive: {
    color: '#10B981',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  currencyPrefix: {
    fontSize: 34,
    fontWeight: '700',
    marginRight: 6,
  },
  amountInput: {
    fontSize: 42,
    fontWeight: '800',
    minWidth: 140,
    textAlign: 'center',
  },
  expenseText: {
    color: '#EF4444',
  },
  incomeText: {
    color: '#10B981',
  },
  section: {
    marginBottom: 22,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  categoryScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  dateQuickButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  dateQuickButtonActive: {
    backgroundColor: '#2563EB',
  },
  dateQuickText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  dateQuickTextActive: {
    color: '#FFFFFF',
  },
  dateInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  dateTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    padding: 0,
  },
  noteInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  saveButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonExpense: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  saveButtonIncome: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
