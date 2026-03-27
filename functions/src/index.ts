import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

admin.initializeApp();

// Gemini API key stored in Firebase Functions config (server-side only)
// Set via: firebase functions:config:set gemini.api_key="YOUR_KEY"
// Or use defineSecret for 2nd gen functions
const getGeminiKey = (): string => {
  // Try environment variable first (2nd gen / Cloud Run), then functions config (1st gen)
  return process.env.GEMINI_API_KEY || functions.config().gemini?.api_key || '';
};

const GEMINI_MODEL = 'gemini-2.0-flash';

// ─── Auth helper ───

async function verifyAuth(req: functions.https.Request): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new functions.https.HttpsError('unauthenticated', 'Missing auth token');
  }
  const token = authHeader.split('Bearer ')[1];
  const decoded = await admin.auth().verifyIdToken(token);
  return decoded.uid;
}

// ─── Rate limiting (in-memory, per-instance) ───

const userRequestTimes: Map<string, number[]> = new Map();
const MAX_REQUESTS_PER_MINUTE = 10;

function checkRateLimit(uid: string): void {
  const now = Date.now();
  const times = userRequestTimes.get(uid) || [];
  const recent = times.filter(t => now - t < 60000);

  if (recent.length >= MAX_REQUESTS_PER_MINUTE) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many requests. Please wait a moment before trying again.'
    );
  }

  recent.push(now);
  userRequestTimes.set(uid, recent);
}

// ─── Gemini proxy helper ───

async function callGemini(body: object): Promise<any> {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new functions.https.HttpsError('failed-precondition', 'Gemini API key not configured on server');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (response.status === 429) {
    throw new functions.https.HttpsError('resource-exhausted', 'AI service is busy. Try again in a few seconds.');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new functions.https.HttpsError('internal', `Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new functions.https.HttpsError('internal', 'No response from AI service');
  }

  // Clean markdown code blocks if present
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

// ─── CORS helper ───

function setCors(res: functions.Response): void {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ═══════════════════════════════════════════
// Endpoint 1: Analyze food image
// ═══════════════════════════════════════════

export const analyzeFoodImage = functions.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const uid = await verifyAuth(req);
    checkRateLimit(uid);

    const { base64Image } = req.body;
    if (!base64Image) {
      res.status(400).json({ error: 'Missing base64Image' });
      return;
    }

    const prompt = `You are a nutrition AI assistant for a food tracking app called ChesterClub. The app has a virtual dog mascot named Chester.

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
- chesterReaction should be fun, dog-themed, and encouraging
- Return ONLY valid JSON, no markdown formatting, no code blocks`;

    const result = await callGemini({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'image/jpeg', data: base64Image } },
        ],
      }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    });

    res.json(JSON.parse(result));
  } catch (err: any) {
    const status = err.httpErrorCode?.status || 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
  }
});

// ═══════════════════════════════════════════
// Endpoint 2: Analyze text food description
// ═══════════════════════════════════════════

export const analyzeTextFood = functions.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const uid = await verifyAuth(req);
    checkRateLimit(uid);

    const { description } = req.body;
    if (!description) {
      res.status(400).json({ error: 'Missing description' });
      return;
    }

    const prompt = `You are a nutrition AI for a food tracking app with a dog mascot named Chester.

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

    const result = await callGemini({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    });

    res.json(JSON.parse(result));
  } catch (err: any) {
    const status = err.httpErrorCode?.status || 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
  }
});

// ═══════════════════════════════════════════
// Endpoint 3: Generate meal plan
// ═══════════════════════════════════════════

export const generateMealPlan = functions.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const uid = await verifyAuth(req);
    checkRateLimit(uid);

    const { goals, dietProfile } = req.body;
    if (!goals) {
      res.status(400).json({ error: 'Missing goals' });
      return;
    }

    // Build personalised context from diet profile
    let profileContext = '';
    if (dietProfile) {
      const parts: string[] = [];
      if (dietProfile.dietType !== 'no_restriction') parts.push(`Diet: ${dietProfile.dietType.replace('_', ' ')}`);
      if (dietProfile.fitnessGoal) parts.push(`Goal: ${dietProfile.fitnessGoal.replace('_', ' ')}`);
      if (dietProfile.allergies?.length > 0) parts.push(`ALLERGIES (MUST AVOID): ${dietProfile.allergies.join(', ')}`);
      if (dietProfile.dislikedFoods?.length > 0) parts.push(`Dislikes (avoid): ${dietProfile.dislikedFoods.join(', ')}`);
      if (dietProfile.cuisinePreferences?.length > 0) parts.push(`Preferred cuisines: ${dietProfile.cuisinePreferences.join(', ')}`);
      if (dietProfile.cookingLevel) parts.push(`Cooking skill: ${dietProfile.cookingLevel}`);
      if (dietProfile.maxPrepTimeMinutes) parts.push(`Max prep time per meal: ${dietProfile.maxPrepTimeMinutes} minutes`);
      if (dietProfile.mealsPerDay) parts.push(`Meals per day: ${dietProfile.mealsPerDay}`);
      profileContext = parts.length > 0 ? `\n\nUser profile:\n${parts.map(p => `- ${p}`).join('\n')}` : '';
    }

    const prompt = `You are a meal planning AI for a food tracking app called ChesterClub.

The user has these daily nutrition goals:
- Calories: ${goals.dailyCalories}
- Protein: ${goals.dailyProtein}g
- Carbs: ${goals.dailyCarbs}g
- Fat: ${goals.dailyFat}g${profileContext}

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
- Respect ALL dietary restrictions and allergies strictly — never include allergens
- Vary cuisines across the week, favouring preferred cuisines when specified
- Match recipes to the user's cooking skill level and prep time constraints
- Keep descriptions brief but appetizing (1 sentence)
- Return ONLY valid JSON, no markdown, no code blocks`;

    const result = await callGemini({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    });

    res.json(JSON.parse(result));
  } catch (err: any) {
    const status = err.httpErrorCode?.status || 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
  }
});
