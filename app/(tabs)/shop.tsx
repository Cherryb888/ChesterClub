import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import ScreenHeader from '../../components/ui/ScreenHeader';
import { SHOP_ITEMS, ShopItem, ShopCategory } from '../../constants/shopItems';
import { getProfile } from '../../services/storage';
import {
  getOwnedItems, getEquippedItems, purchaseItem, equipItem, unequipCategory,
} from '../../services/shopService';

const CATEGORY_LABELS: Record<ShopCategory, { label: string; icon: string }> = {
  hat: { label: 'Hats', icon: '🎩' },
  accessory: { label: 'Accessories', icon: '✨' },
  background: { label: 'Backgrounds', icon: '🖼️' },
  title: { label: 'Titles', icon: '📛' },
  consumable: { label: 'Items', icon: '🛡️' },
};

export default function ShopScreen() {

  const [coins, setCoins] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [owned, setOwned] = useState<string[]>([]);
  const [equipped, setEquipped] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('hat');

  const loadData = useCallback(async () => {
    const profile = await getProfile();
    setCoins(profile.chester.coins);
    setIsPremium(profile.isPremiumMax);
    setOwned(await getOwnedItems());
    setEquipped(await getEquippedItems());
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handlePurchase = async (item: ShopItem) => {
    // Consumables are always purchasable (not owned/equipped)
    if (item.category === 'consumable') {
      Alert.alert(
        `Buy ${item.name}?`,
        `${item.description}\n\nCost: ${item.price} coins. You have ${coins} coins.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Buy (${item.price} 🪙)`,
            onPress: async () => {
              const result = await purchaseItem(item.id);
              if (result.success) {
                Alert.alert('Activated!', `${item.name} is now active! 🛡️`);
                await loadData();
              } else {
                Alert.alert('Cannot Purchase', result.error || 'Something went wrong.');
              }
            },
          },
        ]
      );
      return;
    }

    if (owned.includes(item.id)) {
      // Already owned — equip/unequip
      if (equipped[item.category] === item.id) {
        await unequipCategory(item.category);
      } else {
        await equipItem(item.id);
      }
      await loadData();
      return;
    }

    // Confirm purchase
    Alert.alert(
      `Buy ${item.name}?`,
      `This will cost ${item.price} coins. You have ${coins} coins.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Buy (${item.price} 🪙)`,
          onPress: async () => {
            const result = await purchaseItem(item.id);
            if (result.success) {
              // Auto-equip after purchase
              await equipItem(item.id);
              Alert.alert('Purchased!', `${item.name} is now equipped on Chester!`);
              await loadData();
            } else {
              Alert.alert('Cannot Purchase', result.error || 'Something went wrong.');
            }
          },
        },
      ]
    );
  };

  const categoryItems = SHOP_ITEMS.filter(i => i.category === activeCategory);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ScreenHeader
        title="Chester's Shop"
        rightElement={
          <View style={styles.coinsBadge} accessibilityLabel={`${coins} coins available`}>
            <Text style={styles.coinsIcon}>🪙</Text>
            <Text style={styles.coinsText}>{coins}</Text>
          </View>
        }
      />

      {/* Category Tabs */}
      <View style={styles.categoryTabs}>
        {(Object.keys(CATEGORY_LABELS) as ShopCategory[]).map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
            onPress={() => setActiveCategory(cat)}
            accessibilityRole="button"
            accessibilityLabel={`${CATEGORY_LABELS[cat].label} category`}
            accessibilityState={{ selected: activeCategory === cat }}
          >
            <Text style={styles.categoryIcon}>{CATEGORY_LABELS[cat].icon}</Text>
            <Text style={[styles.categoryLabel, activeCategory === cat && styles.categoryLabelActive]}>
              {CATEGORY_LABELS[cat].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Items Grid */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {categoryItems.map(item => {
            const isConsumable = item.category === 'consumable';
            const isOwned = !isConsumable && owned.includes(item.id);
            const isEquipped = !isConsumable && equipped[item.category] === item.id;
            const canAfford = coins >= item.price;
            const needsPremium = item.premium && !isPremium;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  isEquipped && styles.itemCardEquipped,
                  needsPremium && styles.itemCardLocked,
                ]}
                onPress={() => handlePurchase(item)}
                disabled={needsPremium}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}, ${isEquipped ? 'equipped' : isOwned ? 'owned, tap to equip' : `${item.price} coins`}${needsPremium ? ', premium required' : ''}`}
                accessibilityState={{ disabled: needsPremium, selected: isEquipped }}
              >
                {/* Equipped badge */}
                {isEquipped && (
                  <View style={styles.equippedBadge}>
                    <Text style={styles.equippedText}>Equipped</Text>
                  </View>
                )}

                {/* Premium lock */}
                {needsPremium && (
                  <View style={styles.premiumLock}>
                    <Text style={styles.premiumLockText}>👑 Premium</Text>
                  </View>
                )}

                {/* Item icon */}
                <View style={[styles.itemIcon, isOwned && styles.itemIconOwned]}>
                  <Text style={styles.itemEmoji}>{item.icon}</Text>
                </View>

                {/* Name */}
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>

                {/* Price or Owned */}
                {isOwned ? (
                  <Text style={styles.ownedText}>
                    {isEquipped ? 'Tap to remove' : 'Tap to equip'}
                  </Text>
                ) : (
                  <View style={[styles.priceRow, !canAfford && styles.priceRowDisabled]}>
                    <Text style={styles.priceIcon}>🪙</Text>
                    <Text style={[styles.priceText, !canAfford && styles.priceTextDisabled]}>
                      {item.price}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info text */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle} accessibilityRole="header">How it works</Text>
          <Text style={styles.infoText}>
            Earn coins from challenges and achievements, then spend them here to customize Chester!
            Equipped items show on Chester's avatar throughout the app.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  coinsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFD700' + '20', paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs, borderRadius: BorderRadius.full,
  },
  coinsIcon: { fontSize: 16 },
  coinsText: { fontSize: FontSize.md, fontWeight: '800', color: '#B8860B' },

  // Category tabs
  categoryTabs: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.xs, marginBottom: Spacing.md,
  },
  categoryTab: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  categoryTabActive: {
    backgroundColor: Colors.primary, borderColor: Colors.primary,
  },
  categoryIcon: { fontSize: 18, marginBottom: 2 },
  categoryLabel: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
  categoryLabelActive: { color: '#fff' },

  scroll: { padding: Spacing.lg, paddingTop: 0, paddingBottom: 100 },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  itemCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  itemCardEquipped: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  itemCardLocked: {
    opacity: 0.5,
  },

  equippedBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: Colors.primary, paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: BorderRadius.full,
  },
  equippedText: { fontSize: 9, fontWeight: '700', color: '#fff' },

  premiumLock: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: '#FFD700' + '30', paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: BorderRadius.full,
  },
  premiumLockText: { fontSize: 9, fontWeight: '700', color: '#B8860B' },

  itemIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  itemIconOwned: {
    backgroundColor: Colors.primary + '15',
  },
  itemEmoji: { fontSize: 28 },
  itemName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text, marginBottom: 4, textAlign: 'center' },

  ownedText: { fontSize: 10, color: Colors.primary, fontWeight: '600' },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  priceRowDisabled: { opacity: 0.5 },
  priceIcon: { fontSize: 12 },
  priceText: { fontSize: FontSize.sm, fontWeight: '700', color: '#B8860B' },
  priceTextDisabled: { color: Colors.textLight },

  // Info
  infoCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginTop: Spacing.lg,
  },
  infoTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
  infoText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
