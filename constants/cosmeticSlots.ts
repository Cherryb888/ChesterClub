// ─── Cosmetic Slots ───
//
// Defines where each cosmetic category attaches to Chester. Coordinates are
// expressed as a percentage of the Chester container (0..1) so the system
// scales with any avatar size. Items can override defaults via `slotOffset`.
//
// Anchor model: x/y is the top-left of the cosmetic image relative to the
// container; width is the cosmetic's width as a fraction of the container.
// Height is computed from the source image's aspect ratio at render time.

import type { ChesterState } from '../types';

export type CosmeticSlot = 'hat' | 'face' | 'neck' | 'back' | 'foreground';

export interface SlotAnchor {
  /** Horizontal centre of the cosmetic, 0 = left edge, 1 = right edge */
  cx: number;
  /** Vertical centre of the cosmetic, 0 = top edge, 1 = bottom edge */
  cy: number;
  /** Width of the cosmetic as a fraction of the container width */
  width: number;
  /** Rotation in degrees */
  rotate: number;
  /** Stack order — higher renders above lower. Body is implicitly 0. */
  zIndex: number;
}

export interface SlotOffset {
  cx?: number;
  cy?: number;
  width?: number;
  rotate?: number;
}

/**
 * Default anchor positions, tuned against the existing Chester artwork
 * (head occupies the upper third, body the middle, paws the lower third).
 * Items can fine-tune via `slotOffset` on the ShopItem.
 */
export const SLOT_DEFAULTS: Record<CosmeticSlot, SlotAnchor> = {
  // Sits on top of head
  hat:        { cx: 0.50, cy: 0.10, width: 0.55, rotate: 0, zIndex: 30 },
  // Eyes / muzzle area
  face:       { cx: 0.50, cy: 0.32, width: 0.42, rotate: 0, zIndex: 20 },
  // Collar / chest
  neck:       { cx: 0.50, cy: 0.62, width: 0.40, rotate: 0, zIndex: 15 },
  // Behind body — capes, wings, banners
  back:       { cx: 0.50, cy: 0.55, width: 0.85, rotate: 0, zIndex: -1 },
  // In-front decorations — bones, snacks, scene props at Chester's feet
  foreground: { cx: 0.50, cy: 0.92, width: 0.45, rotate: 0, zIndex: 25 },
};

/**
 * Resolve a slot's final anchor by merging the slot default with an item's
 * optional offset. Offsets are absolute overrides, not deltas, when provided.
 */
export function resolveAnchor(slot: CosmeticSlot, offset?: SlotOffset): SlotAnchor {
  const base = SLOT_DEFAULTS[slot];
  if (!offset) return base;
  return {
    cx:     offset.cx     ?? base.cx,
    cy:     offset.cy     ?? base.cy,
    width:  offset.width  ?? base.width,
    rotate: offset.rotate ?? base.rotate,
    zIndex: base.zIndex,
  };
}

/**
 * Per-mood anchor adjustments — used so cosmetics follow Chester when his
 * pose changes (e.g. hat slips slightly when sleeping, tilts when bending).
 * Values are deltas applied on top of the resolved anchor.
 */
export const MOOD_SLOT_DELTA: Partial<Record<ChesterState['mood'], Partial<Record<CosmeticSlot, SlotOffset>>>> = {
  sleepy: {
    hat:  { cy: 0.14, rotate: -8 },
    face: { cy: 0.36 },
  },
  sad: {
    hat:  { rotate: -4, cy: 0.12 },
  },
  excited: {
    hat:  { cy: 0.07 },
  },
  hungry: {
    hat:  { rotate: 3 },
  },
};

export function applyMoodDelta(anchor: SlotAnchor, slot: CosmeticSlot, mood: ChesterState['mood']): SlotAnchor {
  const delta = MOOD_SLOT_DELTA[mood]?.[slot];
  if (!delta) return anchor;
  return {
    cx:     anchor.cx     + (delta.cx     ?? 0),
    cy:     anchor.cy     + (delta.cy     ?? 0),
    width:  anchor.width  + (delta.width  ?? 0),
    rotate: anchor.rotate + (delta.rotate ?? 0),
    zIndex: anchor.zIndex,
  };
}

/** Map a shop category to its target slot. */
export const CATEGORY_TO_SLOT: Record<string, CosmeticSlot | null> = {
  hat:       'hat',
  accessory: 'neck',  // bowtie/scarf/medal — most current accessories sit at neck
  background: null,   // backgrounds render as scene, not as a slot overlay
  title:      null,   // titles are text-only
  consumable: null,
  dig_exclusive: 'neck', // by default; specific items can override via item.slot
};
