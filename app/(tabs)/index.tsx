import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  Dimensions, FlatList, Alert, ImageBackground, Image, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import ChesterAvatar from '../../components/Chester/ChesterAvatar';
import ChesterReaction from '../../components/Chester/ChesterReaction';
import {
  getProfile, getDailyLog, getTodayKey, checkChesterDecay,
  getWaterLog, addWaterGlass, removeWaterGlass,
  getMealPlan, calculateNutritionScore,
  getChallengesState, refreshChallengeProgress, claimChallengeReward,
  DAILY_CHALLENGES, WEEKLY_CHALLENGES, MONTHLY_CHALLENGES, ALL_TIME_CHALLENGES,
  popPendingAchievement, getPendingMilestone, getWeeklyStats,
  canDigToday,
} from '../../services/storage';
import { getChesterDialogue } from '../../services/chesterDialogue';
import { AchievementDefinition } from '../../constants/achievements';
import { StreakMilestone } from '../../constants/streakRewards';
import AchievementUnlockedModal from '../../components/AchievementUnlockedModal';
import StreakMilestoneModal from '../../components/StreakMilestoneModal';
import WeeklyRecap from '../../components/WeeklyRecap';
import { ChesterState, DailyLog, UserGoals, WaterLog, MealPlan, ChallengesState, Challenge, ChallengeProgress } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHESTER_BACKGROUND = require('../../assets/chester/chester-background.png');
const CHESTER_FACE = require('../../assets/chester/chester-solo.png');

