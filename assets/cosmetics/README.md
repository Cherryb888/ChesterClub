# Chester Cosmetic Assets

Drop Midjourney-generated cosmetic PNGs here. Each file is wired into the
shop via the `image` field on its corresponding entry in
`constants/shopItems.ts`.

## File spec

- **Format**: PNG with transparent background (RGBA)
- **Canvas**: 1024 x 1024 square
- **Subject**: centred horizontally; vertical anchor depends on slot (see below)
- **Margin**: leave ~8% transparent padding on every side so rotation does not clip
- **Style**: must match the Chester art style (warm, soft, slightly cartoony,
  matte shading, no harsh outlines). Use the style guide in
  `docs/midjourney-style.md` as the prompt prefix for every item.
- **Naming**: `<itemId>.png` exactly matching the `id` in `shopItems.ts`
  (e.g. `hat_party.png`, `acc_sunglasses.png`).

## Vertical anchor by slot

The slot system (`constants/cosmeticSlots.ts`) anchors each cosmetic at a
percentage of Chester's container height. To make a 1024 x 1024 source PNG
align cleanly, the visible artwork should sit roughly here on the canvas:

| Slot       | Used for                | Y-centre on PNG canvas |
| ---------- | ----------------------- | ---------------------- |
| `hat`      | hats, crowns, helmets   | ~35% from top          |
| `face`     | sunglasses, masks       | ~50% from top          |
| `neck`     | bowties, scarves, medals| ~50% from top          |
| `back`     | capes, wings, banners   | ~50% from top          |
| `foreground` | bones, treats, props  | ~50% from top          |

If a specific item needs a tweak, set `slotOffset: { cy, cx, width, rotate }`
on the item in `shopItems.ts` — those values fine-tune the anchor at render
time without re-exporting the PNG.

## Wiring an item once you drop a PNG

1. Save the PNG into this folder using the `<itemId>.png` convention.
2. Open `constants/shopItems.ts`.
3. Add `image: require('../assets/cosmetics/<itemId>.png')` to that item.
4. (Optional) add `slotOffset` if positioning needs a tweak.

Once `image` is set the slot system renders the PNG and ignores the emoji
icon for on-Chester display. The emoji is still used as the shop tile until
a separate shop preview asset is provided.
