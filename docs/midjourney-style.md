# Midjourney Style Guide — ChesterClub Cosmetics

This is the canonical recipe for generating cosmetic item PNGs that will sit
on top of Chester. Follow it and every item will look like it belongs in the
same world.

> Target version: **Midjourney v6.1 / v7**. Older versions struggle with
> transparent backgrounds and consistent style.

---

## Universal style block (paste before every prompt)

```
warm, soft, slightly cartoony 2.5D game asset, matte painterly shading,
gentle ambient occlusion, no harsh outlines, soft rim light from upper
left, friendly children's-book aesthetic, palette of warm pastels with
muted highlights, isolated subject on plain background
```

## Universal suffix (paste after every prompt)

```
centred composition, 3/4 perspective, full item visible with ~10% padding,
no text, no logos, no watermark, no extra props
--ar 1:1 --style raw --v 7
```

## Negative prompt (Midjourney `--no` flag)

```
--no photorealistic, harsh outlines, gritty texture, dark shadows,
gradient background, multiple items, watermark, text, signature,
human hands, dog, character, body parts
```

> The "no dog" / "no character" is critical — we want the **item alone**, never
> the item already on a dog. Compositing happens at runtime in the slot system.

---

## Background handling

Midjourney won't give you a true alpha channel. Generate on a flat **bright
magenta** (`#FF00FF`) background — it's cheap to remove later. Add this to
every prompt:

```
on a solid pure magenta #FF00FF background
```

Then run the output through any background remover (remove.bg works well, or
the macOS Preview "Instant Alpha" tool). Save as 1024×1024 transparent PNG.

A consistent magenta background matters because background removers leave
edge fringing that's much easier to clean up with one expected colour.

---

## Per-slot composition rules

The cosmetic slot system anchors items at fixed % positions on Chester.
Generate the **item itself centred on the canvas** — the slot system will
position it. Don't try to anticipate where it goes on a head/neck.

| Slot       | What's typically here     | Composition note              |
| ---------- | ------------------------- | ----------------------------- |
| `hat`      | hats, crowns, helmets     | Item upright, ribbon/strap visible if any |
| `face`     | sunglasses, masks, eye-patches | Front-on, slight 3/4 if shape allows |
| `neck`     | bowties, scarves, medals  | Symmetric, front-on            |
| `back`     | capes, wings, banners     | Spread / open shape, side-back angle |
| `foreground` | bones, treats, props    | 3/4 angled, sitting on imaginary ground |

---

## File naming + drop location

Save the cleaned PNG at `assets/cosmetics/<itemId>.png` where `<itemId>` is
the exact `id` from `constants/shopItems.ts`. Examples:

- `assets/cosmetics/hat_party.png`
- `assets/cosmetics/acc_sunglasses.png`
- `assets/cosmetics/bg_sunset.png` (only if doing a background; usually
  rendered as gradient)

I'll then add `image: require('../assets/cosmetics/<itemId>.png')` to that
item entry in code.

---

## Prompt library — current 18 items

Each prompt below already includes the style block; just paste the whole
thing into Midjourney as one go.

### Hats

**hat_party** (Party Hat, 150 coins)
```
warm, soft, slightly cartoony 2.5D game asset, matte painterly shading, gentle ambient occlusion, no harsh outlines, soft rim light from upper left, friendly children's-book aesthetic, palette of warm pastels with muted highlights, isolated subject on plain background, a colourful conical birthday party hat with rainbow stripes and a yellow pom-pom on top, thin elastic chin strap, on a solid pure magenta #FF00FF background, centred composition, 3/4 perspective, full item visible with ~10% padding, no text, no logos, no watermark, no extra props --ar 1:1 --style raw --v 7 --no photorealistic, harsh outlines, gritty texture, dark shadows, gradient background, multiple items, watermark, text, signature, human hands, dog, character, body parts
```

**hat_cowboy** (Cowboy Hat, 300 coins)
```
warm, soft, slightly cartoony 2.5D game asset, matte painterly shading, gentle ambient occlusion, no harsh outlines, soft rim light from upper left, friendly children's-book aesthetic, palette of warm pastels with muted highlights, isolated subject on plain background, a tan leather cowboy hat with curled brim and woven brown band, slightly weathered texture, on a solid pure magenta #FF00FF background, centred composition, 3/4 perspective, full item visible with ~10% padding, no text, no logos, no watermark, no extra props --ar 1:1 --style raw --v 7 --no photorealistic, harsh outlines, gritty texture, dark shadows, gradient background, multiple items, watermark, text, signature, human hands, dog, character, body parts
```

