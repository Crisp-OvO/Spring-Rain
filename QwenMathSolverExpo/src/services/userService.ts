import { post, get, put } from './apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockUserPreferences, mockUserProfile, mockStatistics } from '../mocks/mockData';
import { API_URL } from '../constants/config';

// 存储键
const USER_PREFERENCES_KEY = 'math_solver_preferences';
const SYNC_STATUS_KEY = 'math_solver_sync_status';
const USE_MOCK_DATA = false; // 在开发阶段使用模拟数据

/**
 * 用户首选项接口
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';    // 应用主题
  notificationsEnabled: boolean;         // 是否启用通知
  syncEnabled: boolean;                  // 是否启用云同步
  ocr: {
    autoCorrect: boolean;                // 是否自动校正OCR结果
    highAccuracyMode: boolean;           // 是否使用高精度模式
  };
  solver: {
    showSteps: boolean;                  // 是否显示解题步骤
    detailedExplanation: boolean;        // 是否显示详细解释
    mathFormat: 'normal' | 'latex';      // 数学公式格式
  };
  privacy: {
    shareData: boolean;                  // 是否分享数据用于改进服务
    saveHistory: boolean;                // 是否保存历史记录
  };
}

/**
 * 同步状态接口
 */
export interface SyncStatus {
  lastSyncTime: string;                  // 最后同步时间
  pendingUploads: number;                // 待上传数量
  pendingDownloads: number;              // 待下载数量
  syncInProgress: boolean;               // 是否正在同步
  error?: string;                        // 同步错误信息
}

/**
 * 用户配置文件接口
 */
export interface UserProfile {
  id: string;                            // 用户ID
  email: string;                         // 用户邮箱
  name?: string;                         // 用户名称
  avatar?: string;                       // 头像URL
  createdAt: string;                     // 创建时间
  lastLoginAt: string;                   // 最后登录时间
  subscription?: {                       // 订阅信息
    type: 'free' | 'premium' | 'edu';    // 订阅类型
    expiresAt?: string;                  // 过期时间
  };
  stats?: {                              // 用户统计
    solvedProblems: number;              // 已解决问题数
    masteredConcepts: number;            // 已掌握概念数
    streak: number;                      // 连续使用天数
  };
}

/**
 * 获取默认用户首选项
 * 
 * @returns 默认首选项
 */
export const getDefaultPreferences = (): UserPreferences => {
  return {
    theme: 'system',
    notificationsEnabled: true,
    syncEnabled: true,
    ocr: {
      autoCorrect: true,
      highAccuracyMode: true
    },
    solver: {
      showSteps: true,
      detailedExplanation: true,
      mathFormat: 'normal'
    },
    privacy: {
      shareData: true,
      saveHistory: true
    }
  };
};

/**
 * 获取用户首选项
 * 
 * @returns 用户首选项
 */
export const getUserPreferences = async (): Promise<UserPreferences> => {
  // 如果设置了使用模拟数据，直接返回模拟数据
  if (USE_MOCK_DATA) {
    console.log('使用模拟数据: 用户首选项');
    // 仍然存储到本地，以便其他功能使用
    await AsyncStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(mockUserPreferences));
    return mockUserPreferences;
  }

  try {
    // 从本地获取
    const prefsJson = await AsyncStorage.getItem(USER_PREFERENCES_KEY);
    if (prefsJson) {
      return JSON.parse(prefsJson);
    }
    
    // 如果没有保存的首选项，返回默认值
    return getDefaultPreferences();
  } catch (error) {
    console.error('获取用户首选项失败:', error);
    return getDefaultPreferences();
  }
};

/**
 * 更新用户首选项
 * 
 * @param preferences 要更新的首选项
 * @returns 更新后的首选项
 */
export const updateUserPreferences = async (
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> => {
  try {
    // 获取当前首选项
    const currentPrefs = await getUserPreferences();
    
    // 合并新首选项
    const newPrefs = { ...currentPrefs, ...preferences };
    
    // 保存到本地
    await AsyncStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(newPrefs));
    
    console.log('首选项已更新（本地模式）');
    return newPrefs;
  } catch (error) {
    console.error('更新用户首选项失败:', error);
    throw error;
  }
};

/**
 * 获取用户个人资料
 * 
 * @returns 用户个人资料
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  if (USE_MOCK_DATA) {
    console.log('使用模拟数据: 用户资料');
    return mockUserProfile;
  }
  
  try {
    // 实际项目中这里应该调用API获取用户资料
    return null;
  } catch (error) {
    console.error('获取用户个人资料失败:', error);
    return null;
  }
};

/**
 * 更新用户个人资料
 * 
 * @param profile 要更新的个人资料
 * @returns 更新后的个人资料
 */
export const updateUserProfile = async (
  profile: Partial<UserProfile>
): Promise<UserProfile | null> => {
  if (USE_MOCK_DATA) {
    console.log('使用模拟数据: 更新用户资料');
    // 模拟更新
    return { ...mockUserProfile, ...profile };
  }
  
  try {
    // 实际项目中这里应该调用API更新用户资料
    return null;
  } catch (error) {
    console.error('更新用户个人资料失败:', error);
    return null;
  }
};

/**
 * 同步用户数据
 * 
 * 将本地数据同步到云端，并从云端下载最新数据
 * 
 * @returns 同步状态
 */
export const syncUserData = async (): Promise<SyncStatus> => {
  if (USE_MOCK_DATA) {
    console.log('使用模拟数据: 同步用户数据');
    // 模拟同步成功
    const syncStatus: SyncStatus = {
      lastSyncTime: new Date().toISOString(),
      pendingUploads: 0,
      pendingDownloads: 0,
      syncInProgress: false
    };
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncStatus));
    return syncStatus;
  }
  
  try {
    // 设置同步状态为进行中
    const syncStatus: SyncStatus = {
      lastSyncTime: new Date().toISOString(),
      pendingUploads: 0,
      pendingDownloads: 0,
      syncInProgress: true
    };
    
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncStatus));
    
    // 模拟同步操作延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 更新同步状态
    const newStatus: SyncStatus = {
      lastSyncTime: new Date().toISOString(),
      pendingUploads: 0,
      pendingDownloads: 0,
      syncInProgress: false
    };
    
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(newStatus));
    return newStatus;
  } catch (error) {
    console.error('同步用户数据失败:', error);
    
    // 更新同步状态为错误
    const errorStatus: SyncStatus = {
      lastSyncTime: new Date().toISOString(),
      pendingUploads: 0,
      pendingDownloads: 0,
      syncInProgress: false,
      error: error instanceof Error ? error.message : '同步失败'
    };
    
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(errorStatus));
    return errorStatus;
  }
};

/**
 * 获取同步状态
 * 
 * @returns 当前同步状态
 */
export const getSyncStatus = async (): Promise<SyncStatus | null> => {
  try {
    const statusJson = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    return statusJson ? JSON.parse(statusJson) : null;
  } catch (error) {
    console.error('获取同步状态失败:', error);
    return null;
  }
}; 