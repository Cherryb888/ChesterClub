import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import {
  getProfile, getShopState, purchaseItem, equipItem, unequipItem,
  SHOP_ITEMS, getShopItem,
} from '../../services/storage';
import { ChesterState, ShopItem, ShopState, ShopItemCategory } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RARITY_COLORS: Record<string, string> = {
  common: '#9E9E9E',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FFD700',
};

const CATEGORY_LABELS: Record<ShopItemCategory, { label: string; icon: string }> = {
  outfit: { label: 'Outfits', icon: 'shirt' },
  accessory: { label: 'Accessories', icon: 'glasses' },
  treat: { label: 'Treats', icon: 'heart' },
  boost: { label: 'Boosts', icon: 'flash' },
};

export default function ShopScreen() {
  const [chester, setChester] = useState<ChesterState | null>(null);
  const [shop, setShop] = useState<ShopState | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ShopItemCategory>('outfit');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const profile = await getProfile();
    setChester(profile.chester);
    const shopState = await getShopState();
    setShop(shopState);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePurchase = async (item: ShopItem) => {
    if (item.category === 'treat' || item.category === 'boost') {
      Alert.alert(
        `Buy ${item.name}?`,
        `${item.description}\n\nCost: ${item.price} coins`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy', onPress: async () => {
            const result = await purchaseItem(item.id);
            Alert.alert(result.success ? 'Purchased!' : 'Oops!', result.message);
            await loadData();
          }},
        ]
      );
    } else {
      const result = await purchaseItem(item.id);
      if (result.success) {
        Alert.alert('Purchased!', `${result.message} Would you like to equip it?`, [
          { text: 'Later', style: 'cancel' },
          { text: 'Equip', onPress: async () => {
            await equipItem(item.id);
            await loadData();
          }},
        ]);
      } else {
        Alert.alert('Oops!', result.message);
      }
    }
  };

  const handleEquip = async (item: ShopItem) => {
    const isEquipped = item.category === 'outfit'
      ? shop?.equippedOutfit === item.id
      : shop?.equippedAccessory === item.id;

    if (isEquipped) {
      await unequipItem(item.category as 'outfit' | 'accessory');
    } else {
      await equipItem(item.id);
    }
    await loadData();
  };

  if (!chester || !shop) return null;

  const filteredItems = SHOP_ITEMS.filter(i => i.category === selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.header}>Chester's Shop</Text>
          <View style={styles.coinsBadge}>
            <Text style={styles.coinsIcon}>🪙</Text>
            <Text style={styles.coinsText}>{chester.coins}</Text>
          </View>
        </View>

        {/* Chester Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Chester's Look</Text>
          <View style={styles.previewRow}>
            <View style={styles.previewCircle}>
              <Text style={styles.previewEmoji}>🐕</Text>
              {shop.equippedOutfit && (
                <Text style={styles.previewOutfit}>{getShopItem(shop.equippedOutfit)?.emoji}</Text>
              )}
              {shop.equippedAccessory && (
                <Text style={styles.previewAccessory}>{getShopItem(shop.equippedAccessory)?.emoji}</Text>
              )}
            </View>
            <View style={styles.previewInfo}>
              <Text style={styles.previewInfoText}>
                Outfit: {shop.equippedOutfit ? getShopItem(shop.equippedOutfit)?.name : 'None'}
              </Text>
              <Text style={styles.previewInfoText}>
                Accessory: {shop.equippedAccessory ? getShopItem(shop.equippedAccessory)?.name : 'None'}
              </Text>
              <Text style={styles.previewInfoText}>
                Owned: {shop.ownedItems.length} items
              </Text>
              {shop.activeBoosts.length > 0 && (
                <Text style={[styles.previewInfoText, { color: Colors.primary }]}>
                  Active boosts: {shop.activeBoosts.length}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Category Tabs */}
        <View style={styles.categoryTabs}>
          {(Object.keys(CATEGORY_LABELS) as ShopItemCategory[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryTab, selectedCategory === cat && styles.categoryTabActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Ionicons
                name={CATEGORY_LABELS[cat].icon as any}
                size={16}
                color={selectedCategory === cat ? '#fff' : Colors.textSecondary}
              />
              <Text style={[styles.categoryTabText, selectedCategory === cat && styles.categoryTabTextActive]}>
                {CATEGORY_LABELS[cat].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Items Grid */}
        <View style={styles.itemsGrid}>
          {filteredItems.map((item) => {
            const owned = shop.ownedItems.some(o => o.itemId === item.id);
            const isEquipped = (item.category === 'outfit' && shop.equippedOutfit === item.id)
              || (item.category === 'accessory' && shop.equippedAccessory === item.id);
            const canAfford = chester.coins >= item.price;
            const isConsumable = item.category === 'treat' || item.category === 'boost';

            return (
              <View key={item.id} style={[styles.itemCard, isEquipped && styles.itemCardEquipped]}>
                {/* Rarity indicator */}
                <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLORS[item.rarity] }]}>
                  <Text style={styles.rarityText}>{item.rarity}</Text>
                </View>

                <Text style={styles.itemIcon}>{item.icon}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>

                {item.effect && (
                  <Text style={styles.itemEffect}>
                    {item.effect.type === 'health_boost' ? `+${item.effect.value} HP` :
                     item.effect.type === 'xp_boost' ? `${item.effect.value}x XP (${item.effect.duration}h)` :
                     item.effect.type === 'coin_boost' ? `${item.effect.value}x Coins (${item.effect.duration}h)` :
                     'Mood boost'}
                  </Text>
                )}

                {owned && !isConsumable ? (
                  <TouchableOpacity
                    style={[styles.equipBtn, isEquipped && styles.unequipBtn]}
                    onPress={() => handleEquip(item)}
                  >
                    <Text style={[styles.equipBtnText, isEquipped && styles.unequipBtnText]}>
                      {isEquipped ? 'Unequip' : 'Equip'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
                    onPress={() => handlePurchase(item)}
                    disabled={!canAfford && !isConsumable}
                  >
                    <Text style={styles.buyBtnText}>🪙 {item.price}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  header: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.primary },
  coinsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFD700' + '20', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  coinsIcon: { fontSize: 18 },
  coinsText: { fontSize: FontSize.lg, fontWeight: '800', color: '#B8860B' },

  // Preview
  previewCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  previewLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.sm },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  previewCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF3E0',
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: Colors.primary,
  },
  previewEmoji: { fontSize: 36 },
  previewOutfit: { position: 'absolute', bottom: -4, right: -4, fontSize: 20 },
  previewAccessory: { position: 'absolute', top: -4, right: -4, fontSize: 20 },
  previewInfo: { flex: 1 },
  previewInfoText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 2 },

  // Category tabs
  categoryTabs: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  categoryTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.surface,
  },
  categoryTabActive: { backgroundColor: Colors.primary },
  categoryTabText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  categoryTabTextActive: { color: '#fff' },

  // Items grid
  itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  itemCard: {
    width: CARD_WIDTH, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  itemCardEquipped: { borderWidth: 2, borderColor: Colors.primary },
  rarityBadge: { position: 'absolute', top: Spacing.xs, right: Spacing.xs, paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full },
  rarityText: { fontSize: 9, fontWeight: '700', color: '#fff', textTransform: 'capitalize' },
  itemIcon: { fontSize: 36, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  itemName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  itemDesc: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', marginTop: 2, minHeight: 28 },
  itemEffect: { fontSize: 10, fontWeight: '700', color: Colors.primary, marginTop: 4 },
  buyBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 6,
    paddingHorizontal: Spacing.md, marginTop: Spacing.sm,
  },
  buyBtnDisabled: { backgroundColor: Colors.textLight, opacity: 0.5 },
  buyBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  equipBtn: {
    backgroundColor: Colors.secondary, borderRadius: BorderRadius.md, paddingVertical: 6,
    paddingHorizontal: Spacing.md, marginTop: Spacing.sm,
  },
  unequipBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.textLight },
  equipBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  unequipBtnText: { color: Colors.textSecondary },
});
