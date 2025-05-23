import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import MainNavigator from './src/navigation/MainNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { theme } from './src/styles/theme';

/**
 * 应用程序主入口组件
 * 提供全局上下文和主题
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <NavigationContainer>
            <MainNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
