import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import {
  COIN_PACKS,
  CoinPack,
  CoinPackId,
  fetchCoinPackProducts,
  isIAPAvailable,
  purchaseCoinPack,
  setupPurchaseListeners,
} from '../../services/iapService';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called after a successful coin pack purchase so the parent can refresh balance. */
  onPurchased?: (coinsAdded: number) => void;
}

/**
 * Bottom sheet–style modal that lists the three coin packs and lets the user
 * tap to purchase. Wires its own purchase listeners for the modal lifetime,
 * so the shop screen doesn't have to know about IAP plumbing.
 */
export default function CoinPackSheet({ visible, onClose, onPurchased }: Props) {
  const [storePrices, setStorePrices] = useState<Record<string, string>>({});
  const [purchasingId, setPurchasingId] = useState<CoinPackId | null>(null);

  useEffect(() => {
    if (!visible) return;

    let mounted = true;

    (async () => {
      const products = await fetchCoinPackProducts();
      if (!mounted) return;
      const prices: Record<string, string> = {};
      for (const product of products) {
        const localized = (product as any).localizedPrice;
        if (localized) prices[product.productId] = localized;
      }
      setStorePrices(prices);
    })().catch(() => {});

    const cleanup = setupPurchaseListeners(
      (result) => {
        setPurchasingId(null);
        if (result.kind === 'coin_pack' && result.coinsAdded) {
          onPurchased?.(result.coinsAdded);
          onClose();
        }
      },
      (message) => {
        setPurchasingId(null);
        Alert.alert('Purchase failed', message);
      },
    );

    return () => {
      mounted = false;
      cleanup();
    };
  }, [visible, onClose, onPurchased]);

  const priceFor = (pack: CoinPack) => storePrices[pack.sku] ?? pack.fallbackPrice;

  const handlePurchase = async (pack: CoinPack) => {
    if (!isIAPAvailable()) {
      Alert.alert(
        'Store unavailable',
        'The app store is not reachable right now. Please check your connection and try again.',
      );
      return;
    }
    setPurchasingId(pack.id);
    try {
      await purchaseCoinPack(pack.id);
      // Result arrives via purchaseUpdatedListener
    } catch (err: any) {
      setPurchasingId(null);
      if (err?.code !== 'E_USER_CANCELLED') {
        Alert.alert('Purchase failed', err?.message ?? 'Something went wrong. Please try again.');
      }
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title} accessibilityRole="header">Get more coins</Text>
          <Text style={styles.subtitle}>
            Coins unlock cosmetics for Chester. Earn them daily, or grab a pack.
          </Text>

          {COIN_PACKS.map(pack => {
            const isThisPurchasing = purchasingId === pack.id;
            const isAnyPurchasing = purchasingId !== null;
            return (
              <TouchableOpacity
                key={pack.id}
                style={[
                  styles.packRow,
                  pack.badge && styles.packRowFeatured,
                  isAnyPurchasing && !isThisPurchasing && styles.packRowDimmed,
                ]}
                onPress={() => handlePurchase(pack)}
                disabled={isAnyPurchasing}
                accessibilityRole="button"
                accessibilityLabel={`${pack.coins} coins for ${priceFor(pack)}${pack.badge ? `, ${pack.badge}` : ''}`}
              >
                {pack.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pack.badge}</Text>
                  </View>
                )}
                <View style={styles.packLeft}>
                  <Text style={styles.coinsAmount}>🪙 {pack.coins.toLocaleString()}</Text>
                  <Text style={styles.coinsLabel}>coins</Text>
                </View>
                <View style={styles.packRight}>
                  {isThisPurchasing ? (
                    <ActivityIndicator color={Colors.primary} />
                  ) : (
                    <Text style={styles.priceText}>{priceFor(pack)}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          <Text style={styles.legal}>
            One-time purchase. Coins are credited to your account immediately.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl + Spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  packRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  packRowFeatured: {
    borderColor: '#FFD700',
    backgroundColor: '#FFF8E1',
  },
  packRowDimmed: {
    opacity: 0.4,
  },
  packLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  packRight: { minWidth: 80, alignItems: 'flex-end' },
  coinsAmount: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  coinsLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  priceText: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: '#FFD700',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#5D4200',
  },
  legal: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
