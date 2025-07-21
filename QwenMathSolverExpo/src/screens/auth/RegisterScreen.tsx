import React, { useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/MainNavigator';
import { AuthContext } from '../../contexts/AuthContext';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

/**
 * 注册屏幕
 * 允许新用户创建账号
 */
const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { register, error, clearError } = useContext(AuthContext);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  const [passwordError, setPasswordError] = useState('');
  
  // 表单验证
  const validateForm = () => {
    // 重置错误
    setPasswordError('');
    
    // 检查所有字段已填写
    if (email.trim() === '' || password.trim() === '' || confirmPassword.trim() === '') {
      Alert.alert('错误', '请填写所有必填字段');
      return false;
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('错误', '请输入有效的邮箱地址');
      return false;
    }
    
    // 验证密码长度
    if (password.length < 6) {
      setPasswordError('密码必须至少包含6个字符');
      return false;
    }
    
    // 验证密码匹配
    if (password !== confirmPassword) {
      setPasswordError('两次输入的密码不匹配');
      return false;
    }
    
    return true;
  };
  
  // 处理注册
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      await register(email, password);
    } catch (err) {
      // 错误已在上下文中处理
    } finally {
      setLoading(false);
    }
  };
  
  // 处理导航到登录页面
  const navigateToLogin = () => {
    clearError();
    navigation.navigate('Login');
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>创建账号</Text>
          <Text style={styles.subtitle}>注册以使用数学解题助手</Text>
        </View>
        
        <View style={styles.formContainer}>
          <TextInput
            label="邮箱"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
          />
          
          <TextInput
            label="密码"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            style={styles.input}
            mode="outlined"
            right={
              <TextInput.Icon
                icon={secureTextEntry ? 'eye-off' : 'eye'}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              />
            }
          />
          
          <TextInput
            label="确认密码"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={secureConfirmTextEntry}
            style={styles.input}
            mode="outlined"
            right={
              <TextInput.Icon
                icon={secureConfirmTextEntry ? 'eye-off' : 'eye'}
                onPress={() => setSecureConfirmTextEntry(!secureConfirmTextEntry)}
              />
            }
          />
          
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          {error && <Text style={styles.errorText}>{error}</Text>}
          
          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.registerButton}
          >
            注册
          </Button>
          
          <View style={styles.loginContainer}>
            <Text>已有账号？</Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={[styles.loginText, { color: theme.colors.primary }]}>
                立即登录
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  registerButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    marginLeft: 5,
    fontWeight: 'bold',
  },
});

export default RegisterScreen; 