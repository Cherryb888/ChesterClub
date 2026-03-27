import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { getFavorites, removeFavorite, favoriteToFoodItem, FavoriteFood } from '../../services/favoritesService';
import { addFoodToLog, feedChester, addRecentFood, getTodayKey } from '../../services/storage';
import ScreenHeader from '../../components/ui/ScreenHeader';
import EmptyState from '../../components/ui/EmptyState';
import LoadingScreen from '../../components/ui/LoadingScreen';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const router = useRouter();

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    const favs = await getFavorites();
    setFavorites(favs);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadFavorites(); }, [loadFavorites]));

  // Auto-select meal type based on time of day
  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 10) setSelectedMealType('breakfast');
    else if (hour < 14) setSelectedMealType('lunch');
    else if (hour < 18) setSelectedMealType('snack');
    else setSelectedMealType('dinner');
  }, []);

  const handleQuickLog = async (fav: FavoriteFood) => {
    setLogging(fav.id);
    try {
      const foodItem = favoriteToFoodItem(fav, selectedMealType);
      await addFoodToLog(foodItem);
      await addRecentFood(foodItem);
      await feedChester('good');

      // Update usage count
      const { incrementFavoriteUsage } = require('../../services/favoritesService');
      await incrementFavoriteUsage(fav.name);

      Alert.alert(
        'Logged!',
        `${fav.name} added to ${selectedMealType}. Chester is happy! 🐶`,
        [{ text: 'OK' }]
      );
      loadFavorites();
    } catch {
      Alert.alert('Error', 'Failed to log food. Try again.');
    } finally {
      setLogging(null);
    }
  };

  const handleRemoveFavorite = (fav: FavoriteFood) => {
    Alert.alert(
      'Remove Favorite',
      `Remove ${fav.name} from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeFavorite(fav.id);
            loadFavorites();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Favorites" />

        {/* Meal Type Selector */}
        <View style={styles.mealTypeRow}>
          <Text style={styles.mealTypeLabel}>Log as:</Text>
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.mealTypeBtn, selectedMealType === type && styles.mealTypeBtnActive]}
              onPress={() => setSelectedMealType(type)}
            >
              <Text style={[styles.mealTypeBtnText, selectedMealType === type && styles.mealTypeBtnTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <LoadingScreen />
        ) : favorites.length === 0 ? (
          <EmptyState
            icon="⭐"
            title="No Favorites Yet"
            message="When viewing your food log, tap the heart icon on any food to save it here for quick re-logging!"
            buttonLabel="Scan Your First Meal"
            buttonIcon={<Ionicons name="camera" size={20} color="#fff" />}
            onPress={() => router.push('/(tabs)/scanner')}
          />
        ) : (
          <>
            <Text style={styles.sectionHint}>
              Tap any favorite to instantly log it as {selectedMealType}
            </Text>

            {favorites.map(fav => (
              <TouchableOpacity
                key={fav.id}
                style={styles.favCard}
                onPress={() => handleQuickLog(fav)}
                disabled={logging === fav.id}
                activeOpacity={0.7}
              >
                <View style={styles.favLeft}>
                  <Text style={styles.favName}>{fav.name}</Text>
                  <View style={styles.favMacros}>
                    <Text style={[styles.favMacro, { color: Colors.calories }]}>{fav.calories} cal</Text>
                    <Text style={styles.favDot}>·</Text>
                    <Text style={[styles.favMacro, { color: Colors.protein }]}>{fav.protein}g P</Text>
                    <Text style={styles.favDot}>·</Text>
                    <Text style={[styles.favMacro, { color: Colors.carbs }]}>{fav.carbs}g C</Text>
                    <Text style={styles.favDot}>·</Text>
                    <Text style={[styles.favMacro, { color: Colors.fat }]}>{fav.fat}g F</Text>
                  </View>
                  <View style={styles.favMeta}>
                    <Text style={styles.favServing}>{fav.servingSize}</Text>
                    {fav.timesLogged > 0 && (
                      <Text style={styles.favCount}>Logged {fav.timesLogged}x</Text>
                    )}
                  </View>
                </View>

                <View style={styles.favRight}>
                  {logging === fav.id ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <View style={styles.quickLogBtn}>
                      <Ionicons name="add-circle" size={32} color={Colors.primary} />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveFavorite(fav)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="heart-dislike-outline" size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },

  // Meal type selector
  mealTypeRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  mealTypeLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginRight: Spacing.xs },
  mealTypeBtn: {
    paddingHorizontal: Spacing.sm, paddingVertical: 6,
    borderRadius: BorderRadius.full, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  mealTypeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  mealTypeBtnText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  mealTypeBtnTextActive: { color: '#fff' },

  sectionHint: {
    fontSize: FontSize.xs, color: Colors.textSecondary,
    marginBottom: Spacing.md, textAlign: 'center',
  },

  // Favorite card
  favCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  favLeft: { flex: 1, marginRight: Spacing.md },
  favName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  favMacros: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  favMacro: { fontSize: FontSize.xs, fontWeight: '600' },
  favDot: { fontSize: FontSize.xs, color: Colors.textLight },
  favMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  favServing: { fontSize: FontSize.xs, color: Colors.textLight },
  favCount: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },

  favRight: { alignItems: 'center', gap: Spacing.xs },
  quickLogBtn: { padding: 2 },
  removeBtn: { padding: 4 },

});
