import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { getCurrentUser } from '../../services/firebase';
import {
  getMyFriendCode, getFriendsList, addFriendByCode, removeFriend,
  publishPublicProfile, FriendProfile, getLifeStageEmoji, getMoodEmoji,
} from '../../services/friendsService';
import { useRouter } from 'expo-router';
import ScreenHeader from '../../components/ui/ScreenHeader';
import EmptyState from '../../components/ui/EmptyState';
import LoadingScreen from '../../components/ui/LoadingScreen';

export default function FriendsScreen() {
  const [friendCode, setFriendCode] = useState('');
  const [myCode, setMyCode] = useState('');
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingFriend, setAddingFriend] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter();

  const isSignedIn = getCurrentUser() !== null;

  const loadData = useCallback(async () => {
    setLoading(true);
    if (isSignedIn) {
      const [code, friendsList] = await Promise.all([
        getMyFriendCode(),
        getFriendsList(),
      ]);
      setMyCode(code);
      setFriends(friendsList);
      // Update public profile in the background (non-blocking)
      publishPublicProfile().catch(() => {});
    }
    setLoading(false);
  }, [isSignedIn]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleAddFriend = async () => {
    if (!codeInput.trim()) return;
    setAddingFriend(true);

    try {
      const result = await addFriendByCode(codeInput.trim());
      if (result.success) {
        Alert.alert('Friend Added!', `${result.friend?.displayName} is now your friend! 🐶`);
        setCodeInput('');
        setShowAddForm(false);
        loadData();
      } else {
        Alert.alert('Error', result.error || 'Could not add friend');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setAddingFriend(false);
    }
  };

  const handleRemoveFriend = (friend: FriendProfile) => {
    Alert.alert(
      'Remove Friend',
      `Remove ${friend.displayName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            await removeFriend(friend.uid);
            loadData();
          },
        },
      ]
    );
  };

  const handleShareCode = async () => {
    await Share.share({
      message: `Add me on ChesterClub! My friend code is: ${myCode}`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Friends"
          rightElement={
            <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)}>
              <Ionicons name={showAddForm ? 'close' : 'person-add'} size={24} color={Colors.primary} />
            </TouchableOpacity>
          }
        />

        {!isSignedIn ? (
          <EmptyState
            icon="🔒"
            title="Sign In Required"
            message="Create an account to get your friend code and connect with others!"
            buttonLabel="Sign In"
            buttonIcon={<Ionicons name="log-in-outline" size={20} color="#fff" />}
            onPress={() => router.push('/(tabs)/auth')}
          />
        ) : loading ? (
          <LoadingScreen />
        ) : (
          <>
            {/* My Friend Code */}
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Your Friend Code</Text>
              <Text style={styles.codeValue}>{myCode}</Text>
              <Text style={styles.codeHint}>Share this code so friends can add you</Text>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShareCode}>
                <Ionicons name="share-outline" size={18} color="#fff" />
                <Text style={styles.shareBtnText}>Share Code</Text>
              </TouchableOpacity>
            </View>

            {/* Add Friend Form */}
            {showAddForm && (
              <View style={styles.addCard}>
                <Text style={styles.addTitle}>Add a Friend</Text>
                <TextInput
                  style={styles.codeInputField}
                  value={codeInput}
                  onChangeText={setCodeInput}
                  placeholder="Enter friend code (e.g. ABCD-1234)"
                  placeholderTextColor={Colors.textLight}
                  autoCapitalize="characters"
                  maxLength={9}
                />
                <TouchableOpacity
                  style={[styles.addBtn, !codeInput.trim() && styles.addBtnDisabled]}
                  onPress={handleAddFriend}
                  disabled={!codeInput.trim() || addingFriend}
                >
                  {addingFriend ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.addBtnText}>Add Friend</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Friends List */}
            <Text style={styles.sectionTitle}>
              Your Friends ({friends.length})
            </Text>

            {friends.length === 0 ? (
              <View style={styles.emptyFriends}>
                <Text style={styles.emptyFriendsText}>
                  No friends yet! Share your code or enter a friend's code to connect.
                </Text>
              </View>
            ) : (
              friends.map(friend => (
                <View key={friend.uid} style={styles.friendCard}>
                  <View style={styles.friendLeft}>
                    <Text style={styles.friendEmoji}>
                      {getLifeStageEmoji(friend.lifeStage)}
                    </Text>
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{friend.displayName}</Text>
                    <View style={styles.friendStats}>
                      <Text style={styles.friendStat}>Lv.{friend.chesterLevel}</Text>
                      <Text style={styles.friendDot}>·</Text>
                      <Text style={styles.friendStat}>{friend.streak} day streak</Text>
                      <Text style={styles.friendDot}>·</Text>
                      <Text style={styles.friendStat}>{friend.achievementCount} badges</Text>
                    </View>
                    <Text style={styles.friendMood}>
                      Chester is {friend.chesterMood} {getMoodEmoji(friend.chesterMood)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveFriend(friend)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color={Colors.textLight} />
                  </TouchableOpacity>
                </View>
              ))
            )}
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

  // Code Card
  codeCard: {
    backgroundColor: Colors.primary + '12', borderRadius: BorderRadius.lg,
    padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  codeLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  codeValue: { fontSize: FontSize.hero, fontWeight: '800', color: Colors.primary, marginVertical: Spacing.sm, letterSpacing: 4 },
  codeHint: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.md },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
  },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },

  // Add Friend
  addCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  addTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  codeInputField: {
    backgroundColor: Colors.background, borderRadius: BorderRadius.md,
    padding: Spacing.md, fontSize: FontSize.lg, fontWeight: '600',
    textAlign: 'center', letterSpacing: 2, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md,
  },
  addBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },

  // Section
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },

  // Friend Card
  friendCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  friendLeft: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primaryLight + '30', justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  friendEmoji: { fontSize: 24 },
  friendInfo: { flex: 1 },
  friendName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  friendStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  friendStat: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  friendDot: { fontSize: FontSize.xs, color: Colors.textLight },
  friendMood: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },

  // Empty states
  emptyFriends: { paddingVertical: Spacing.xl, alignItems: 'center' },
  emptyFriendsText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.lg },
});
