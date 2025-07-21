/**
 * 存储服务
 */

// 绕过类型检查
// @ts-ignore
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

/**
 * 获取存储项
 * @param key 存储键
 * @returns 存储值或null
 */
export const getItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error(`存储读取失败 (${key}):`, error);
    return null;
  }
};

/**
 * 设置存储项
 * @param key 存储键
 * @param value 存储值
 */
export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error(`存储写入失败 (${key}):`, error);
    throw error;
  }
};

/**
 * 删除存储项
 * @param key 存储键
 */
export const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`存储删除失败 (${key}):`, error);
    throw error;
  }
};

/**
 * 清空存储
 */
export const clear = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('存储清空失败:', error);
    throw error;
  }
}; 