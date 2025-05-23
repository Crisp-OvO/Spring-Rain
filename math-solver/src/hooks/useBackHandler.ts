import { useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';

/**
 * 自定义钩子处理硬件返回按钮
 * @param callback 可选的返回按钮回调函数
 */
export const useBackHandler = (callback?: () => boolean) => {
  const navigation = useNavigation();
  
  useEffect(() => {
    const handleBackPress = () => {
      console.log('Back button pressed');
      
      // 如果有自定义回调并且返回true，则让回调处理返回事件
      if (callback && callback()) {
        console.log('Custom callback handled back button');
        return true;
      }
      
      // 检查navigation是否有效
      if (!navigation) {
        console.error('Navigation object is undefined');
        return false;
      }
      
      try {
        // 尝试安全地检查是否可以返回
        if (typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
          console.log('Navigation can go back, attempting to navigate back');
          
          try {
            // 优先使用goBack
            if (typeof navigation.goBack === 'function') {
              navigation.goBack();
              return true;
            }
            
            // 备选方案：使用dispatch和CommonActions
            if (typeof navigation.dispatch === 'function') {
              navigation.dispatch(CommonActions.goBack());
              return true;
            }
          } catch (error) {
            console.error('Error during navigation back:', error);
          }
        } else {
          console.log('Navigation cannot go back or canGoBack is not a function');
        }
      } catch (error) {
        console.error('Error checking if navigation can go back:', error);
      }
      
      // 返回false让系统处理返回
      return false;
    };
    
    // 添加回调
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );
    
    console.log('Back handler attached');
    
    // 清理
    return () => {
      console.log('Back handler detached');
      backHandler.remove();
    };
  }, [navigation, callback]);
}; 