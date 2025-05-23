import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Platform, TextInput as RNTextInput } from 'react-native';
import { Text, Button, ActivityIndicator, useTheme, Dialog, Portal, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { useBackHandler } from '../../hooks/useBackHandler';
import { recognizeMathExpression, OCRResult, validateOCRResult } from '../../services/ocrService';
import { solveProblem } from '../../services/mathService';
import { getUserPreferences } from '../../services/userService';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

interface CameraScreenProps {}

const CameraScreen: React.FC<CameraScreenProps> = () => {
  const theme = useTheme();
  const navigation = useNavigation<CameraScreenNavigationProp>();
  
  // 使用自定义返回钩子
  useBackHandler();
  
  // 状态管理
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [showOCRConfirmation, setShowOCRConfirmation] = useState(false);
  const [manualExpression, setManualExpression] = useState('');
  const [highAccuracy, setHighAccuracy] = useState(true);
  
  // 加载用户首选项
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await getUserPreferences();
        setHighAccuracy(prefs.ocr.highAccuracyMode);
      } catch (error) {
        console.error('加载用户首选项失败:', error);
      }
    };
    
    loadPreferences();
  }, []);
  
  // 请求相机权限
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);
  
  // 从相册选择图片
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('权限错误', '需要访问相册权限来选择图片');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      Alert.alert('错误', '选择图片失败');
    }
  };
  
  // 拍照
  const takePicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('拍照失败:', error);
      Alert.alert('错误', '拍照失败');
    }
  };
  
  // 重置选择的图片
  const resetImage = () => {
    setSelectedImage(null);
    setOcrResult(null);
    setManualExpression('');
    setProcessingStep(null);
  };
  
  // 处理图片OCR识别和解析
  const handleSolve = async () => {
    if (!selectedImage) return;
    
    try {
      setLoading(true);
      
      // 步骤1: OCR识别
      setProcessingStep('ocr');
      const result = await recognizeMathExpression(selectedImage);
      setOcrResult(result);
      
      // 如果OCR失败或置信度低，显示确认对话框
      if (!result.mathExpression || result.confidence < 0.8) {
        setManualExpression(result.mathExpression || '');
        setShowOCRConfirmation(true);
        setLoading(false);
        return;
      }
      
      // 步骤2: 解析数学表达式
      await processMathExpression(result);
    } catch (error) {
      console.error('处理图片失败:', error);
      Alert.alert('错误', '处理图片失败，请重试');
      setLoading(false);
    }
  };
  
  // 处理OCR确认
  const handleOcrConfirm = async () => {
    try {
      setLoading(true);
      setShowOCRConfirmation(false);
      
      if (!ocrResult || !selectedImage) return;
      
      // 如果用户修改了表达式，验证OCR结果
      if (manualExpression !== ocrResult.mathExpression) {
        const validatedResult = await validateOCRResult(
          selectedImage,
          ocrResult,
          manualExpression
        );
        setOcrResult(validatedResult);
        
        // 处理验证后的表达式
        await processMathExpression(validatedResult);
      } else {
        // 直接使用原始OCR结果
        await processMathExpression(ocrResult);
      }
    } catch (error) {
      console.error('确认OCR失败:', error);
      Alert.alert('错误', '处理表达式失败，请重试');
      setLoading(false);
    }
  };
  
  // 处理数学表达式
  const processMathExpression = async (ocrData: OCRResult) => {
    if (!selectedImage) return;
    
    try {
      setProcessingStep('solving');
      
      // 解析并导航到结果页面
      setTimeout(() => {
        navigation.navigate('Result', { 
          imageUri: selectedImage,
          solution: {
            expression: ocrData.mathExpression
          }
        });
        
        // 重置状态
        setLoading(false);
        setProcessingStep(null);
      }, 100);
    } catch (error) {
      console.error('解析数学表达式失败:', error);
      Alert.alert('错误', '解析数学表达式失败，请重试');
      setLoading(false);
      setProcessingStep(null);
    }
  };
  
  // 显示相机权限请求状态
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.permissionText}>请求相机权限中...</Text>
      </View>
    );
  }
  
  // 显示未授权状态
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
        <Text style={styles.permissionText}>未获得相机权限</Text>
        <Text style={styles.permissionSubText}>
          请在设备设置中开启相机权限以使用此功能
        </Text>
        <Button 
          mode="contained" 
          style={styles.galleryButton}
          onPress={pickImage}
        >
          从相册选择
        </Button>
      </View>
    );
  }
  
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {selectedImage ? (
          // 显示选择的图片
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.preview} />
            
            {ocrResult && ocrResult.mathExpression && (
              <View style={styles.expressionContainer}>
                <Text style={styles.expressionLabel}>识别结果:</Text>
                <Text style={styles.expressionText}>{ocrResult.mathExpression}</Text>
                <Text style={styles.confidenceText}>
                  置信度: {Math.round(ocrResult.confidence * 100)}%
                </Text>
              </View>
            )}
            
            <View style={styles.buttonRow}>
              <Button 
                mode="outlined" 
                onPress={resetImage}
                style={[styles.resetButton, { borderColor: theme.colors.error }]}
                labelStyle={{ color: theme.colors.error }}
                disabled={loading}
              >
                重新选择
              </Button>
              
              <Button 
                mode="contained" 
                onPress={handleSolve}
                style={styles.solveButton}
                loading={loading}
                disabled={loading}
              >
                {loading ? (
                  processingStep === 'ocr' ? '识别中...' : '解析中...'
                ) : '解析数学题'}
              </Button>
            </View>
          </View>
        ) : (
          // 显示相机按钮
          <View style={styles.cameraContainer}>
            <View style={styles.cameraPlaceholder}>
              <Ionicons name="camera" size={48} color="#ccc" />
              <Text style={styles.cameraPlaceholderText}>点击下方按钮拍照</Text>
            </View>
            
            <View style={styles.actionContainer}>
              <TouchableOpacity 
                style={styles.galleryButtonContainer}
                onPress={pickImage}
              >
                <Ionicons name="images-outline" size={28} color={theme.colors.primary} />
                <Text style={styles.buttonText}>从相册选择</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              
              <View style={styles.placeholderButton} />
            </View>
          </View>
        )}
        
        {!selectedImage && (
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionTitle}>拍摄提示</Text>
            <Text style={styles.instructionText}>
              1. 将数学题目放在平整表面上
            </Text>
            <Text style={styles.instructionText}>
              2. 确保光线充足，避免阴影
            </Text>
            <Text style={styles.instructionText}>
              3. 调整距离使题目清晰且完整
            </Text>
          </View>
        )}
        
        {/* OCR结果确认对话框 */}
        <Portal>
          <Dialog
            visible={showOCRConfirmation}
            onDismiss={() => setShowOCRConfirmation(false)}
          >
            <Dialog.Title>确认数学表达式</Dialog.Title>
            <Dialog.Content>
              <Text>请确认或修改识别的数学表达式:</Text>
              <TextInput
                mode="outlined"
                value={manualExpression}
                onChangeText={setManualExpression}
                style={styles.expressionInput}
                autoCapitalize="none"
                multiline
              />
              {ocrResult && ocrResult.confidence < 0.5 && (
                <Text style={styles.lowConfidenceWarning}>
                  注意: 识别置信度较低，请仔细检查表达式
                </Text>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowOCRConfirmation(false)}>取消</Button>
              <Button onPress={handleOcrConfirm}>确认</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 3/4,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 16,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },
  camera: {
    flex: 1,
  },
  cameraButtonsContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
    backgroundColor: '#fff',
  },
  galleryButtonContainer: {
    alignItems: 'center',
  },
  galleryButton: {
    marginTop: 16,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    borderWidth: 5,
    borderColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#4A90E2',
  },
  placeholderButton: {
    width: 44,
    height: 44,
  },
  buttonText: {
    marginTop: 4,
    fontSize: 12,
  },
  previewContainer: {
    width: '100%',
    alignItems: 'center',
  },
  preview: {
    width: '100%',
    aspectRatio: 3/4,
    borderRadius: 12,
    marginBottom: 16,
  },
  expressionContainer: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  expressionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  expressionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 12,
    color: '#888',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  resetButton: {
    flex: 1,
    marginRight: 8,
  },
  solveButton: {
    flex: 2,
    marginLeft: 8,
  },
  instructionContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 30,
  },
  expressionInput: {
    marginTop: 12,
    marginBottom: 8,
  },
  lowConfidenceWarning: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
  },
});

export default CameraScreen; 