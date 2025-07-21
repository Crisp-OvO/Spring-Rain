import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';

// 导入屏幕组件
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SolveScreen from '../screens/SolveScreen';
import ResultScreen from '../screens/ResultScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 主Tab导航
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Camera') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: '首页' }}
      />
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{ title: '拍照解题' }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ title: '历史记录' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: '设置' }}
      />
    </Tab.Navigator>
  );
}

// 主Stack导航
export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Main">
      <Stack.Screen 
        name="Main" 
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Solve" 
        component={SolveScreen}
        options={{ 
          title: '数学解题', 
          headerBackTitle: '返回',
          headerTitleStyle: { color: '#1f2937' },
          headerStyle: { backgroundColor: 'white' },
        }}
      />
      <Stack.Screen 
        name="Result" 
        component={ResultScreen}
        options={{ 
          title: '解题结果', 
          headerBackTitle: '返回',
          headerTitleStyle: { color: '#1f2937' },
          headerStyle: { backgroundColor: 'white' },
        }}
      />
    </Stack.Navigator>
  );
} 