**hat_chef** (Chef Hat, 350 coins)
```
warm, soft, slightly cartoony 2.5D game asset, matte painterly shading, gentle ambient occlusion, no harsh outlines, soft rim light from upper left, friendly children's-book aesthetic, palette of warm pastels with muted highlights, isolated subject on plain background, a tall puffy white chef toque with soft pleats and a black band at the base, on a solid pure magenta #FF00FF background, centred composition, 3/4 perspective, full item visible with ~10% padding, no text, no logos, no watermark, no extra props --ar 1:1 --style raw --v 7 --no photorealistic, harsh outlines, gritty texture, dark shadows, gradient background, multiple items, watermark, text, signature, human hands, dog, character, body parts
```

**hat_santa** (Santa Hat, 400 coins)
```
warm, soft, slightly cartoony 2.5D game asset, matte painterly shading, gentle ambient occlusion, no harsh outlines, soft rim light from upper left, friendly children's-book aesthetic, palette of warm pastels with muted highlights, isolated subject on plain background, a classic red santa hat with white fluffy fur trim and a white pom-pom at the tip, slight slumping fold, on a solid pure magenta #FF00FF background, centred composition, 3/4 perspective, full item visible with ~10% padding, no text, no logos, no watermark, no extra props --ar 1:1 --style raw --v 7 --no photorealistic, harsh outlines, gritty texture, dark shadows, gradient background, multiple items, watermark, text, signature, human hands, dog, character, body parts
```

**hat_wizard** (Wizard Hat, 750 coins, premium)
```
warm, soft, slightly cartoony 2.5D game asset, matte painterly shading, gentle ambient occlusion, no harsh outlines, soft rim light from upper left, friendly children's-book aesthetic, palette of warm pastels with muted highlights, isolated subject on plain background, a tall pointed deep-purple wizard hat with crescent-moon and tiny gold stars pattern, gently bent tip, wide brim, on a solid pure magenta #FF00FF background, centred composition, 3/4 perspective, full item visible with ~10% padding, no text, no logos, no watermark, no extra props --ar 1:1 --style raw --v 7 --no photorealistic, harsh outlines, gritty texture, dark shadows, gradient background, multiple items, watermark, text, signature, human hands, dog, character, body parts
```

**hat_crown** (Royal Crown, 1500 coins)
```
warm, soft, slightly cartoony 2.5D game asset, matte painterly shading, gentle ambient occlusion, no harsh outlines, soft rim light from upper left, friendly children's-book aesthetic, palette of warm pastels with muted highlights, isolated subject on plain background, an ornate gold royal crown with five rounded points, ruby and emerald gems set into the band, soft velvet purple inner lining, on a solid pure magenta #FF00FF background, centred composition, 3/4 perspective, full item visible with ~10% padding, no text, no logos, no watermark, no extra props --ar 1:1 --style raw --v 7 --no photorealistic, harsh outlines, gritty texture, dark shadows, gradient background, multiple items, watermark, text, signature, human hands, dog, character, body parts
```

### Accessories

**acc_sunglasses** (Cool Shades, 120 coins)
```
warm, soft, slightly cartoony 2.5D game asset, matte painterly shading, gentle ambient occlusion, no harsh outlines, soft rim light from upper left, friendly children's-book aesthetic, palette of warm pastels with muted highlights, isolated subject on plain background, a pair of cool aviator-style sunglasses with thin gold frame and dark teal reflective lenses, front-on view, on a solid pure magenta #FF00FF background, centred composition, full item visible with ~10% padding, no text, no logos, no watermark, no extra props --ar 1:1 --style raw --v 7 --no photorealistic, harsh outlines, gritty texture, dark shadows, gradient background, multiple items, watermark, text, signature, human hands, dog, character, body parts
```

**acc_bowtie** (Bow Tie, 200 coins)
```
warm, soft, slightly cartoony 2.5D game asset, matte painterly shading, gentle ambient occlusion, no harsh outlines, soft rim light from upper left, friendly children's-book aesthetic, palette of warm pastels with muted highlights, isolated subject on plain background, a dapper navy-blue silk bow tie with subtle white polka dots, neatly tied with crisp folds, front-on, on a solid pure magenta #FF00FF background, centred composition, full item visible with ~10% padding, no text, no logos, no watermark, no extra props --ar 1:1 --style raw --v 7 --no photorealistic, harsh outlines, gritty texture, dark shadows, gradient background, multiple items, watermark, text, signature, human hands, dog, character, body parts
```

