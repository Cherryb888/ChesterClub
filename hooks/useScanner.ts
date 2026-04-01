import { useState, useRef } from 'react';
import { Alert, Animated } from 'react-native';
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { analyzeFoodImage, analyzeTextFood } from '../services/gemini';
import { lookupBarcode } from '../services/openfoodfacts';
import { addFoodToLog, feedChester, addRecentFood, getTodayKey } from '../services/storage';
import { FoodItem, GeminiFoodResult } from '../types';

export type ScanMode = 'camera' | 'preview' | 'result' | 'text';
export type ScanType = 'meal' | 'label';

export function useScanner() {
  const [mode, setMode] = useState<ScanMode>('camera');
  const [scanType, setScanType] = useState<ScanType>('meal');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeminiFoodResult | null>(null);
  const [textInput, setTextInput] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const tabIndicator = useRef(new Animated.Value(0)).current;

  const switchScanType = (type: ScanType) => {
    setScanType(type);
    setScannedBarcode(null);
    Animated.spring(tabIndicator, { toValue: type === 'meal' ? 0 : 1, useNativeDriver: true }).start();
  };

  const analyzeImage = async (base64: string) => {
    setLoading(true);
    try {
      const foodResult = await analyzeFoodImage(base64);
      setResult(foodResult);
      setMode('result');
    } catch (error: any) {
      Alert.alert('Scan Failed', "Chester couldn't identify that food. Try again with a clearer photo!\n\n" + error.message);
      setMode('camera');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
    if (photo?.base64) {
      setImageUri(photo.uri);
      setMode('preview');
      analyzeImage(photo.base64);
    }
  };

  const pickImage = async () => {
    const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (!pickerResult.canceled && pickerResult.assets[0]?.base64) {
      setImageUri(pickerResult.assets[0].uri);
      setMode('preview');
      analyzeImage(pickerResult.assets[0].base64);
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
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
          [{ text: 'Switch to Meal', onPress: () => switchScanType('meal') }, { text: 'Try Again', onPress: () => setScannedBarcode(null) }],
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
      Alert.alert('Error', "Chester couldn't find that food. Try describing it differently!\n\n" + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getMealType = (): FoodItem['mealType'] => {
    const hour = new Date().getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 20) return 'dinner';
    return 'snack';
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
    Alert.alert('Logged!', `Chester tracked ${result.foods.length} item(s)! 🐕`, [{ text: 'OK', onPress: resetScanner }]);
  };

  const resetScanner = () => {
    setMode('camera');
    setImageUri(null);
    setResult(null);
    setTextInput('');
    setScannedBarcode(null);
  };

  return {
    mode, setMode,
    scanType,
    imageUri,
    loading,
    result,
    textInput, setTextInput,
    scannedBarcode,
    cameraRef,
    tabIndicator,
    switchScanType,
    takePhoto,
    pickImage,
    handleBarcodeScanned,
    analyzeText,
    logFood,
    resetScanner,
  };
}
