/**
 * 应用配置常量
 */

// API配置
export const API_URL = __DEV__ 
  ? 'http://10.233.15.100:3001'  // 电脑IP地址，手机可访问
  : 'https://your-production-api.com';

// 阿里云通义千问API配置
export const QWEN_API = {
  KEY: process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY || '',
  BASE_URL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc',
  COMPATIBLE_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  
  // 数学推理模型配置
  MATH_MODEL: {
    NAME: 'qwen-plus-2025-04-28',
    MAX_TOKENS: 16384,
    TEMPERATURE: 0.1,
  },
  
  // OCR识别模型配置
  OCR_MODEL: {
    NAME: 'qwen-vl-max',
    MAX_TOKENS: 8192,
  },
  
  // 请求配置
  TIMEOUT: 30000,
  RETRY_TIMES: 3,
};

// 应用配置
export const APP_CONFIG = {
  VERSION: '2.0.0',
  BUILD_NUMBER: 1,
  
  // 功能开关
  FEATURES: {
    USE_MOCK_DATA: __DEV__ && false, // 开发环境可开启模拟数据
    ENABLE_OCR: true,
    ENABLE_CLOUD_SYNC: true,
    ENABLE_OFFLINE_MODE: true,
  },
  
  // 缓存配置
  CACHE: {
    TTL: 24 * 60 * 60 * 1000, // 24小时
    MAX_SIZE: 100, // 最大缓存条目数
  },
  
  // 图片处理配置
  IMAGE: {
    MAX_WIDTH: 2000,
    MAX_HEIGHT: 2000,
    QUALITY: 0.8,
    FORMAT: 'JPEG',
  },
};

// API路径
export const API_PATHS = {
  OCR: '/ocr/math',
  SOLVE: '/math/solve',
  HISTORY: '/history',
  UPLOAD: '/upload',
  USER_PROFILE: '/user/profile',
  HEALTH: '/health',
};

// 错误码定义
export const ERROR_CODES = {
  NETWORK_ERROR: '网络错误',
  API_ERROR: 'API错误',
  OCR_FAILED: 'OCR识别失败',
  SOLVE_FAILED: '解题失败',
  UPLOAD_FAILED: '上传失败',
  AUTH_FAILED: '认证失败',
};

// 数学问题类型
export const PROBLEM_TYPES = {
  ALGEBRA: 'algebra',
  CALCULUS: 'calculus',
  EQUATION: 'equation',
  ARITHMETIC: 'arithmetic',
  INEQUALITY: 'inequality',
  GEOMETRY: 'geometry',
  OTHER: 'other',
};

// 数学问题类型中文标签
export const PROBLEM_TYPE_LABELS = {
  algebra: '代数',
  calculus: '微积分',
  equation: '方程',
  arithmetic: '算术',
  inequality: '不等式',
  geometry: '几何',
  other: '其他',
};

// 解题方法
export const SOLVE_METHODS = {
  COT: 'cot', // Chain of Thought
  TIR: 'tir', // Tool-integrated Reasoning
  THINKING: 'thinking', // Deep Thinking
};

// 难度级别中文标签
export const DIFFICULTY_LABELS = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

// 解题方法中文标签
export const SOLVE_METHOD_LABELS = {
  cot: '逐步推理',
  tir: '工具集成推理',
  thinking: '深度思考',
}; 