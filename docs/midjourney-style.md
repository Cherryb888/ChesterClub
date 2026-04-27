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

## Quality bar

Before you save a PNG, ask:
- Could a 7-year-old recognise the item at a glance? If not, regenerate.
- Does it have a tail/strap that suggests how it attaches? Good — leave it.
- Is the lighting from upper-left? If from below or backlit, regenerate.
- Are there parts of a dog visible? Regenerate (Midjourney sometimes
  ignores `--no dog`; the keyword "isolated subject" usually fixes it).

If a single item takes more than 4 generations to get right, send me the
prompt + best result and I'll suggest a tweak.
