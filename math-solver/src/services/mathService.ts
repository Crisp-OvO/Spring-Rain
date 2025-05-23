import { post, get, put } from './apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OCRResult } from './ocrService';

// 存储键
const HISTORY_STORAGE_KEY = 'math_solver_history';

/**
 * 数学问题解答接口
 */
export interface ProblemSolution {
  id: string;                    // 解题记录唯一ID
  expression: string;            // 数学表达式
  steps: string[];               // 解题步骤
  result: string;                // 最终结果
  imagePath?: string;            // 图片路径(如有)
  timestamp: string;             // 创建时间戳
  type?: string;                 // 问题类型(代数、几何等)
  difficulty?: string;           // 难度级别
  mastered?: boolean;            // 是否已掌握
  latex?: string;                // LaTeX格式的表达式
  method?: string;               // 使用的解题方法
  explanation?: string;          // 详细解释
}

/**
 * 解题历史统计数据
 */
export interface StatisticsData {
  totalProblems: number;
  masteredProblems: number;
  typeDistribution: { [key: string]: number };
  difficultyDistribution: { [key: string]: number };
  weeklyActivity: { [key: string]: number };
}

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
    let requestData: any = {};
    
    // 构建请求数据
    if (ocrResult) {
      // 如果有OCR结果，直接使用
      requestData = {
        expression: ocrResult.mathExpression,
        confidence: ocrResult.confidence,
        imageUri: imageUri
      };
    } else if (imageUri) {
      // 如果只有图片，传递图片信息
      requestData = {
        imageUri: imageUri
      };
    } else {
      throw new Error('需要提供图片或OCR结果');
    }
    
    console.log('发送解题请求:', requestData);
    
    // 发送解题请求
    const response = await post('/math/solve', requestData);
    console.log('服务器解题响应:', response);
    
    // 获取解题结果 - 直接使用服务器返回的数据
    // 服务器直接返回解题结果对象，而不是包含在solution属性中
    const solution: ProblemSolution = {
      id: response.id || `problem_${Date.now()}`,
      expression: response.expression || ocrResult?.mathExpression || '未知表达式',
      steps: response.steps || ['无步骤'],
      result: response.result || '无结果',
      timestamp: new Date().toISOString(),
      imagePath: imageUri,
      type: response.type || 'other',
      difficulty: response.difficulty || 'medium',
      latex: response.latex || '',
      method: response.method || '',
      explanation: response.explanation || ''
    };
    
    // 保存到本地历史记录
    await saveToHistory(solution);
    
    return solution;
  } catch (error) {
    console.error('解题失败:', error);
    
    // 创建模拟解题结果(在实际API不可用时)
    const mockSolution: ProblemSolution = {
      id: `problem_${Date.now()}`,
      expression: ocrResult?.mathExpression || '无法识别表达式',
      steps: ['无法连接到解题服务'],
      result: '服务不可用',
      timestamp: new Date().toISOString(),
      imagePath: imageUri,
      type: 'other',
      difficulty: 'medium'
    };
    
    // 尽管失败，仍保存到历史记录
    await saveToHistory(mockSolution);
    
    return mockSolution;
  }
};

/**
 * 获取解题历史记录
 * 
 * @returns 历史记录数组
 */
export const getHistory = async (): Promise<ProblemSolution[]> => {
  try {
    // 尝试从服务器获取
    const response = await get('/user/history');
    if (response && response.history) {
      // 同步到本地存储
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(response.history));
      return response.history;
    }
  } catch (error) {
    console.log('无法从服务器获取历史记录，将使用本地数据', error);
  }
  
  // 从本地获取
  try {
    const historyJson = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('读取历史记录失败:', error);
    return [];
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
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitedHistory));
    
    // 尝试同步到服务器
    try {
      await post('/user/history', { problemId: solution.id, solution });
    } catch (error) {
      console.log('无法同步到服务器，仅保存本地:', error);
    }
  } catch (error) {
    console.error('保存历史记录失败:', error);
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
  tags: { type?: string; difficulty?: string; mastered?: boolean }
): Promise<void> => {
  try {
    // 获取历史记录
    const history = await getHistory();
    
    // 找到并更新记录
    const updatedHistory = history.map(item => {
      if (item.id === problemId) {
        return { ...item, ...tags };
      }
      return item;
    });
    
    // 保存到本地
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    
    // 同步到服务器
    try {
      await put(`/user/history/${problemId}`, tags);
    } catch (error) {
      console.log('更新标签无法同步到服务器:', error);
    }
  } catch (error) {
    console.error('更新问题标签失败:', error);
    throw error;
  }
};

/**
 * 获取统计数据
 * 
 * @returns 统计数据
 */
export const getStatistics = async (): Promise<StatisticsData> => {
  try {
    // 尝试从服务器获取统计数据
    const response = await get('/user/statistics');
    if (response && response.statistics) {
      return response.statistics;
    }
  } catch (error) {
    console.log('从服务器获取统计数据失败，将计算本地数据', error);
  }
  
  // 计算本地数据
  const history = await getHistory();
  
  // 计算各项统计数据
  const totalProblems = history.length;
  const masteredProblems = history.filter(item => item.mastered).length;
  
  // 计算题型分布
  const typeDistribution: { [key: string]: number } = {};
  history.forEach(item => {
    if (item.type) {
      typeDistribution[item.type] = (typeDistribution[item.type] || 0) + 1;
    } else {
      typeDistribution['未分类'] = (typeDistribution['未分类'] || 0) + 1;
    }
  });
  
  // 计算难度分布
  const difficultyDistribution: { [key: string]: number } = {};
  history.forEach(item => {
    if (item.difficulty) {
      difficultyDistribution[item.difficulty] = (difficultyDistribution[item.difficulty] || 0) + 1;
    } else {
      difficultyDistribution['未分类'] = (difficultyDistribution['未分类'] || 0) + 1;
    }
  });
  
  // 计算每周活动
  const weeklyActivity: { [key: string]: number } = {};
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  history.forEach(item => {
    const timestamp = new Date(item.timestamp);
    if (timestamp >= oneWeekAgo) {
      const dateKey = timestamp.toISOString().split('T')[0];
      weeklyActivity[dateKey] = (weeklyActivity[dateKey] || 0) + 1;
    }
  });
  
  return {
    totalProblems,
    masteredProblems,
    typeDistribution,
    difficultyDistribution,
    weeklyActivity
  };
};

/**
 * 根据数学表达式生成LaTeX格式
 * 
 * @param expression 数学表达式
 * @returns LaTeX格式的表达式
 */
export const generateLatex = async (expression: string): Promise<string> => {
  try {
    console.log('请求生成LaTeX，表达式:', expression);
    const response = await post('/math/latex', { expression });
    console.log('LaTeX生成响应:', response);
    
    // 处理新的响应结构，服务器返回 { expression, latex, formatted }
    if (response && response.latex) {
      return response.latex;
    } else if (response && typeof response === 'object') {
      // 兼容可能的其他响应结构
      return response.latex || response.expression || expression;
    } else {
      // 如果响应格式完全不对
      return expression;
    }
  } catch (error) {
    console.error('生成LaTeX失败:', error);
    
    // 简单转换(备用方案)
    return expression
      .replace(/\*/g, '\\cdot ')
      .replace(/\//g, '\\frac{')
      .replace(/\^/g, '^{');
  }
}; 