**acc_scarf** (Winter Scarf, 250 coins)
```
warm, soft, slightly cartoony 2.5D game asset, matte painterly shading, gentle ambient occlusion, no harsh outlines, soft rim light from upper left, friendly children's-book aesthetic, palette of warm pastels with muted highlights, isolated subject on plain background, a chunky knitted winter scarf in cream and forest-green stripes with little fringe tassels at the ends, loosely looped to suggest wrapping around a neck, on a solid pure magenta #FF00FF background, centred composition, full item visible with ~10% padding, no text, no logos, no watermark, no extra props --ar 1:1 --style raw --v 7 --no photorealistic, harsh outlines, gritty texture, dark shadows, gradient background, multiple items, watermark, text, signature, human hands, dog, character, body parts
```

**acc_medal** (Gold Medal, 500 coins)
```
warm, soft, slightly cartoony 2.5D game asset, matte painterly shading, gentle ambient occlusion, no harsh outlines, soft rim light from upper left, friendly children's-book aesthetic, palette of warm pastels with muted highlights, isolated subject on plain background, a shiny gold first-place medal with embossed star, hanging from a striped red-and-white ribbon, slight tilt for depth, on a solid pure magenta #FF00FF background, centred composition, full item visible with ~10% padding, no text, no logos, no watermark, no extra props --ar 1:1 --style raw --v 7 --no photorealistic, harsh outlines, gritty texture, dark shadows, gradient background, multiple items, watermark, text, signature, human hands, dog, character, body parts
```

**acc_cape** (Hero Cape, 800 coins, premium)
```
warm, soft, slightly cartoony 2.5D game asset, matte painterly shading, gentle ambient occlusion, no harsh outlines, soft rim light from upper left, friendly children's-book aesthetic, palette of warm pastels with muted highlights, isolated subject on plain background, a flowing crimson superhero cape with gold clasp at the top and a soft inner lining, billowing slightly to one side, viewed from behind at three-quarter angle, on a solid pure magenta #FF00FF background, centred composition, full item visible with ~10% padding, no text, no logos, no watermark, no extra props --ar 1:1 --style raw --v 7 --no photorealistic, harsh outlines, gritty texture, dark shadows, gradient background, multiple items, watermark, text, signature, human hands, dog, character, body parts
```

### Dig Exclusives

