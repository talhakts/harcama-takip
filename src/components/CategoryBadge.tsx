import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryId } from '@/types';
import { getCategoryById } from '@/utils/constants';

interface CategoryBadgeProps {
  categoryId: CategoryId;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function CategoryBadge({
  categoryId,
  showLabel = false,
  size = 'medium',
}: CategoryBadgeProps) {
  const category = getCategoryById(categoryId);

  const iconSizes = {
    small: 14,
    medium: 18,
    large: 24,
  };

  const badgeSizes = {
    small: 28,
    medium: 40,
    large: 52,
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          {
            width: badgeSizes[size],
            height: badgeSizes[size],
            borderRadius: badgeSizes[size] / 2,
            backgroundColor: `${category.color}18`, // %10-15 opaklıkta renk arka planı
          },
        ]}
      >
        <Ionicons
          name={category.icon}
          size={iconSizes[size]}
          color={category.color}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: '#334155' }]}>
          {category.name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});
