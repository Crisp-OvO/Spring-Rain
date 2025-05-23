// 添加类型声明
declare module '@react-native-async-storage/async-storage' {
  export default {
    getItem: (key: string) => Promise<string | null>,
    setItem: (key: string, value: string) => Promise<void>,
    removeItem: (key: string) => Promise<void>,
    clear: () => Promise<void>,
    getAllKeys: () => Promise<string[]>,
    multiGet: (keys: string[]) => Promise<[string, string | null][]>,
    multiSet: (keyValuePairs: [string, string][]) => Promise<void>,
    multiRemove: (keys: string[]) => Promise<void>,
  };
}

// 使用require代替import解决类型问题
// @ts-ignore
const AsyncStorage = require('@react-native-async-storage/async-storage').default;
import { OCRResult } from './ocrService';
import * as backendService from './backendService';
import * as storage from './storage';
import { API_PATHS } from './dbService';
import { mockHistory, mockMathSolution } from '../mocks/mockData';
import { API_URL } from '../constants/config';

// 存储键
const HISTORY_STORAGE_KEY = 'math_solver_history';
const USE_MOCK_DATA = false; // 在开发阶段使用模拟数据

// 问题类型标签
export type ProblemType = 'equation' | 'formula' | 'arithmetic' | 'other' | null;

// 难度标签
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | null;

// 标签更新参数
export interface TagUpdateParams {
  type?: ProblemType;
  difficulty?: DifficultyLevel;
  mastered?: boolean;
}

// 解题步骤
export interface SolutionStep {
  description: string;
  formula?: string;
}

// 解题结果
export interface ProblemSolution {
  id: string;
  expression: string;
  steps: SolutionStep[];
  result: string;
  timestamp: string;
  imageUri?: string;
  type?: ProblemType;
  difficulty?: DifficultyLevel;
  mastered?: boolean;
}

/**
 * 获取认证请求头
 */
const getAuthHeader = async () => {
  const userData = await storage.getItem('@MathSolver:user');
  if (!userData) {
    throw new Error('用户未登录');
  }
  
  const user = JSON.parse(userData);
  return {
    Authorization: `Bearer ${user.token}`,
  };
};

/**
 * 获取解题历史记录
 * 
 * @returns 历史记录数组
 */
export const getHistory = async (): Promise<ProblemSolution[]> => {
  if (USE_MOCK_DATA) {
    console.log('使用模拟数据: 解题历史记录');
    // 同步到本地存储
    await storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(mockHistory));
    return mockHistory;
  }
  
  try {
    // 从本地获取
    const historyJson = await storage.getItem(HISTORY_STORAGE_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('读取历史记录失败:', error);
    return [];
  }
};

/**
 * 解决数学问题 - 在线模式
 * 
 * 使用服务器的数学推理模型解析表达式并生成解题步骤
 * 
 * @param imageUri 图片URI(如果从相机/相册而来)
 * @param ocrResult OCR识别结果(如果有)
 * @returns 问题解答
 */
export const solveProblem = async (
  imageUri?: string, 
  ocrResult?: OCRResult
): Promise<ProblemSolution> => {
  try {
    // 如果没有OCR结果但有图片，先进行OCR识别
    if (!ocrResult && imageUri) {
      console.log('开始OCR识别，图片路径:', imageUri);
      // 引入OCR服务
      const { recognizeMathExpression } = await import('./ocrService');
      ocrResult = await recognizeMathExpression(imageUri);
      console.log('OCR识别结果:', JSON.stringify(ocrResult));
      
      if (ocrResult.error) {
        throw new Error(`OCR识别失败: ${ocrResult.error}`);
      }
    }
    
    if (!ocrResult || !ocrResult.mathExpression) {
      throw new Error('OCR识别失败，未能识别出数学表达式');
    }
    
    // 构建请求数据
    const requestData = {
      expression: ocrResult.mathExpression,
      confidence: ocrResult.confidence,
      imageUri: imageUri
    };
    
    // 调用后端API解析数学表达式
    console.log('发送解题请求:', requestData);
    const solution = await backendService.solveMathExpression(requestData.expression);
    
    // 创建解题结果对象
    const problemSolution: ProblemSolution = {
      id: solution.id || `problem_${Date.now()}`,
      expression: requestData.expression,
      steps: solution.steps || [],
      result: solution.result || '未获取到结果',
      timestamp: new Date().toISOString(),
      imageUri,
    };
    
    // 保存到历史记录
    await saveToHistory(problemSolution);
    
    return problemSolution;
  } catch (error) {
    console.error('解题失败:', error);
    
    if (USE_MOCK_DATA) {
      console.log('使用模拟数据: 解题结果');
      const mockSolution = {
        ...mockMathSolution,
        expression: ocrResult?.mathExpression || '2x + 5 = 15',
        timestamp: new Date().toISOString(),
        imageUri,
      };
      
      // 保存到历史记录
      await saveToHistory(mockSolution);
      
      return mockSolution;
    }
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('解题过程中发生未知错误');
  }
};

/**
 * 保存到历史记录
 * 
 * @param solution 要保存的解题结果
 */
export const saveToHistory = async (solution: ProblemSolution): Promise<void> => {
  try {
    // 获取现有历史记录
    const history = await getHistory();
    
    // 添加新记录
    history.unshift(solution);
    
    // 限制历史记录数量最多100条
    const limitedHistory = history.slice(0, 100);
    
    // 保存到本地
    await storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitedHistory));
    
    console.log('已保存到历史记录');
  } catch (error) {
    console.error('保存历史记录失败:', error);
    throw error;
  }
};

/**
 * 删除历史记录
 * 
 * @param id 记录ID
 */
export const deleteFromHistory = async (id: string): Promise<void> => {
  try {
    // 获取现有历史记录
    const history = await getHistory();
    
    // 过滤掉要删除的记录
    const filteredHistory = history.filter(item => item.id !== id);
    
    // 保存到本地
    await storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filteredHistory));
    
    console.log('已从历史记录中删除');
  } catch (error) {
    console.error('删除历史记录失败:', error);
    throw error;
  }
};

/**
 * 清空历史记录
 */
export const clearHistory = async (): Promise<void> => {
  try {
    await storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([]));
    console.log('已清空历史记录');
  } catch (error) {
    console.error('清空历史记录失败:', error);
    throw error;
  }
};

/**
 * 更新问题标签
 * 
 * @param problemId 问题ID
 * @param tags 更新的标签
 */
export const updateProblemTags = async (
  problemId: string,
  tags: TagUpdateParams
): Promise<void> => {
  if (!problemId) {
    console.error('更新问题标签失败: 未提供有效的问题ID');
    throw new Error('需要有效的问题ID');
  }

  try {
    // 获取历史记录
    const history = await getHistory();
    
    // 找到并更新记录
    const updatedHistory = history.map(item => {
      if (item && item.id === problemId) {
        return { ...item, ...tags };
      }
      return item;
    });
    
    // 保存到本地
    await storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    
    console.log('标签已更新');
  } catch (error) {
    console.error('更新问题标签失败:', error);
    throw error;
  }
};

/**
 * 获取用户统计数据
 * @returns Promise<any> 统计数据
 */
export const getStats = async (): Promise<any> => {
  try {
    const headers = await getAuthHeader();
    
    // 使用fetch替代不存在的backendService.get
    const response = await fetch(`${API_URL}/user/statistics`, {
      method: 'GET',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '获取统计数据失败');
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取统计数据失败:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('获取统计数据时发生未知错误');
    }
  }
}; 