**dig_bandana** (Chester's Bandana, found via dig)
```
warm, soft, slightly cartoony 2.5D game asset, matte painterly shading, gentle ambient occlusion, no harsh outlines, soft rim light from upper left, friendly children's-book aesthetic, palette of warm pastels with muted highlights, isolated subject on plain background, a triangular red bandana with classic white paisley pattern, tied in a knot at the back, soft cotton folds, front-on view, on a solid pure magenta #FF00FF background, centred composition, full item visible with ~10% padding, no text, no logos, no watermark, no extra props --ar 1:1 --style raw --v 7 --no photorealistic, harsh outlines, gritty texture, dark shadows, gradient background, multiple items, watermark, text, signature, human hands, dog, character, body parts
```

**dig_sunflower** (Sunflower Hat, found via dig)
```
warm, soft, slightly cartoony 2.5D game asset, matte painterly shading, gentle ambient occlusion, no harsh outlines, soft rim light from upper left, friendly children's-book aesthetic, palette of warm pastels with muted highlights, isolated subject on plain background, a single oversized cheerful sunflower bloom with deep yellow petals and a brown seeded centre, short green stem at the base, on a solid pure magenta #FF00FF background, centred composition, 3/4 perspective, full item visible with ~10% padding, no text, no logos, no watermark, no extra props --ar 1:1 --style raw --v 7 --no photorealistic, harsh outlines, gritty texture, dark shadows, gradient background, multiple items, watermark, text, signature, human hands, dog, character, body parts
```

### Backgrounds (optional — current code uses gradients)

> Backgrounds currently render as colour gradients defined in
> `BACKGROUND_COLORS`. If you want full painterly scenes, generate at
> 2048×1024 (2:1 landscape) and we'll wire them up as scene images
> in Phase 1.4. For MVP, gradients are fine.

---

## Workflow

1. Open Midjourney and paste a prompt block as-is.
2. Pick the best of the 4 variations. If none feel right, hit "rerun".
3. Upscale the chosen variation.
4. Download the upscale (1024×1024).
5. Run it through a background remover (e.g. remove.bg) — magenta drops out cleanly.
6. Save as `assets/cosmetics/<itemId>.png`.
7. Tell me the item is dropped in. I'll wire `image:` into `shopItems.ts`
   and verify positioning.

## v1.0 release — additional items (subject-only)

For these, **construct the full prompt by sandwiching the subject** between
the universal style block (top of this file) and the universal suffix.
Keeps things compact while preserving consistency.

### New hats

| itemId             | subject                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| hat_baseball       | a sporty navy-blue baseball cap with a white embroidered "C" on the front, slight curved brim            |
| hat_beanie         | a soft cosy cable-knit beanie in mustard yellow with a folded cuff, fluffy pom-pom on top                |
| hat_pirate         | a black pirate captain's tricorn hat with white skull-and-crossbones emblem and golden trim              |
| hat_top            | a tall glossy black silk top hat with a red ribbon band                                                  |
| hat_viking         | a metallic silver viking helmet with two short curved horns and leather chinstrap, slightly battle-worn  |
| hat_witch          | a pointed black witch hat with a wide brim, a buckled grey band, and a spider-silver star               |
| hat_birthday_cake  | a tiny multi-tier pink-and-white birthday cake hat with lit candles and rainbow sprinkles                |
| hat_unicorn_horn   | a sparkly pearlescent unicorn horn with iridescent rainbow gradient and tiny gold spirals                |
| hat_halo           | a glowing golden halo ring, soft luminous edge, slight tilt                                              |

### New accessories

| itemId               | subject                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| acc_headphones       | over-ear chunky headphones in cream and rose-gold, soft cushion pads, slight 3/4 perspective       |
| acc_monocle          | a single round gold monocle with a thin chain, rim glinting, lens glass with subtle reflection     |
| acc_snorkel          | a bright orange snorkel mask with clear glass and a yellow breathing tube, front-on                |
| acc_neck_tie         | a slim crimson business necktie with a neat dimpled knot, slight diagonal stripes                  |
| acc_pearl_collar     | a delicate strand of cream pearls forming a collar, tiny silver clasp, soft sheen                  |
| acc_butterfly_wings  | a pair of large open butterfly wings in pastel blue and pink with darker wing-vein patterns, view from behind |
| acc_glow_collar      | a sleek dark collar studded with small glowing aqua-blue gem lights, neon-soft glow                |

### New backgrounds (full painterly scenes — 2:1 landscape, optional for v1.1)

> Backgrounds currently render as gradients defined in `BACKGROUND_COLORS`.
> Painterly scene PNGs are nice-to-have, not required for release.

| itemId      | subject                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| bg_garden   | a soft watercolour herb garden with rosemary, basil, and tomato plants, low stone wall, gentle sun     |
| bg_forest   | a cosy pine forest with sun-dappled moss, mushrooms, distant misty trees, autumn leaves                |
| bg_kennel   | a warm wooden dog kennel interior with a soft red cushion, hanging fairy lights, a chew toy basket     |
| bg_snowy    | crisp snowy mountain peaks under a pale blue sky, gentle snowfall, tiny pine silhouettes               |
| bg_aurora   | a starlit night with green and purple aurora ribbons over a frozen lake silhouette                     |
| bg_galaxy   | a swirling deep-purple galaxy with bright pink and gold star clusters, painterly nebula                |

> For backgrounds, **use 2:1 landscape (`--ar 2:1`)** instead of 1:1, and
> place the artwork on **the universal solid magenta** background only if you
> want a transparent cutout — for full-bleed scenes you don't need magenta.

## Quality bar

Before you save a PNG, ask:
- Could a 7-year-old recognise the item at a glance? If not, regenerate.
- Does it have a tail/strap that suggests how it attaches? Good — leave it.
- Is the lighting from upper-left? If from below or backlit, regenerate.
- Are there parts of a dog visible? Regenerate (Midjourney sometimes
  ignores `--no dog`; the keyword "isolated subject" usually fixes it).

If a single item takes more than 4 generations to get right, send me the
prompt + best result and I'll suggest a tweak.
