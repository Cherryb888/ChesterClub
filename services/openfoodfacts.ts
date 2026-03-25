import { GeminiFoodResult } from '../types';

const BASE_URL = 'https://world.openfoodfacts.org/api/v2/product';

export async function lookupBarcode(barcode: string): Promise<GeminiFoodResult | null> {
  try {
    const response = await fetch(`${BASE_URL}/${barcode}.json`);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;

    const product = data.product;
    const nutriments = product.nutriments || {};

    const name = product.product_name || product.product_name_en || 'Unknown Product';
    const servingSize = product.serving_size || product.quantity || '1 serving';

    // Get per-serving values if available, otherwise per 100g
    const calories = Math.round(nutriments['energy-kcal_serving'] || nutriments['energy-kcal_100g'] || 0);
    const protein = Math.round(nutriments.proteins_serving || nutriments.proteins_100g || 0);
    const carbs = Math.round(nutriments.carbohydrates_serving || nutriments.carbohydrates_100g || 0);
    const fat = Math.round(nutriments.fat_serving || nutriments.fat_100g || 0);

    // Determine score
    const nutriscore = product.nutriscore_grade; // a, b, c, d, e
    let overallScore: GeminiFoodResult['overallScore'] = 'okay';
    if (nutriscore === 'a' || nutriscore === 'b') overallScore = 'great';
    else if (nutriscore === 'c') overallScore = 'good';
    else if (nutriscore === 'd') overallScore = 'okay';
    else if (nutriscore === 'e') overallScore = 'poor';
    else {
      // Fallback: estimate from macros
      if (calories < 200 && protein > 10) overallScore = 'great';
      else if (calories < 400) overallScore = 'good';
      else if (calories < 600) overallScore = 'okay';
      else overallScore = 'poor';
    }

    const reactions: Record<string, string[]> = {
      great: [
        `Woof! ${name} looks like a healthy choice!`,
        `Bark bark! That's some good fuel right there!`,
        `*tail wag* Great pick with the ${name}!`,
      ],
      good: [
        `Nice choice! ${name} is solid fuel!`,
        `*happy pant* That'll keep us going!`,
        `${name} — not bad at all!`,
      ],
      okay: [
        `${name} is alright! Everything in moderation, right?`,
        `*head tilt* Could be better, could be worse!`,
        `I'll take it! Just balance it out later.`,
      ],
      poor: [
        `Ruff... ${name} is a bit of a treat, but I still love you!`,
        `*concerned whimper* Maybe balance this with something healthy?`,
        `That's a lot of the naughty stuff... but no judgement!`,
      ],
    };
    const scoreReactions = reactions[overallScore];
    const chesterReaction = scoreReactions[Math.floor(Math.random() * scoreReactions.length)];

    return {
      foods: [{
        name,
        calories,
        protein,
        carbs,
        fat,
        servingSize,
      }],
      overallScore,
      chesterReaction,
    };
  } catch {
    return null;
  }
}
