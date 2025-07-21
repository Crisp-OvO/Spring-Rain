import { MONGODB_CONFIG } from '../constants/config';

/**
 * MongoDB数据库集合名称
 */
export const COLLECTIONS = {
  USERS: 'users',
  HISTORY: 'history',
  PREFERENCES: 'preferences',
  STATISTICS: 'statistics'
};

/**
 * MongoDB连接配置
 */
export const MONGODB_CONNECTION = {
  url: MONGODB_CONFIG.CONNECTION_STRING,
  dbName: MONGODB_CONFIG.DB_NAME,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
};

/**
 * MongoDB数据库结构定义
 */
export interface MongoDBSchema {
  users: {
    _id: string;
    email: string;
    name?: string;
    passwordHash: string;
    createdAt: Date;
    lastLogin: Date;
    avatar?: string;
    subscription?: {
      type: 'free' | 'premium' | 'edu';
      expiresAt: Date;
    }
  };
  
  history: {
    _id: string;
    userId: string;
    expression: string;
    steps: string[];
    result: string;
    timestamp: Date;
    type?: string;
    difficulty?: string;
    mastered: boolean;
    imageUri?: string;
    latex?: string;
  };
  
  preferences: {
    _id: string;
    userId: string;
    theme: 'light' | 'dark' | 'system';
    notificationsEnabled: boolean;
    syncEnabled: boolean;
    ocr: {
      autoCorrect: boolean;
      highAccuracyMode: boolean;
    };
    solver: {
      showSteps: boolean;
      detailedExplanation: boolean;
      mathFormat: 'normal' | 'latex';
    };
    privacy: {
      shareData: boolean;
      saveHistory: boolean;
    };
    lastUpdated: Date;
  };
  
  statistics: {
    _id: string;
    userId: string;
    totalProblems: number;
    masteredProblems: number;
    typeDistribution: Record<string, number>;
    difficultyDistribution: Record<string, number>;
    weeklyActivity: Record<string, number>;
    lastUpdated: Date;
  };
}

/**
 * 后端服务API路径
 */
export const API_PATHS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
  },
  USER: {
    PROFILE: '/user/profile',
    PREFERENCES: '/user/preferences',
    HISTORY: '/user/history',
    STATISTICS: '/user/statistics',
    SYNC: '/user/sync',
  },
  OCR: {
    RECOGNIZE: '/ocr/math',
    VALIDATE: '/ocr/validate',
  },
  MATH: {
    SOLVE: '/math/solve',
    LATEX: '/math/latex',
  },
}; 