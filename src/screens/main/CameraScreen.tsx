import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Platform } from 'react-native';
import { Text, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/MainNavigator';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

interface CameraScreenProps {
  navigation: CameraScreenNavigationProp;
}

/**
 * 相机屏幕
 * 允许用户拍照或从相册选择数学题目图片
 */
const CameraScreen: React.FC<CameraScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const cameraRef = useRef<Camera>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.back);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 请求相机权限
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
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
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        setSelectedImage(photo.uri);
      } catch (error) {
        console.error('拍照失败:', error);
        Alert.alert('错误', '拍照失败');
      }
    }
  };
  
  // 重置选择的图片
  const resetImage = () => {
    setSelectedImage(null);
  };
  
  // 处理图片解析
  const handleSolve = () => {
    if (selectedImage) {
      setLoading(true);
      // 跳转到结果页面
      navigation.navigate('Result', { imageUri: selectedImage });
      // 重置状态
      setLoading(false);
    }
  };
  
  // 切换相机类型（前置/后置）
  const toggleCameraType = () => {
    setType(current => (current === CameraType.back ? CameraType.front : CameraType.back));
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
        <Ionicons name="camera-off-outline" size={64} color={theme.colors.error} />
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
            
            <View style={styles.buttonRow}>
              <Button 
                mode="outlined" 
                onPress={resetImage}
                style={[styles.resetButton, { borderColor: theme.colors.error }]}
                labelStyle={{ color: theme.colors.error }}
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
                解析数学题
              </Button>
            </View>
          </View>
        ) : (
          // 显示相机
          <View style={styles.cameraContainer}>
            <Camera
              ref={cameraRef}
              style={styles.camera}
              type={type}
              ratio="4:3"
            >
              <View style={styles.cameraButtonsContainer}>
                <TouchableOpacity 
                  style={styles.flipButton}
                  onPress={toggleCameraType}
                >
                  <Ionicons name="camera-reverse-outline" size={28} color="white" />
                </TouchableOpacity>
              </View>
            </Camera>
            
            <View style={styles.actionContainer}>
              <TouchableOpacity 
                style={styles.galleryButton}
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
  galleryButton: {
    alignItems: 'center',
    marginTop: 10,
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
});

export default CameraScreen; 