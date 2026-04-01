import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem } from '../types';

const FAVORITES_KEY = 'food_favorites';

export interface FavoriteFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timesLogged: number;
  lastLogged: number;
  createdAt: number;
}

export async function getFavorites(): Promise<FavoriteFood[]> {
  const data = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!data) return [];
  try {
    const favorites: FavoriteFood[] = JSON.parse(data);
    // Sort by most frequently logged, then most recently logged
    return favorites.sort((a, b) => b.timesLogged - a.timesLogged || b.lastLogged - a.lastLogged);
  } catch {
    return [];
  }
}

export async function addFavorite(item: FoodItem): Promise<FavoriteFood> {
  const favorites = await getFavorites();

  // Check if already a favorite (by name, case-insensitive)
  const existing = favorites.find(f => f.name.toLowerCase() === item.name.toLowerCase());
  if (existing) return existing;

  const favorite: FavoriteFood = {
    id: `fav_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: item.name,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    servingSize: item.servingSize,
    mealType: item.mealType,
    timesLogged: 0,
    lastLogged: Date.now(),
    createdAt: Date.now(),
  };

  favorites.push(favorite);
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return favorite;
}

export async function removeFavorite(favoriteId: string): Promise<void> {
  const favorites = await getFavorites();
  const filtered = favorites.filter(f => f.id !== favoriteId);
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
}

export async function isFavorite(foodName: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some(f => f.name.toLowerCase() === foodName.toLowerCase());
}

export async function incrementFavoriteUsage(foodName: string): Promise<void> {
  const favorites = await getFavorites();
  const fav = favorites.find(f => f.name.toLowerCase() === foodName.toLowerCase());
  if (fav) {
    fav.timesLogged += 1;
    fav.lastLogged = Date.now();
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

export function favoriteToFoodItem(fav: FavoriteFood, mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'): FoodItem {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: fav.name,
    calories: fav.calories,
    protein: fav.protein,
    carbs: fav.carbs,
    fat: fav.fat,
    servingSize: fav.servingSize,
    timestamp: Date.now(),
    mealType: mealType || fav.mealType,
    source: 'recent',
  };
}
