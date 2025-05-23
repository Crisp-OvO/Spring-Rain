import { registerRootComponent } from 'expo';
import 'react-native-gesture-handler';  // 确保在任何组件导入之前导入这个
import App from './App';

// 注册应用程序的根组件
registerRootComponent(App); 