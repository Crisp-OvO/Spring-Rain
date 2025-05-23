import React, { useState, useContext } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/MainNavigator';
import { AuthContext } from '../../contexts/AuthContext';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

/**
 * 登录屏幕
 * 允许用户使用邮箱和密码登录
 */
const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { login, error, clearError } = useContext(AuthContext);
  
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
    navigation.navigate('Register');
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>数学解题助手</Text>
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
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
    color: 'red',
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