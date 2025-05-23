import React, { useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/MainNavigator';
import { AuthContext } from '../../contexts/AuthContext';
import { useBackHandler } from '../../hooks/useBackHandler';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginScreenProps {}

const LoginScreen: React.FC<LoginScreenProps> = () => {
  const theme = useTheme();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, error, clearError } = useContext(AuthContext);
  
  // 使用自定义返回钩子
  useBackHandler();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  
  // 表单验证
  const isFormValid = () => {
    return email.trim() !== '' && password.trim() !== '';
  };
  
  // 处理登录
  const handleLogin = async () => {
    if (!isFormValid()) {
      Alert.alert('错误', '请填写所有必填字段');
      return;
    }
    
    try {
      setLoading(true);
      await login(email, password);
    } catch (err) {
      // 错误已在上下文中处理
    } finally {
      setLoading(false);
    }
  };
  
  // 处理导航到注册页面
  const navigateToRegister = () => {
    clearError();
    try {
      navigation.navigate('Register');
    } catch (error) {
      console.error('导航错误:', error);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>数学解题助手</Text>
          <Text style={styles.subtitle}>用AI快速解决数学问题</Text>
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
          
          {error && <Text style={styles.errorText}>{error}</Text>}
          
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading || !isFormValid()}
            style={styles.loginButton}
          >
            登录
          </Button>
          
          <View style={styles.registerContainer}>
            <Text>还没有账号？</Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text style={[styles.registerText, { color: theme.colors.primary }]}>
                立即注册
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
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
  loginButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  errorText: {
    color: '#EB5757',
    marginBottom: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    marginLeft: 5,
    fontWeight: 'bold',
  },
});

export default LoginScreen; 