import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import {
  CATEGORY_TO_SLOT,
  CosmeticSlot,
  applyMoodDelta,
  resolveAnchor,
} from '../../constants/cosmeticSlots';
import { getShopItemById, ShopItem } from '../../constants/shopItems';
import { getEquippedItems } from '../../services/shopService';
import type { ChesterState } from '../../types';

interface Props {
  /** Diameter of the Chester container. Cosmetics scale relative to this. */
  containerSize: number;
  /** Current mood — used to nudge cosmetic anchor positions per pose. */
  mood: ChesterState['mood'];
  /** Optional virtual cosmetics injected by the parent (e.g. stage rewards). */
  virtual?: VirtualCosmetic[];
  /** Override font size for emoji fallbacks (defaults derived from container). */
  emojiScale?: number;
}

export interface VirtualCosmetic {
  id: string;
  slot: CosmeticSlot;
  emoji?: string;
  image?: ShopItem['image'];
}

/**
 * Renders all currently-equipped cosmetics on top of Chester. Each layer is
 * positioned via percentage-based anchors so the system scales to any avatar
 * size (small/medium/large). Items with a PNG `image` render as an actual
 * picture; legacy emoji-only items render as a styled <Text> emoji.
 */
export default function ChesterCosmeticOverlay({
  containerSize,
  mood,
  virtual = [],
  emojiScale,
}: Props) {
  const [equipped, setEquipped] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    getEquippedItems()
      .then(map => { if (!cancelled) setEquipped(map); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const layers: RenderLayer[] = [];

  // Equipped items from the shop
  for (const itemId of Object.values(equipped)) {
    const item = getShopItemById(itemId);
    if (!item) continue;
    const slot = item.slot ?? CATEGORY_TO_SLOT[item.category];
    if (!slot) continue;
    layers.push({
      key: item.id,
      slot,
      emoji: item.icon,
      image: item.image,
      slotOffset: item.slotOffset,
    });
  }

  // Virtual cosmetics injected by parent
  for (const v of virtual) {
    layers.push({
      key: v.id,
      slot: v.slot,
      emoji: v.emoji,
      image: v.image,
    });
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {layers.map(layer => (
        <CosmeticLayer
          key={layer.key}
          layer={layer}
          containerSize={containerSize}
          mood={mood}
          emojiScale={emojiScale}
        />
      ))}
    </View>
  );
}

interface RenderLayer {
  key: string;
  slot: CosmeticSlot;
  emoji?: string;
  image?: ShopItem['image'];
  slotOffset?: ShopItem['slotOffset'];
}

function CosmeticLayer({
  layer,
  containerSize,
  mood,
  emojiScale,
}: {
  layer: RenderLayer;
  containerSize: number;
  mood: ChesterState['mood'];
  emojiScale?: number;
}) {
  const base = resolveAnchor(layer.slot, layer.slotOffset);
  const anchor = applyMoodDelta(base, layer.slot, mood);

  const widthPx = containerSize * anchor.width;
  const heightPx = widthPx; // square bounding box; image keeps its own aspect via resizeMode
  const leftPx = containerSize * anchor.cx - widthPx / 2;
  const topPx  = containerSize * anchor.cy - heightPx / 2;

  const style = {
    position: 'absolute' as const,
    left: leftPx,
    top: topPx,
    width: widthPx,
    height: heightPx,
    transform: [{ rotate: `${anchor.rotate}deg` }],
    zIndex: anchor.zIndex,
  };

  if (layer.image) {
    return (
      <Image
        source={layer.image}
        style={style}
        resizeMode="contain"
      />
    );
  }

  // Emoji fallback — sized so it fills most of the slot bounding box
  const fontSize = (emojiScale ?? 1) * widthPx * 0.85;
  return (
    <View style={[style, styles.emojiWrapper]}>
      <Text style={[styles.emoji, { fontSize }]}>{layer.emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emojiWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
});
