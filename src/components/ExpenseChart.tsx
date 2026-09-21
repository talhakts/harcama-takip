import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { MonthlyCategoryBreakdown } from '@/services/transactionService';
import { getCategoryById } from '@/utils/constants';
import { formatCurrency } from '@/utils/formatters';

interface ExpenseChartProps {
  data: MonthlyCategoryBreakdown[];
  totalExpense: number;
}

export function ExpenseChart({ data, totalExpense }: ExpenseChartProps) {
  if (data.length === 0 || totalExpense === 0) {
    return null;
  }

  // Gifted-charts pie data
  const pieData = data.map((item) => {
    const category = getCategoryById(item.categoryId);
    return {
      value: item.total,
      color: category.color,
      text: item.percentage >= 10 ? `%${item.percentage}` : '',
      textColor: '#FFFFFF',
      textSize: 11,
      fontWeight: 'bold' as const,
    };
  });

  return (
    <View style={styles.container}>
      <PieChart
        donut
        data={pieData}
        radius={110}
        innerRadius={70}
        innerCircleColor="#FFFFFF"
        showText={false}
        centerLabelComponent={() => (
          <View style={styles.centerLabel}>
            <Text style={styles.centerTitle}>Toplam Gider</Text>
            <Text style={styles.centerAmount} numberOfLines={1}>
              {formatCurrency(totalExpense)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  centerTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  centerAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
});
