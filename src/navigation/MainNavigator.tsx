import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from 'react-native-paper';

import { AuthContext } from '../contexts/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import CameraScreen from '../screens/main/CameraScreen';
import ResultScreen from '../screens/main/ResultScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
import HistoryDetailScreen from '../screens/main/HistoryDetailScreen';
import StatsScreen from '../screens/main/StatsScreen';

// 定义堆栈导航的参数类型
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Result: { imageUri: string; solution?: any };
  HistoryDetail: { problemId: string };
};

// 定义标签导航的参数类型
export type MainTabParamList = {
  Camera: undefined;
  History: undefined;
  Stats: undefined;
};

// 定义认证导航的参数类型
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// 创建导航器
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();

/**
 * 认证导航栈
 * 处理登录和注册流程
 */
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

/**
 * 主标签导航
 * 包含相机/解题、历史记录和统计标签页
 */
const MainTabNavigator = () => {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = '';
          
          if (route.name === 'Camera') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Stats') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          }
          
          return <Icon name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.disabled,
        headerShown: true,
      })}
    >
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen} 
        options={{ title: '解题' }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{ title: '历史' }}
      />
      <Tab.Screen 
        name="Stats" 
        component={StatsScreen} 
        options={{ title: '统计' }}
      />
    </Tab.Navigator>
  );
};

/**
 * 主导航组件
 * 根据用户认证状态显示不同的导航栈
 */
const MainNavigator = () => {
  const { user, loading } = useContext(AuthContext);
  
  // 显示加载指示器
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>加载中...</Text>
      </View>
    );
  }
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen 
            name="Result" 
            component={ResultScreen}
            options={{
              headerShown: true,
              title: '解题结果',
            }}
          />
          <Stack.Screen 
            name="HistoryDetail" 
            component={HistoryDetailScreen}
            options={{
              headerShown: true,
              title: '题目详情',
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default MainNavigator; 