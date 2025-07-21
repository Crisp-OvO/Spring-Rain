import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';

import { RootState } from '../store';
import { setLoading, setOcrResult, setError } from '../store/slices/mathSlice';
import { navigate } from '../navigation/RootNavigation';
import { recognizeMathExpression } from '../services/ocrService';
import { API_URL, API_PATHS } from '../constants/config';

const { width, height } = Dimensions.get('window');

const CameraScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.math);
  const { apiConfig } = useSelector((state: RootState) => state.settings);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [manualExpression, setManualExpression] = useState<string>('');
  const [showOCRConfirmation, setShowOCRConfirmation] = useState(false);

  // 打开图片选择器
  const selectImageFromLibrary = useCallback(() => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: true,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setSelectedImage(asset.uri || null);
        
        // 自动进行OCR识别
        if (asset.uri) {
          processOCR(asset.uri);
        }
      }
    });
  }, []);

  // 处理OCR识别
  const processOCR = useCallback(async (imageUri: string) => {
    if (!imageUri) return;

    setOcrProcessing(true);
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      console.log('开始OCR识别，图片路径:', imageUri);
      const result = await recognizeMathExpression(imageUri);
      console.log('OCR识别结果:', result);
      
      if (result.error) {
        throw new Error(result.error);
      }

      dispatch(setOcrResult(result));
      
      // 如果识别成功且置信度较高，直接跳转到解题页面
      if (result.mathExpression && result.confidence > 0.8) {
        navigate('Solve', { 
          expression: result.mathExpression,
          imageUri: selectedImage,
          ocrResult: result 
        });
      } else if (result.mathExpression) {
        // 置信度较低，显示确认对话框
        setManualExpression(result.mathExpression);
        setShowOCRConfirmation(true);
      } else {
        Alert.alert('识别结果', '未识别到数学表达式，请重新拍照或手动输入');
      }
    } catch (error: any) {
      console.error('OCR识别失败:', error);
      dispatch(setError(error.message || 'OCR识别失败'));
      Alert.alert(
        '识别失败',
        error.message || '图片识别失败，请重试或手动输入数学表达式',
        [
          { text: '重试', onPress: () => setSelectedImage(null) },
          { text: '手动输入', onPress: () => navigate('Solve') },
        ]
      );
    } finally {
      setOcrProcessing(false);
      dispatch(setLoading(false));
    }
  }, [dispatch, selectedImage]);

  // 上传图片到服务器
  const handleUpload = useCallback(async () => {
    if (!selectedImage) {
      Alert.alert('错误', '请先选择图片');
      return;
    }

    try {
      setOcrProcessing(true);
      
      const formData = new FormData();
      const file = {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'math_problem.jpg'
      } as any;
      
      formData.append('image', file);

      console.log('开始上传图片到服务器...');
      const response = await fetch(`${API_URL}${API_PATHS.UPLOAD}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`上传失败: HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('图片上传成功:', result);
      
      Alert.alert('成功', '图片已上传到服务器', [
        { text: '继续解题', onPress: () => processOCR(selectedImage) },
        { text: '重新选择', onPress: () => setSelectedImage(null) },
      ]);
    } catch (error: any) {
      console.error('图片上传失败:', error);
      Alert.alert('上传失败', error.message || '图片上传失败，请重试');
    } finally {
      setOcrProcessing(false);
    }
  }, [selectedImage, processOCR]);

  // 解题处理函数
  const handleSolve = useCallback(async () => {
    if (!selectedImage) {
      navigate('Solve');
      return;
    }

    try {
      setOcrProcessing(true);
      dispatch(setLoading(true));

      // 步骤1: OCR识别
      console.log('开始OCR识别...');
      const result = await recognizeMathExpression(selectedImage);
      dispatch(setOcrResult(result));

      // 如果OCR失败或置信度低，显示确认对话框
      if (!result.mathExpression || result.confidence < 0.8) {
        setManualExpression(result.mathExpression || '');
        setShowOCRConfirmation(true);
        return;
      }

      // 步骤2: 跳转到解题页面
      navigate('Solve', {
        expression: result.mathExpression,
        imageUri: selectedImage,
        ocrResult: result
      });
    } catch (error: any) {
      console.error('处理图片失败:', error);
      Alert.alert('错误', '处理图片失败，请重试');
    } finally {
      setOcrProcessing(false);
      dispatch(setLoading(false));
    }
  }, [selectedImage, dispatch]);

  // 重新选择图片
  const resetImage = useCallback(() => {
    setSelectedImage(null);
    setShowOCRConfirmation(false);
    setManualExpression('');
    dispatch(setError(null));
  }, [dispatch]);

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.title}>拍照解题</Text>
        <Text style={styles.subtitle}>使用Qwen-VL识别数学题目</Text>
      </View>

      {/* 主要内容区域 */}
      <View style={styles.content}>
        {selectedImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            
            {ocrProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.processingText}>正在处理中...</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Icon name="camera-outline" size={80} color="#cbd5e1" />
            <Text style={styles.placeholderText}>选择图片开始识别</Text>
            <Text style={styles.placeholderSubtext}>
              支持拍照或从相册选择数学题目图片
            </Text>
          </View>
        )}
      </View>

      {/* 底部操作按钮 */}
      <View style={styles.bottomActions}>
        {selectedImage ? (
          <View style={styles.actionColumn}>
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={resetImage}
                disabled={ocrProcessing}
              >
                <Icon name="refresh" size={20} color="#6366f1" />
                <Text style={styles.secondaryButtonText}>重新选择</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleSolve}
                disabled={ocrProcessing}
              >
                <Icon name="calculator" size={20} color="white" />
                <Text style={styles.primaryButtonText}>开始解题</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.uploadButton]}
                onPress={handleUpload}
                disabled={ocrProcessing}
              >
                <Icon name="cloud-upload" size={20} color="white" />
                <Text style={styles.uploadButtonText}>上传到服务器</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.manualButton]}
                onPress={() => navigate('Solve')}
                disabled={ocrProcessing}
              >
                <Icon name="create" size={20} color="#10b981" />
                <Text style={styles.manualButtonText}>手动输入</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton, { flex: 1 }]}
              onPress={selectImageFromLibrary}
              disabled={isLoading}
            >
              <Icon name="images" size={20} color="white" />
              <Text style={styles.primaryButtonText}>选择图片</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 功能提示 */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>使用提示：</Text>
        <Text style={styles.tipText}>• 确保图片清晰，光线充足</Text>
        <Text style={styles.tipText}>• 数学公式完整，没有遮挡</Text>
        <Text style={styles.tipText}>• 支持手写和印刷体数学题目</Text>
        <Text style={styles.tipText}>• 支持LaTeX格式的复杂公式</Text>
        <Text style={styles.tipText}>• 可上传图片到服务器进行保存</Text>
      </View>

      {/* 错误信息 */}
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={16} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 16,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bottomActions: {
    padding: 20,
  },
  actionColumn: {
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  uploadButton: {
    backgroundColor: '#059669',
  },
  manualButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  manualButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});

export default CameraScreen; 