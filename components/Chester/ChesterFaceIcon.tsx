import React from 'react';
import { Image, StyleSheet } from 'react-native';

const CHESTER_FACE = require('../../assets/chester/chester-solo.png');

interface Props {
  size?: number;
}

export default function ChesterFaceIcon({ size = 24 }: Props) {
  return (
    <Image
      source={CHESTER_FACE}
      style={[styles.face, { width: size, height: size, borderRadius: size / 2 }]}
      resizeMode="cover"
      accessibilityLabel="Chester"
    />
  );
}

const styles = StyleSheet.create({
  face: {
    backgroundColor: '#f0f0f0',
  },
});
