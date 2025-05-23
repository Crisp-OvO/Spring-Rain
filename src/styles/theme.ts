import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

/**
 * 应用全局主题配置
 * 定义了应用中使用的主色调、辅助色和文本颜色等
 */
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4A90E2',
    secondary: '#6FCF97',
    error: '#EB5757',
    success: '#27AE60',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    text: '#333333',
    disabled: '#BDBDBD',
    placeholder: '#757575',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#FF5252',
  },
  roundness: 8,
  fonts: {
    ...DefaultTheme.fonts,
  },
}; 