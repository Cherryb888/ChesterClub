import { GeminiFoodResult } from '../types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const FOOD_ANALYSIS_PROMPT = `You are a nutrition AI assistant for a food tracking app called ChesterClub. The app has a virtual dog mascot named Chester.

Analyze this food photo and return a JSON response with this exact structure:
{
  "foods": [
    {
      "name": "Food item name",
      "calories": estimated_calories_number,
      "protein": estimated_protein_grams,
      "carbs": estimated_carbs_grams,
      "fat": estimated_fat_grams,
      "servingSize": "estimated portion description"
    }
  ],
  "overallScore": "great|good|okay|poor",
  "chesterReaction": "A fun, short reaction from Chester the dog about this meal (1-2 sentences, playful and encouraging)"
}

Rules:
- Identify ALL food items visible in the photo
- Estimate realistic portion sizes and nutrition values
- overallScore: "great" for very healthy meals, "good" for balanced, "okay" for moderate, "poor" for very unhealthy
- chesterReaction should be fun, dog-themed, and encouraging (e.g. "Woof! That salad looks pawsome!" or "Ruff... that's a lot of treats, but I still love you!")
- Return ONLY valid JSON, no markdown formatting, no code blocks`;

export async function analyzeFoodImage(base64Image: string): Promise<GeminiFoodResult> {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: FOOD_ANALYSIS_PROMPT },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini API');
  }

  // Clean up response - remove markdown code blocks if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as GeminiFoodResult;
}

export async function analyzeTextFood(description: string): Promise<GeminiFoodResult> {
  const textPrompt = `You are a nutrition AI for a food tracking app with a dog mascot named Chester.

The user described their food as: "${description}"

Return a JSON response with this exact structure:
{
  "foods": [
    {
      "name": "Food item name",
      "calories": estimated_calories_number,
      "protein": estimated_protein_grams,
      "carbs": estimated_carbs_grams,
      "fat": estimated_fat_grams,
      "servingSize": "estimated portion description"
    }
  ],
  "overallScore": "great|good|okay|poor",
  "chesterReaction": "A fun, short reaction from Chester the dog about this food"
}

Return ONLY valid JSON, no markdown, no code blocks.`;

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: textPrompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as GeminiFoodResult;
}