export default function HomeScreen() {
  const router = useRouter();
  const pagerRef = useRef<FlatList>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [chester, setChester] = useState<ChesterState>({ level: 1, xp: 0, mood: 'happy', streak: 0, lastFedDate: null, outfit: 'default', health: 70, achievements: [], coins: 0, previousStreak: 0, streakShieldActive: false });
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [goals, setGoals] = useState<UserGoals>({ dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 200, dailyFat: 65, dailyWaterGlasses: 8 });
  const [waterLog, setWaterLog] = useState<WaterLog>({ date: '', glasses: 0, goalReached: false });
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [nutritionScore, setNutritionScore] = useState(0);
  const [challengesState, setChallengesState] = useState<ChallengesState | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('Woof! Ready to track some yummy food?');
  const [challengeTab, setChallengeTab] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('daily');
  const [isPremium, setIsPremium] = useState(false);
  const [achievementModal, setAchievementModal] = useState<AchievementDefinition | null>(null);
  const [milestoneModal, setMilestoneModal] = useState<StreakMilestone | null>(null);
  const [weeklyRecapVisible, setWeeklyRecapVisible] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  const [digAvailable, setDigAvailable] = useState(false);
  const digPulse = useRef(new Animated.Value(1)).current;

  // Pulsing animation for dig button when available
  useEffect(() => {
    if (digAvailable) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(digPulse, { toValue: 1.15, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(digPulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ).start();
    } else {
      digPulse.setValue(1);
    }
  }, [digAvailable]);

  const loadData = useCallback(async () => {
    await checkChesterDecay();
    const profile = await getProfile();
    setChester(profile.chester);
    setGoals(profile.goals);
    setIsPremium(profile.isPremiumMax);
    const log = await getDailyLog(getTodayKey());
    setTodayLog(log);
    const water = await getWaterLog();
    setWaterLog(water);
    const plan = await getMealPlan();
    setMealPlan(plan);
    const score = calculateNutritionScore(log, profile.goals);
    setNutritionScore(score);
    await refreshChallengeProgress();
    const challenges = await getChallengesState();
    setChallengesState(challenges);
    const digOk = await canDigToday();
    setDigAvailable(digOk);

    // Generate context-aware Chester dialogue
    const dialogue = getChesterDialogue({
      chester: profile.chester,
      todayLog: log,
      goals: profile.goals,
      waterLog: water,
      hour: new Date().getHours(),
    });
    setGreeting(dialogue);

    // Show pending achievement unlock celebration
    const pending = await popPendingAchievement();
    if (pending) {
      setAchievementModal(pending);
    }

    // Show pending streak milestone celebration
    const milestone = await getPendingMilestone();
    if (milestone) {
      // Delay slightly if achievement modal is showing
      if (pending) {
        setTimeout(() => setMilestoneModal(milestone), 1500);
      } else {
        setMilestoneModal(milestone);
      }
    }

    // Show weekly recap on Mondays (day 1) if not already shown today
    const now = new Date();
    if (now.getDay() === 1) {
      const stats = await getWeeklyStats();
      if (stats.daysLogged > 0) {
        setWeeklyStats(stats);
      }
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddWater = async () => {
    const updated = await addWaterGlass();
    setWaterLog(updated);
    if (updated.goalReached) {
      const log = await getDailyLog(getTodayKey());
      const profile = await getProfile();
      setNutritionScore(calculateNutritionScore(log, profile.goals));
    }
  };

  const handleRemoveWater = async () => {
    const updated = await removeWaterGlass();
    setWaterLog(updated);
  };

  const handleClaimReward = async (challengeId: string) => {
    const coins = await claimChallengeReward(challengeId);
    if (coins > 0) {
      Alert.alert('Coins Earned!', `You earned ${coins} coins! 🪙🐶`);
      await loadData();
    }
  };

  const calorieProgress = todayLog ? Math.min(todayLog.totalCalories / goals.dailyCalories, 1) : 0;
  const caloriesLeft = goals.dailyCalories - (todayLog?.totalCalories || 0);

  const pages = ['chester', 'club'];

  const renderPage = ({ item }: { item: string }) => {
    if (item === 'chester') return renderChesterPage();
    return renderClubPage();
  };

  const renderChesterPage = () => (
    <ScrollView
      style={{ width: SCREEN_WIDTH }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/dashboard')}>
          <Ionicons name="stats-chart" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.header}>ChesterClub</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/insights')}>
            <Ionicons name="bulb-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Ionicons name="person-circle" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Health bar — elongated heart, left-aligned */}
      <View style={styles.healthBarContainer}>
        <Text style={styles.healthHeart}>❤️</Text>
        <View style={styles.healthBarOuter}>
          <View style={[styles.healthBarFill, {
            width: `${chester.health}%`,
            backgroundColor: chester.health > 60 ? '#4CAF50' : chester.health > 30 ? '#FFC107' : '#FF5252',
          }]} />
        </View>
        <Text style={styles.healthBarLabel}>{chester.health}</Text>
      </View>

      {/* Chester + Speech Bubble side by side */}
      <View style={styles.chesterRow}>
        <ChesterAvatar chester={chester} size="large" />
        <ChesterReaction message={greeting} visible={true} autoDismissMs={8000} />
      </View>

      {/* Daily Dig button */}
      <TouchableOpacity
        style={styles.digEntryBtn}
        onPress={() => router.push('/(tabs)/daily-dig')}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.digEntryPaw, digAvailable && { transform: [{ scale: digPulse }] }]}>
          <Text style={styles.digEntryPawText}>🐾</Text>
        </Animated.View>
        <View>
          <Text style={styles.digEntryTitle}>Daily Dig</Text>
          <Text style={styles.digEntrySubtitle}>
            {digAvailable ? 'Chester wants to dig!' : 'Come back tomorrow'}
          </Text>
        </View>
        {digAvailable && <View style={styles.digEntryDot} />}
      </TouchableOpacity>

      {/* Calories & Macros Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Progress</Text>
        <View style={styles.calorieRow}>
          <View style={styles.calorieCircle}>
            <Text style={styles.calorieNumber}>{todayLog?.totalCalories || 0}</Text>
            <Text style={styles.calorieLabel}>eaten</Text>
          </View>
          <View style={styles.calorieDivider} />
          <View style={styles.calorieCircle}>
            <Text style={[styles.calorieNumber, { color: caloriesLeft > 0 ? Colors.success : Colors.error }]}>
              {Math.abs(caloriesLeft)}
            </Text>
            <Text style={styles.calorieLabel}>{caloriesLeft > 0 ? 'remaining' : 'over'}</Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${calorieProgress * 100}%`, backgroundColor: calorieProgress > 1 ? Colors.error : Colors.primary }]} />
        </View>
        <Text style={styles.progressLabel}>{Math.round(calorieProgress * 100)}% of {goals.dailyCalories} cal goal</Text>

        <View style={styles.macroRow}>
          <MacroStat label="Protein" value={todayLog?.totalProtein || 0} goal={goals.dailyProtein} color={Colors.protein} unit="g" />
          <MacroStat label="Carbs" value={todayLog?.totalCarbs || 0} goal={goals.dailyCarbs} color={Colors.carbs} unit="g" />
          <MacroStat label="Fat" value={todayLog?.totalFat || 0} goal={goals.dailyFat} color={Colors.fat} unit="g" />
        </View>
      </View>

      {/* Water Tracker */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Water Intake 💧</Text>
          {waterLog.goalReached && <Text style={styles.goalBadge}>Goal Reached!</Text>}
        </View>
        <View style={styles.waterRow}>
          <TouchableOpacity onPress={handleRemoveWater} style={styles.waterBtn}>
            <Ionicons name="remove-circle" size={32} color={Colors.textLight} />
          </TouchableOpacity>
          <View style={styles.waterGlasses}>
            {Array.from({ length: goals.dailyWaterGlasses }).map((_, i) => (
              <Text key={i} style={[styles.waterGlass, i < waterLog.glasses && styles.waterGlassFilled]}>
                {i < waterLog.glasses ? '💧' : '○'}
              </Text>
            ))}
          </View>
          <TouchableOpacity onPress={handleAddWater} style={styles.waterBtn} disabled={waterLog.goalReached}>
            <Ionicons name="add-circle" size={32} color={waterLog.goalReached ? Colors.textLight : '#4FC3F7'} />
          </TouchableOpacity>
        </View>
        <Text style={styles.waterCount}>
          {waterLog.glasses} / {goals.dailyWaterGlasses} glasses
        </Text>
      </View>

      {/* Nutrition Score */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nutrition Score</Text>
        <View style={styles.scoreRow}>
          <View style={[styles.scoreCircle, {
            borderColor: nutritionScore >= 80 ? Colors.success : nutritionScore >= 50 ? Colors.warning : Colors.error,
          }]}>
            <Text style={[styles.scoreNumber, {
              color: nutritionScore >= 80 ? Colors.success : nutritionScore >= 50 ? Colors.warning : Colors.error,
            }]}>{nutritionScore}</Text>
            <Text style={styles.scoreLabel}>/ 100</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreGrade}>
              {nutritionScore >= 90 ? 'Excellent! 🌟' :
               nutritionScore >= 80 ? 'Great! ⭐' :
               nutritionScore >= 60 ? 'Good 👍' :
               nutritionScore >= 40 ? 'Okay 🤔' :
               nutritionScore > 0 ? 'Needs work 💪' : 'Start logging!'}
            </Text>
            <Text style={styles.scoreHint}>
              {waterLog.goalReached
                ? 'Hydration bonus applied!'
                : 'Drink your water to boost score'}
            </Text>
            {todayLog && todayLog.totalCalories > goals.dailyCalories && (
              <Text style={[styles.scoreHint, { color: Colors.error }]}>
                Over calorie goal - score reduced
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Meal Plan Preview */}
      {mealPlan && mealPlan.days.length > 0 && (
        <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/meal-plan')}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Today's Meal Plan 🍽️</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </View>
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(type => {
            const meal = mealPlan.days[0]?.meals?.[type];
            if (!meal?.name) return null;
            return (
              <View key={type} style={styles.mealPreviewRow}>
                <Text style={styles.mealPreviewType}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                <Text style={styles.mealPreviewName} numberOfLines={1}>{meal.name}</Text>
                <Text style={styles.mealPreviewCal}>{meal.calories} cal</Text>
              </View>
            );
          })}
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/scanner')}>
          <Ionicons name="camera" size={28} color={Colors.surface} />
          <Text style={styles.actionText}>Scan Food</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.secondary }]} onPress={() => router.push('/(tabs)/favorites')}>
          <Ionicons name="heart" size={28} color={Colors.surface} />
          <Text style={styles.actionText}>Favorites</Text>
        </TouchableOpacity>
      </View>

      {/* Swipe hint */}
      <View style={styles.swipeHint}>
        <Text style={styles.swipeHintText}>Swipe left for the Club</Text>
        <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );

  const renderClubPage = () => {
    const challengeMap: Record<string, { challenges: Challenge[]; progress: ChallengeProgress[] }> = {
      daily: { challenges: DAILY_CHALLENGES, progress: challengesState?.daily || [] },
      weekly: { challenges: WEEKLY_CHALLENGES, progress: challengesState?.weekly || [] },
      monthly: { challenges: MONTHLY_CHALLENGES, progress: challengesState?.monthly || [] },
      all_time: { challenges: ALL_TIME_CHALLENGES, progress: challengesState?.allTime || [] },
    };

    const current = challengeMap[challengeTab];

    return (
      <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
        {/* Overlay to hide background Chester on Club page */}
        <View style={styles.clubOverlay} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
        {/* Club Header */}
        <View style={styles.clubHeader}>
          <Text style={styles.clubTitle}>The Club</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/friends')} style={styles.shopBtn}>
            <Ionicons name="people" size={18} color={Colors.primary} />
            <Text style={styles.shopBtnText}>Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/feed')} style={styles.shopBtn}>
            <Ionicons name="newspaper-outline" size={18} color={Colors.primary} />
            <Text style={styles.shopBtnText}>Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/shop')} style={styles.shopBtn}>
            <Ionicons name="bag-handle" size={18} color={Colors.primary} />
            <Text style={styles.shopBtnText}>Shop</Text>
          </TouchableOpacity>
          <View style={styles.coinsBadge}>
            <Text style={styles.coinsIcon}>🪙</Text>
            <Text style={styles.coinsText}>{chester.coins}</Text>
          </View>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{chester.streak}{chester.streakShieldActive ? ' 🛡️' : ''}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{todayLog?.items.length || 0}</Text>
            <Text style={styles.statLabel}>Today's Meals</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{nutritionScore}</Text>
            <Text style={styles.statLabel}>Nutrition</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>Lv.{chester.level}</Text>
            <Text style={styles.statLabel}>Chester</Text>
          </View>
        </View>

        {/* Leaderboard Button */}
        <TouchableOpacity
          style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: Spacing.md }]}
          onPress={() => router.push('/(tabs)/leaderboard')}
        >
          <Text style={{ fontSize: 28 }}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Leaderboard</Text>
            <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: -Spacing.sm }}>
              Compete with friends on streaks, levels & badges
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Challenges */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Challenges</Text>

          {/* Premium hint */}
          {!isPremium && (
            <View style={styles.premiumHint}>
              <Text style={styles.premiumHintIcon}>👑</Text>
              <Text style={styles.premiumHintText}>
                Premium Max members earn <Text style={styles.premiumBold}>2x coins</Text> on all challenges!
              </Text>
            </View>
          )}
          {isPremium && (
            <View style={[styles.premiumHint, { backgroundColor: '#FFD700' + '20', borderColor: '#FFD700' }]}>
              <Text style={styles.premiumHintIcon}>👑</Text>
              <Text style={[styles.premiumHintText, { color: '#B8860B' }]}>
                <Text style={styles.premiumBold}>2x coins active!</Text> You're earning double on all challenges.
              </Text>
            </View>
          )}

          {/* Challenge tabs */}
          <View style={styles.challengeTabs}>
            {([['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['all_time', 'All Time']] as const).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[styles.challengeTab, challengeTab === key && styles.challengeTabActive]}
                onPress={() => setChallengeTab(key)}
              >
                <Text style={[styles.challengeTabText, challengeTab === key && styles.challengeTabTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Challenge list */}
          {current.challenges.map((challenge) => {
            const cp = current.progress.find(p => p.challengeId === challenge.id);
            const progress = cp?.progress || 0;
            const completed = cp?.completed || false;
            const claimed = cp?.coinsClaimed || false;
            const progressRatio = Math.min(progress / challenge.target, 1);

            return (
              <View key={challenge.id} style={[styles.challengeItem, completed && styles.challengeItemCompleted]}>
                <View style={styles.challengeTop}>
                  <Text style={styles.challengeIcon}>{challenge.icon}</Text>
                  <View style={styles.challengeInfo}>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <Text style={styles.challengeDesc}>{challenge.description}</Text>
                  </View>
                  <View style={styles.challengeReward}>
                    {completed && !claimed ? (
                      <TouchableOpacity
                        style={styles.claimBtn}
                        onPress={() => handleClaimReward(challenge.id)}
                      >
                        <Text style={styles.claimBtnText}>🪙 {challenge.reward}</Text>
                      </TouchableOpacity>
                    ) : claimed ? (
                      <Text style={styles.claimedText}>Claimed</Text>
                    ) : (
                      <View style={styles.rewardBadge}>
                        <Text style={styles.rewardCoin}>🪙</Text>
                        <Text style={styles.rewardAmount}>{challenge.reward}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.challengeProgressBar}>
                  <View style={[styles.challengeProgressFill, {
                    width: `${progressRatio * 100}%`,
                    backgroundColor: completed ? Colors.success : Colors.primary,
                  }]} />
                </View>
                <Text style={styles.challengeProgressText}>
                  {progress} / {challenge.target}
                  {completed ? ' - Complete!' : ''}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Badges */}
        <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/badges')}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Badges</Text>
            <View style={styles.badgeCountPill}>
              <Text style={styles.badgeCountText}>{chester.achievements.length}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </View>
          {chester.achievements.length > 0 ? (
            <View style={styles.achievementsGrid}>
              {chester.achievements.slice(0, 6).map(a => (
                <View key={a} style={styles.achievementBadge}>
                  <Text style={styles.achievementIcon}>{getAchievementIcon(a)}</Text>
                  <Text style={styles.achievementLabel}>{getAchievementLabel(a)}</Text>
                </View>
              ))}
              {chester.achievements.length > 6 && (
                <View style={styles.achievementBadge}>
                  <Text style={styles.achievementIcon}>...</Text>
                  <Text style={styles.achievementLabel}>More</Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.noBadgesText}>Start tracking to earn badges!</Text>
          )}
        </TouchableOpacity>

        {/* Weekly Recap */}
        {weeklyStats && (
          <TouchableOpacity
            style={[styles.card, { borderWidth: 1, borderColor: Colors.primary + '40' }]}
            onPress={() => setWeeklyRecapVisible(true)}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Weekly Recap</Text>
              <Text style={{ fontSize: 20 }}>📊</Text>
            </View>
            <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary }}>
              Tap to see how your week went!
            </Text>
          </TouchableOpacity>
        )}

        {/* Swipe hint */}
        <View style={styles.swipeHint}>
          <Ionicons name="arrow-back" size={16} color={Colors.textLight} />
          <Text style={styles.swipeHintText}>Swipe right for Chester</Text>
        </View>

        <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    );
  };

  return (
    <ImageBackground source={CHESTER_BACKGROUND} style={styles.backgroundImage} resizeMode="cover">
    <SafeAreaView style={styles.container}>
      {/* Page dots */}
      <View style={styles.pageDots}>
        <View style={[styles.pageDot, currentPage === 0 && styles.pageDotActive]} />
        <View style={[styles.pageDot, currentPage === 1 && styles.pageDotActive]} />
      </View>

      <FlatList
        ref={pagerRef}
        data={pages}
        renderItem={renderPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentPage(idx);
        }}
      />

      {/* Achievement Celebration Modal */}
      <AchievementUnlockedModal
        achievement={achievementModal}
        visible={!!achievementModal}
        onClose={async () => {
          setAchievementModal(null);
          // Check for more pending achievements
          const next = await popPendingAchievement();
          if (next) {
            setTimeout(() => setAchievementModal(next), 400);
          }
        }}
      />

      {/* Streak Milestone Celebration Modal */}
      <StreakMilestoneModal
        milestone={milestoneModal}
        visible={!!milestoneModal}
        onClose={() => setMilestoneModal(null)}
      />

      {/* Weekly Recap Modal */}
      {weeklyStats && (
        <WeeklyRecap
          visible={weeklyRecapVisible}
          stats={weeklyStats}
          onClose={() => setWeeklyRecapVisible(false)}
        />
      )}
    </SafeAreaView>
    </ImageBackground>
  );
}

function MacroStat({ label, value, goal, color, unit }: { label: string; value: number; goal: number; color: string; unit: string }) {
  const progress = Math.min(value / goal, 1);
  return (
    <View style={styles.macroItem}>
      <Text style={[styles.macroValue, { color }]}>{Math.round(value)}{unit}</Text>
      <View style={styles.macroBar}>
        <View style={[styles.macroFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function getAchievementIcon(id: string): string {
  const { getAchievementById } = require('../../constants/achievements');
  const achievement = getAchievementById(id);
  return achievement?.icon || '⭐';
}

function getAchievementLabel(id: string): string {
  const { getAchievementById } = require('../../constants/achievements');
  const achievement = getAchievementById(id);
  return achievement?.title || id;
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },

  // Club overlay — hides Chester from background, keeps teal tint
  clubOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(232, 245, 243, 0.88)', zIndex: 0 },

  // Page dots
  pageDots: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, paddingTop: Spacing.xs, paddingBottom: Spacing.xs },
  pageDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  pageDotActive: { backgroundColor: Colors.primary, width: 20 },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  header: { fontSize: FontSize.xxl, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },

  // Health bar (above Chester, left-aligned)
  healthBarContainer: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 8, marginBottom: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 6,
  },
  healthHeart: { fontSize: 20 },
  healthBarOuter: {
    width: 120, height: 14, backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 7, overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%', borderRadius: 7,
  },
  healthBarLabel: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.text, minWidth: 24 },

  // Chester + bubble row
  chesterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, gap: Spacing.md },

  // Daily Dig entry
  digEntryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: 'rgba(139, 105, 20, 0.12)', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: 'rgba(139, 105, 20, 0.2)',
  },
  digEntryPaw: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#8B6914', justifyContent: 'center', alignItems: 'center',
  },
  digEntryPawText: { fontSize: 20 },
  digEntryTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  digEntrySubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary },
  digEntryDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50',
    position: 'absolute', top: 8, right: 12,
  },

  // Cards
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)', borderRadius: BorderRadius.lg, padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(78, 205, 196, 0.2)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  cardTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },

  // Calories
  calorieRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: Spacing.md },
  calorieCircle: { alignItems: 'center' },
  calorieNumber: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.primary },
  calorieLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  calorieDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  progressBar: { height: 10, backgroundColor: Colors.border, borderRadius: BorderRadius.full, overflow: 'hidden', marginBottom: Spacing.xs },
  progressFill: { height: '100%', borderRadius: BorderRadius.full },
  progressLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.md },

  // Macros
  macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroItem: { flex: 1, alignItems: 'center' },
  macroValue: { fontSize: FontSize.md, fontWeight: '700' },
  macroBar: { width: '80%', height: 6, backgroundColor: Colors.border, borderRadius: BorderRadius.full, overflow: 'hidden', marginVertical: 4 },
  macroFill: { height: '100%', borderRadius: BorderRadius.full },
  macroLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },

  // Water
  waterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  waterBtn: { padding: Spacing.xs },
  waterGlasses: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, maxWidth: 200 },
  waterGlass: { fontSize: 20, opacity: 0.3 },
  waterGlassFilled: { opacity: 1 },
  waterCount: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
  goalBadge: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.success, backgroundColor: Colors.success + '15', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, overflow: 'hidden' },

  // Nutrition Score
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  scoreNumber: { fontSize: FontSize.xl, fontWeight: '800' },
  scoreLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  scoreInfo: { flex: 1 },
  scoreGrade: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  scoreHint: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 },

  // Meal plan preview
  mealPreviewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border + '60' },
  mealPreviewType: { width: 70, fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  mealPreviewName: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  mealPreviewCal: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.calories, marginLeft: Spacing.sm },

  // Actions
  actionsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  actionBtn: {
    flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    alignItems: 'center', gap: Spacing.sm,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  actionText: { color: Colors.surface, fontSize: FontSize.md, fontWeight: '700' },

  // Swipe hint
  swipeHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md, opacity: 0.5 },
  swipeHintText: { fontSize: FontSize.xs, color: Colors.textLight },

  // ─── Club Page ───
  clubHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  clubTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.primary },
  coinsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFD700' + '20', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  coinsIcon: { fontSize: 18 },
  coinsText: { fontSize: FontSize.lg, fontWeight: '800', color: '#B8860B' },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  statBox: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm) / 2 - 1,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 },

  // Premium hint
  premiumHint: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary + '10', borderRadius: BorderRadius.md,
    padding: Spacing.sm, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  premiumHintIcon: { fontSize: 20 },
  premiumHintText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  premiumBold: { fontWeight: '800', color: Colors.primary },

  // Challenge tabs
  challengeTabs: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  challengeTab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center', backgroundColor: Colors.background },
  challengeTabActive: { backgroundColor: Colors.primary },
  challengeTabText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  challengeTabTextActive: { color: '#fff' },

  // Challenge items
  challengeItem: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.sm },
  challengeItemCompleted: { backgroundColor: Colors.success + '10', borderWidth: 1, borderColor: Colors.success + '30' },
  challengeTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  challengeIcon: { fontSize: 24 },
  challengeInfo: { flex: 1 },
  challengeTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  challengeDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  challengeReward: { alignItems: 'center' },
  rewardBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FFF8E1', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: '#FFD700' + '40',
  },
  rewardCoin: { fontSize: 14 },
  rewardAmount: { fontSize: FontSize.sm, fontWeight: '800', color: '#B8860B' },
  claimBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full },
  claimBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  claimedText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: '600' },
  challengeProgressBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginTop: Spacing.xs, overflow: 'hidden' },
  challengeProgressFill: { height: '100%', borderRadius: 2 },
  challengeProgressText: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },

  // Achievements
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  achievementBadge: { alignItems: 'center', width: 70 },
  achievementIcon: { fontSize: 28 },
  achievementLabel: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
  badgeCountPill: {
    backgroundColor: Colors.primary + '20', paddingHorizontal: Spacing.sm,
    paddingVertical: 2, borderRadius: BorderRadius.full, marginRight: 'auto', marginLeft: Spacing.sm,
  },
  badgeCountText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary },
  noBadgesText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.md },
  shopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary + '15', paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs, borderRadius: BorderRadius.full,
  },
  shopBtnText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary },
});
