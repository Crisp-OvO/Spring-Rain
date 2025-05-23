import React, { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import MainNavigator from './src/navigation/MainNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { theme } from './src/styles/theme';
import { View, Text, LogBox } from 'react-native';

// 忽略部分黄色警告
LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered.',
  'Non-serializable values were found in the navigation state',
]);

/**
 * 应用程序主入口组件
 * 提供全局上下文和主题
 */
export default function App() {
  // 导航容器引用
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  
  // 在应用加载时预加载资源
  useEffect(() => {
    // 可以在这里添加资源预加载代码
  }, []);
  
  // 导航状态发生变化
  const onNavigationStateChange = (state: any) => {
    // 可以在这里添加导航状态监控
    console.log('Navigation state changed:', state ? 'New state available' : 'No state');
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <NavigationContainer
            ref={navigationRef}
            fallback={<View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text>加载中...</Text></View>}
            onReady={() => {
              console.log('Navigation container is ready');
            }}
            onStateChange={onNavigationStateChange}
          >
            <MainNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
