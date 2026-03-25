import { GeminiFoodResult, MealPlanDay, UserGoals } from '../types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Rate limit tracking
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second minimum between requests

async function throttledFetch(url: string, options: RequestInit): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();

  const response = await fetch(url, options);

  // Handle rate limiting (429)
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    lastRequestTime = Date.now();
    return fetch(url, options);
  }

  return response;
}

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
  const response = await throttledFetch(GEMINI_URL, {
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
    if (response.status === 429) {
      throw new Error('Chester is taking a quick nap! Too many scans at once. Try again in a few seconds.');
    }
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini API');
  }

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

  const response = await throttledFetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: textPrompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Chester is taking a quick nap! Too many requests. Try again in a few seconds.');
    }
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as GeminiFoodResult;
}

export async function generateMealPlan(goals: UserGoals): Promise<MealPlanDay[]> {
  const prompt = `You are a meal planning AI for a food tracking app called ChesterClub.

The user has these daily nutrition goals:
- Calories: ${goals.dailyCalories}
- Protein: ${goals.dailyProtein}g
- Carbs: ${goals.dailyCarbs}g
- Fat: ${goals.dailyFat}g

Generate a 7-day meal plan. Return a JSON array with 7 objects, one per day. Each day should have breakfast, lunch, dinner, and a snack.

Return this exact JSON structure (array of 7 days):
[
  {
    "date": "Day 1",
    "meals": {
      "breakfast": {
        "name": "Meal name",
        "description": "Brief description of the meal with key ingredients",
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "servingSize": "portion description"
      },
      "lunch": { same structure },
      "dinner": { same structure },
      "snack": { same structure }
    },
    "totalCalories": sum of all meals,
    "totalProtein": sum,
    "totalCarbs": sum,
    "totalFat": sum
  }
]

Rules:
- Each day's totals should be close to the user's goals
- Include varied, realistic, and tasty meals
- Mix of cuisines and cooking styles
- Include practical meals that are easy to prepare
- Keep descriptions brief but appetizing (1 sentence)
- Return ONLY valid JSON, no markdown, no code blocks`;

  const response = await throttledFetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Chester is busy planning! Too many requests. Try again in a few seconds.');
    }
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini API');
  }

  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as MealPlanDay[];
}
