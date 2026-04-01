import React from 'react';
import { View, Text, Image } from 'react-native';
import { styles } from '../onboardingStyles';

export default function WelcomeStep() {
  return (
    <View style={styles.center}>
      <View style={styles.chesterOnboard}>
        <Image source={require('../../../assets/chester/chester-happy.png')} style={styles.chesterImage} resizeMode="cover" accessibilityLabel="Chester the golden retriever mascot" />
      </View>
      <Text style={styles.title} accessibilityRole="header">Meet Chester!</Text>
      <Text style={styles.subtitle}>
        Your golden retriever food tracking buddy. Let's set up your personalised nutrition plan!
      </Text>
    </View>
  );
}
