import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { analyzeFoodImage, analyzeTextFood } from '../../services/gemini';
import { lookupBarcode } from '../../services/openfoodfacts';
import { addFoodToLog, feedChester, addRecentFood, getTodayKey } from '../../services/storage';
import ChesterReaction from '../../components/Chester/ChesterReaction';
import { FoodItem, GeminiFoodResult } from '../../types';

type Mode = 'camera' | 'preview' | 'result' | 'text';
type ScanType = 'meal' | 'label';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>('camera');
  const [scanType, setScanType] = useState<ScanType>('meal');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeminiFoodResult | null>(null);
  const [textInput, setTextInput] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const tabIndicator = useRef(new Animated.Value(0)).current;

  // Camera permission
  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={Colors.primary} />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionText}>Chester needs your camera to scan food and track your nutrition!</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const switchScanType = (type: ScanType) => {
    setScanType(type);
    setScannedBarcode(null);
    Animated.spring(tabIndicator, {
      toValue: type === 'meal' ? 0 : 1,
      useNativeDriver: true,
    }).start();
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
    if (photo) {
      setImageUri(photo.uri);
      setMode('preview');
      analyzeImage(photo.base64!);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setMode('preview');
      analyzeImage(result.assets[0].base64!);
    }
  };

  const analyzeImage = async (base64: string) => {
    setLoading(true);
    try {
      const foodResult = await analyzeFoodImage(base64);
      setResult(foodResult);
      setMode('result');
    } catch (error: any) {
      Alert.alert('Scan Failed', 'Chester couldn\'t identify that food. Try again with a clearer photo!\n\n' + error.message);
      setMode('camera');
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    // Prevent scanning the same barcode repeatedly
    if (scannedBarcode === data || loading) return;
    setScannedBarcode(data);
    setLoading(true);

    try {
      const foodResult = await lookupBarcode(data);
      if (foodResult) {
        setResult(foodResult);
        setMode('result');
      } else {
        Alert.alert(
          'Product Not Found',
          `Chester couldn't find barcode ${data} in the database. Try scanning the food with "Meal" mode instead!`,
          [{ text: 'Switch to Meal', onPress: () => switchScanType('meal') }, { text: 'Try Again', onPress: () => setScannedBarcode(null) }]
        );
      }
    } catch {
      Alert.alert('Scan Error', 'Something went wrong looking up that barcode. Try again!');
      setScannedBarcode(null);
    } finally {
      setLoading(false);
    }
  };

  const analyzeText = async () => {
    if (!textInput.trim()) return;
    setLoading(true);
    try {
      const foodResult = await analyzeTextFood(textInput);
      setResult(foodResult);
      setMode('result');
    } catch (error: any) {
      Alert.alert('Error', 'Chester couldn\'t find that food. Try describing it differently!\n\n' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const logFood = async () => {
    if (!result) return;
    for (const food of result.foods) {
      const item: FoodItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        servingSize: food.servingSize,
        imageUri: imageUri || undefined,
        timestamp: Date.now(),
        mealType: getMealType(),
        source: scanType === 'label' ? 'text_search' : (imageUri ? 'ai_scan' : 'text_search'),
      };
      await addFoodToLog(item);
      await addRecentFood(item);
    }
    await feedChester(result.overallScore);
    Alert.alert('Logged!', `Chester tracked ${result.foods.length} item(s)! 🐕`, [
      { text: 'OK', onPress: resetScanner },
    ]);
  };

  const resetScanner = () => {
    setMode('camera');
    setImageUri(null);
    setResult(null);
    setTextInput('');
    setScannedBarcode(null);
  };

  const getMealType = (): FoodItem['mealType'] => {
    const hour = new Date().getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 20) return 'dinner';
    return 'snack';
  };

  // Camera Mode
  if (mode === 'camera') {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={scanType === 'label' ? {
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
          } : undefined}
          onBarcodeScanned={scanType === 'label' ? handleBarcodeScanned : undefined}
        >
          <SafeAreaView style={styles.cameraOverlay}>
            {/* Scan type tabs */}
            <View style={styles.scanTabsContainer}>
              <View style={styles.scanTabs}>
                <TouchableOpacity
                  style={[styles.scanTab, scanType === 'meal' && styles.scanTabActive]}
                  onPress={() => switchScanType('meal')}
                >
                  <Ionicons name="restaurant" size={18} color={scanType === 'meal' ? '#fff' : 'rgba(255,255,255,0.6)'} />
                  <Text style={[styles.scanTabText, scanType === 'meal' && styles.scanTabTextActive]}>Meal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.scanTab, scanType === 'label' && styles.scanTabActive]}
                  onPress={() => switchScanType('label')}
                >
                  <Ionicons name="barcode" size={18} color={scanType === 'label' ? '#fff' : 'rgba(255,255,255,0.6)'} />
                  <Text style={[styles.scanTabText, scanType === 'label' && styles.scanTabTextActive]}>Label</Text>
                </TouchableOpacity>
              </View>

              {/* Text mode button (only for meal scan) */}
              {scanType === 'meal' && (
                <TouchableOpacity onPress={() => setMode('text')} style={styles.textModeBtn}>
                  <Ionicons name="text" size={18} color="#fff" />
                  <Text style={styles.textModeBtnText}>Type</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Scan frame */}
            <View style={styles.scanFrameArea}>
              {scanType === 'meal' ? (
                <>
                  <View style={styles.scanFrame}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                  </View>
                  <Text style={styles.scanHint}>Point at your food</Text>
                </>
              ) : (
                <>
                  <View style={styles.barcodeFrame}>
                    <View style={styles.barcodeLine} />
                  </View>
                  <Text style={styles.scanHint}>
                    {loading ? 'Looking up product...' : 'Point at a barcode'}
                  </Text>
                  {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 12 }} />}
                </>
              )}
            </View>

            {/* Controls */}
            <View style={styles.cameraControls}>
              {scanType === 'meal' ? (
                <>
                  <TouchableOpacity style={styles.galleryBtn} onPress={pickImage}>
                    <Ionicons name="images" size={28} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
                    <View style={styles.captureBtnInner} />
                  </TouchableOpacity>
                  <View style={{ width: 50 }} />
                </>
              ) : (
                <View style={styles.labelHint}>
                  <Ionicons name="scan" size={20} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.labelHintText}>Barcode scans automatically</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  // Text input mode
  if (mode === 'text') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={styles.textContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.textHeader}>
            <TouchableOpacity onPress={resetScanner}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.textTitle}>Describe Your Food</Text>
            <View style={{ width: 24 }} />
          </View>
          <Text style={styles.textHint}>Tell Chester what you're eating! Be as detailed as you can.</Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g. A large pepperoni pizza slice with a side of garlic bread and a can of coke"
            placeholderTextColor={Colors.textLight}
            multiline
            value={textInput}
            onChangeText={setTextInput}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.analyzeBtn, !textInput.trim() && styles.analyzeBtnDisabled]}
            onPress={analyzeText}
            disabled={!textInput.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.analyzeBtnText}>Analyze Food</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Preview/Loading mode
  if (mode === 'preview') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Chester is sniffing your food...</Text>
            <Text style={styles.loadingEmoji}>🐕‍🦺</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Result mode
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.resultScroll}>
        <View style={styles.resultHeader}>
          <TouchableOpacity onPress={resetScanner}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.resultTitle}>
            {scanType === 'label' ? 'Product Found' : 'Scan Results'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {imageUri && <Image source={{ uri: imageUri }} style={styles.resultImage} />}

        {/* Chester's reaction */}
        {result && (
          <ChesterReaction message={result.chesterReaction} score={result.overallScore} visible={true} />
        )}

        {/* Food items */}
        {result?.foods.map((food, i) => (
          <View key={i} style={styles.foodCard}>
            <Text style={styles.foodName}>{food.name}</Text>
            <Text style={styles.servingSize}>{food.servingSize}</Text>
            <View style={styles.macroGrid}>
              <View style={[styles.macroBox, { backgroundColor: Colors.calories + '20' }]}>
                <Text style={[styles.macroValue, { color: Colors.calories }]}>{food.calories}</Text>
                <Text style={styles.macroLabel}>cal</Text>
              </View>
              <View style={[styles.macroBox, { backgroundColor: Colors.protein + '20' }]}>
                <Text style={[styles.macroValue, { color: Colors.protein }]}>{food.protein}g</Text>
                <Text style={styles.macroLabel}>protein</Text>
              </View>
              <View style={[styles.macroBox, { backgroundColor: Colors.carbs + '20' }]}>
                <Text style={[styles.macroValue, { color: Colors.carbs }]}>{food.carbs}g</Text>
                <Text style={styles.macroLabel}>carbs</Text>
              </View>
              <View style={[styles.macroBox, { backgroundColor: Colors.fat + '20' }]}>
                <Text style={[styles.macroValue, { color: Colors.fat }]}>{food.fat}g</Text>
                <Text style={styles.macroLabel}>fat</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Action buttons */}
        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.logBtn} onPress={logFood}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.logBtnText}>Log This Meal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retryBtn} onPress={resetScanner}>
            <Ionicons name="refresh" size={20} color={Colors.primary} />
            <Text style={styles.retryBtnText}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  // Permission
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  permissionTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg },
  permissionText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.lg },
  permissionBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg },
  permissionBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  // Camera
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'space-between' },

  // Scan type tabs
  scanTabsContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm,
  },
  scanTabs: {
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BorderRadius.full, padding: 3,
  },
  scanTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: BorderRadius.full,
  },
  scanTabActive: {
    backgroundColor: Colors.primary,
  },
  scanTabText: {
    color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: FontSize.sm,
  },
  scanTabTextActive: { color: '#fff' },

  textModeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full },
  textModeBtnText: { color: '#fff', fontWeight: '600', fontSize: FontSize.sm },

  // Scan frames
  scanFrameArea: { alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 260, height: 260 },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: Colors.primary, borderWidth: 3 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
  scanHint: {
    color: '#fff', fontSize: FontSize.sm, fontWeight: '600', marginTop: Spacing.md,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4,
  },

  // Barcode frame
  barcodeFrame: {
    width: 280, height: 160, borderWidth: 2, borderColor: Colors.primary,
    borderRadius: BorderRadius.md, justifyContent: 'center', overflow: 'hidden',
  },
  barcodeLine: {
    height: 2, backgroundColor: Colors.primary, width: '100%',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 8,
  },

  // Camera controls
  cameraControls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: Spacing.xl, paddingHorizontal: Spacing.xl },
  galleryBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  captureBtn: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  captureBtnInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  labelHint: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  labelHintText: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm, fontWeight: '500' },

  // Text mode
  textContainer: { flex: 1, padding: Spacing.lg },
  textHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  textTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  textHint: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  textArea: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, fontSize: FontSize.md, minHeight: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: Colors.border, color: Colors.text },
  analyzeBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.lg },
  analyzeBtnDisabled: { opacity: 0.5 },
  analyzeBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  // Preview
  previewContainer: { flex: 1 },
  previewImage: { width: '100%', height: '60%', resizeMode: 'cover' },
  loadingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  loadingEmoji: { fontSize: 48 },
  // Results
  resultScroll: { padding: Spacing.lg, paddingBottom: 100 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  resultTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  resultImage: { width: '100%', height: 200, borderRadius: BorderRadius.lg, resizeMode: 'cover', marginBottom: Spacing.md },
  foodCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginTop: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  foodName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  servingSize: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, marginBottom: Spacing.md },
  macroGrid: { flexDirection: 'row', gap: Spacing.sm },
  macroBox: { flex: 1, alignItems: 'center', padding: Spacing.sm, borderRadius: BorderRadius.sm },
  macroValue: { fontSize: FontSize.md, fontWeight: '700' },
  macroLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  resultActions: { marginTop: Spacing.lg, gap: Spacing.md },
  logBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  logBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  retryBtn: { borderWidth: 2, borderColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  retryBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
});
