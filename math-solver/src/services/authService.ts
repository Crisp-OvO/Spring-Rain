import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../contexts/AuthContext';

// 存储用户信息的 AsyncStorage 键名
const USER_STORAGE_KEY = 'math_solver_user';
const USERS_STORAGE_KEY = 'math_solver_users';

/**
 * 用户登录 - 模拟API调用
 * @param email 用户邮箱
 * @param password 用户密码
 * @returns Promise<User> 包含用户数据的Promise
 */
export const apiLogin = async (email: string, password: string): Promise<User> => {
  // 添加延迟模拟网络请求
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // 获取已注册用户列表
    const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    const users = usersJson ? JSON.parse(usersJson) : {};
    
    // 检查用户是否存在且密码是否匹配
    if (!users[email]) {
      throw new Error('用户不存在');
    }
    
    if (users[email].password !== password) {
      throw new Error('密码错误');
    }
    
    // 创建用户信息对象（不包含密码）
    const user: User = {
      id: users[email].id,
      email: email,
      token: `token_${Date.now()}`
    };
    
    // 存储当前登录用户信息
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    
    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('登录失败');
  }
};

/**
 * 用户注册 - 模拟API调用
 * @param email 用户邮箱
 * @param password 用户密码
 * @returns Promise<User> 包含用户数据的Promise
 */
export const apiRegister = async (email: string, password: string): Promise<User> => {
  // 添加延迟模拟网络请求
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  try {
    // 获取已注册用户列表
    const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    const users = usersJson ? JSON.parse(usersJson) : {};
    
    // 检查邮箱是否已被注册
    if (users[email]) {
      throw new Error('该邮箱已被注册');
    }
    
    // 生成随机用户ID
    const userId = `user_${Date.now()}`;
    
    // 存储新用户信息（包含密码）
    users[email] = {
      id: userId,
      password: password,
      createdAt: new Date().toISOString()
    };
    
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // 创建用户信息对象（不包含密码）
    const user: User = {
      id: userId,
      email: email,
      token: `token_${Date.now()}`
    };
    
    // 存储当前登录用户信息
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    
    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('注册失败');
  }
};

/**
 * 检查用户是否已登录
 * @returns Promise<User | null> 若已登录则返回用户信息，否则返回null
 */
export const checkAuth = async (): Promise<User | null> => {
  try {
    const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('检查登录状态失败:', error);
    return null;
  }
};

/**
 * 用户登出
 */
export const logout = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error('登出失败:', error);
  }
}; 