/**
 * 数学解题服务 - 使用阿里云通义千问Qwen Math-Plus模型
 * 支持多种解题方法和实时流式输出
 */

import { QWEN_API, APP_CONFIG, API_URL, API_PATHS, SOLVE_METHODS } from '../constants/config';
import { OCRResult } from './ocrService';

// 使用require导入AsyncStorage以避免类型问题
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

// 问题解答接口
export interface ProblemSolution {
  id: string;
  expression: string;
  steps: string[];
  result: string;
  timestamp: string;
  imageUri?: string;
  latex?: string;
  method: string;
  explanation: string;
  type: string;
  difficulty: string;
  model?: string;
  thinkingProcess?: string;
  confidence?: number;
}

// 解题进度接口
export interface SolveProgress {
  type: 'thinking' | 'content' | 'complete' | 'error';
  content?: string;
  solution?: ProblemSolution;
  error?: string;
  progress?: number;
}

// 历史记录接口
export interface HistoryRecord {
  problems: ProblemSolution[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 模拟解题结果（开发阶段使用）
const mockMathSolution: ProblemSolution = {
  id: `problem_${Date.now()}`,
  expression: '2x + 5 = 15',
  steps: [
    '将方程重新整理: 2x + 5 = 15',
    '两边同时减去5: 2x = 15 - 5',
    '计算右边: 2x = 10',
    '两边同时除以2: x = 10 ÷ 2',
    '得到最终答案: x = 5'
  ],
  result: 'x = 5',
  timestamp: new Date().toISOString(),
  method: 'thinking',
  explanation: '这是一个一元一次方程，通过移项和化简可以求解。',
  type: 'equation',
  difficulty: 'easy',
  model: 'mock',
  confidence: 0.95,
};

/**
 * 调用后端解题接口（流式响应）
 */
const callBackendSolve = async (
  expression: string,
  method: string = SOLVE_METHODS.THINKING,
  onProgress?: (progress: SolveProgress) => void
): Promise<ProblemSolution> => {
  return new Promise(async (resolve, reject) => {
    try {
      const requestData = {
        expression,
        method,
        enableSearch: false,
      };

      // 创建AbortController用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), QWEN_API.TIMEOUT);

      try {
        const response = await fetch(`${API_URL}${API_PATHS.SOLVE}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`解题API错误: HTTP ${response.status}`);
        }

        // 处理流式响应
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('无法获取响应流');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let finalSolution: ProblemSolution | undefined = undefined;

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            if (finalSolution) {
              resolve(finalSolution);
            } else {
              reject(new Error('未收到完整的解题结果'));
            }
            break;
          }

          // 解码数据块
          buffer += decoder.decode(value, { stream: true });
          
          // 处理完整的行
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() && line.startsWith('data: ')) {
              const data = line.replace('data: ', '').trim();
              
              if (data === '[DONE]') {
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                
                if (parsed.type === 'thinking' && onProgress) {
                  onProgress({
                    type: 'thinking',
                    content: parsed.content,
                  });
                } else if (parsed.type === 'content' && onProgress) {
                  onProgress({
                    type: 'content',
                    content: parsed.content,
                  });
                } else if (parsed.type === 'complete') {
                  finalSolution = parsed.solution;
                  if (onProgress) {
                    onProgress({
                      type: 'complete',
                      solution: finalSolution,
                    });
                  }
                } else if (parsed.type === 'error') {
                  if (onProgress) {
                    onProgress({
                      type: 'error',
                      error: parsed.error,
                    });
                  }
                  reject(new Error(parsed.error));
                  return;
                }
              } catch (parseError) {
                console.warn('解析流数据失败:', parseError, 'data:', data);
              }
            }
          }
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error('后端解题调用失败:', error);
      reject(error);
    }
  });
};

/**
 * 直接调用阿里云Qwen Math API（备用方案）
 */
const callQwenMathDirect = async (
  expression: string,
  method: string = SOLVE_METHODS.THINKING
): Promise<ProblemSolution> => {
  try {
    if (!QWEN_API.KEY) {
      throw new Error('缺少API密钥，请配置DASHSCOPE_API_KEY环境变量');
    }

    // 根据方法选择提示词
    let prompt = '';
    switch (method) {
      case SOLVE_METHODS.COT:
        prompt = `请使用逐步推理的方法解决以下数学问题。请按照以下格式回答：
1. 问题分析：分析题目类型和要求
2. 解题思路：说明解题方法和步骤
3. 详细计算：展示完整的计算过程
4. 最终答案：给出明确的答案

问题：${expression}

请开始解答：`;
        break;
      case SOLVE_METHODS.TIR:
        prompt = `请使用工具集成推理的方法解决以下数学问题。你可以使用代码来辅助计算：

问题：${expression}

请按照以下步骤：
1. 分析问题类型
2. 设计解题算法
3. 编写计算代码（如需要）
4. 执行计算并验证
5. 给出最终答案

请开始解答：`;
        break;
      default:
        prompt = `请深度思考并解决以下数学问题：${expression}

请开启思考模式，详细分析每一步的逻辑推理过程。`;
    }

    const requestData = {
      model: QWEN_API.MATH_MODEL.NAME,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的数学解题助手，擅长解决各种数学问题。请提供详细、准确的解题过程。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: QWEN_API.MATH_MODEL.MAX_TOKENS,
      temperature: QWEN_API.MATH_MODEL.TEMPERATURE,
    };

    const response = await fetch(`${QWEN_API.COMPATIBLE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QWEN_API.KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`Qwen Math API错误: HTTP ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';

    if (!content) {
      throw new Error('未获取到解题结果');
    }

    // 解析解题结果
    const solution: ProblemSolution = {
      id: `problem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expression,
      steps: parseSteps(content),
      result: extractFinalAnswer(content),
      timestamp: new Date().toISOString(),
      method,
      explanation: content,
      type: determineProblemType(expression),
      difficulty: determineDifficulty(expression),
      model: QWEN_API.MATH_MODEL.NAME,
      confidence: 0.9,
    };

    return solution;
  } catch (error) {
    console.error('Qwen Math API调用失败:', error);
    throw error;
  }
};

/**
 * 解析解题步骤
 */
const parseSteps = (content: string): string[] => {
  const stepPatterns = [
    /\d+[\.、]\s*(.+?)(?=\d+[\.、]|$)/g,
    /步骤\s*\d+[：:]\s*(.+?)(?=步骤\s*\d+|$)/g,
    /第\s*\d+\s*步[：:]\s*(.+?)(?=第\s*\d+\s*步|$)/g,
  ];
  
  for (const pattern of stepPatterns) {
    const matches = [...content.matchAll(pattern)];
    if (matches.length > 0) {
      return matches.map(match => match[1].trim());
    }
  }
  
  // 如果没有明确的步骤标记，按段落分割
  return content.split('\n').filter(line => line.trim().length > 0);
};

/**
 * 提取最终答案
 */
const extractFinalAnswer = (content: string): string => {
  const answerPatterns = [
    /答案[：:]?\s*(.+?)$/m,
    /结果[：:]?\s*(.+?)$/m,
    /因此[：:]?\s*(.+?)$/m,
    /所以[：:]?\s*(.+?)$/m,
    /\\boxed\{([^}]+)\}/,
    /最终答案[：:]?\s*(.+?)$/m,
  ];
  
  for (const pattern of answerPatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  // 如果没有找到明确答案，返回最后一行
  const lines = content.split('\n').filter(line => line.trim());
  return lines[lines.length - 1] || '无法确定答案';
};

/**
 * 判断问题类型
 */
const determineProblemType = (expression: string): string => {
  if (/[∫∑∏]/.test(expression)) return 'calculus';
  if (/[a-z]\s*=/.test(expression)) return 'equation';
  if (/[+\-*/]/.test(expression)) return 'arithmetic';
  if (/[≤≥<>]/.test(expression)) return 'inequality';
  if (/[√^²³]/.test(expression)) return 'algebra';
  if (/[△∠°]/.test(expression)) return 'geometry';
  return 'other';
};

/**
 * 判断难度级别
 */
const determineDifficulty = (expression: string): string => {
  let complexity = 0;
  
  if (/[∫∑∏]/.test(expression)) complexity += 3;
  if (/[√^]/.test(expression)) complexity += 2;
  if (/[+\-*/()]/.test(expression)) complexity += 1;
  if (expression.length > 50) complexity += 1;
  
  if (complexity <= 2) return 'easy';
  if (complexity <= 4) return 'medium';
  return 'hard';
};

/**
 * 解决数学问题 - 主函数
 */
export const solveProblem = async (
  imageUri?: string,
  ocrResult?: OCRResult,
  method: string = SOLVE_METHODS.THINKING,
  onProgress?: (progress: SolveProgress) => void
): Promise<ProblemSolution> => {
  try {
    // 如果没有OCR结果但有图片，先进行OCR识别
    if (!ocrResult && imageUri) {
      console.log('开始OCR识别，图片路径:', imageUri);
      const { recognizeMathExpression } = await import('./ocrService');
      ocrResult = await recognizeMathExpression(imageUri);
      console.log('OCR识别结果:', JSON.stringify(ocrResult));

      if (ocrResult.error) {
        throw new Error(`OCR识别失败: ${ocrResult.error}`);
      }
    }

    if (!ocrResult || !ocrResult.mathExpression) {
      throw new Error('未能识别出数学表达式');
    }

    console.log('开始解题，表达式:', ocrResult.mathExpression);

    // 如果开启模拟数据模式
    if (APP_CONFIG.FEATURES.USE_MOCK_DATA) {
      console.log('使用模拟数据: 解题结果');
      const mockSolution = {
        ...mockMathSolution,
        expression: ocrResult.mathExpression,
        timestamp: new Date().toISOString(),
        imageUri,
        method,
      };

      // 保存到历史记录
      await saveToHistory(mockSolution);
      return mockSolution;
    }

    let solution: ProblemSolution;

    // 优先使用后端接口
    try {
      console.log('尝试调用后端解题接口...');
      solution = await callBackendSolve(ocrResult.mathExpression, method, onProgress);
      console.log('后端解题成功');
    } catch (backendError) {
      console.warn('后端解题调用失败，尝试直接调用Qwen Math API:', backendError);
      
      // 如果后端调用失败，尝试直接调用Qwen API
      solution = await callQwenMathDirect(ocrResult.mathExpression, method);
      console.log('Qwen Math API解题成功');
    }

    // 添加图片信息
    solution.imageUri = imageUri;
    
    // 保存到历史记录
    await saveToHistory(solution);

    return solution;
  } catch (error) {
    console.error('解题失败:', error);

    if (error instanceof Error) {
      throw error;
    }
    throw new Error('解题过程中发生未知错误');
  }
};

/**
 * 手动解题（直接输入表达式）
 */
export const solveExpression = async (
  expression: string,
  method: string = SOLVE_METHODS.THINKING,
  onProgress?: (progress: SolveProgress) => void
): Promise<ProblemSolution> => {
  console.log('手动解题，表达式:', expression);

  if (!expression.trim()) {
    throw new Error('请输入数学表达式');
  }

  // 如果开启模拟数据模式
  if (APP_CONFIG.FEATURES.USE_MOCK_DATA) {
    console.log('使用模拟数据: 手动解题结果');
    const mockSolution = {
      ...mockMathSolution,
      expression,
      timestamp: new Date().toISOString(),
      method,
    };

    await saveToHistory(mockSolution);
    return mockSolution;
  }

  try {
    let solution: ProblemSolution;

    // 优先使用后端接口
    try {
      console.log('尝试调用后端解题接口...');
      solution = await callBackendSolve(expression, method, onProgress);
      console.log('后端解题成功');
    } catch (backendError) {
      console.warn('后端解题调用失败，尝试直接调用Qwen Math API:', backendError);
      
      // 如果后端调用失败，尝试直接调用Qwen API
      solution = await callQwenMathDirect(expression, method);
      console.log('Qwen Math API解题成功');
    }

    // 保存到历史记录
    await saveToHistory(solution);

    return solution;
  } catch (error) {
    console.error('手动解题失败:', error);
    throw error;
  }
};

/**
 * 保存解题结果到历史记录
 */
const saveToHistory = async (solution: ProblemSolution): Promise<void> => {
  try {
    const historyKey = '@math_solver_history';
    const existingHistoryStr = await AsyncStorage.getItem(historyKey);
    const existingHistory: ProblemSolution[] = existingHistoryStr 
      ? JSON.parse(existingHistoryStr) 
      : [];

    // 添加到历史记录开头
    existingHistory.unshift(solution);

    // 保留最近100条记录
    if (existingHistory.length > 100) {
      existingHistory.splice(100);
    }

    await AsyncStorage.setItem(historyKey, JSON.stringify(existingHistory));
    console.log('解题结果已保存到本地历史记录');
  } catch (error) {
    console.error('保存历史记录失败:', error);
  }
};

/**
 * 获取历史记录
 */
export const getHistory = async (
  page: number = 1,
  limit: number = 20,
  type?: string,
  difficulty?: string
): Promise<HistoryRecord> => {
  try {
    // 首先尝试从后端获取
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (type) params.append('type', type);
      if (difficulty) params.append('difficulty', difficulty);

      const response = await fetch(`${API_URL}${API_PATHS.HISTORY}?${params}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('从后端获取历史记录成功');
        return result;
      }
    } catch (backendError) {
      console.warn('后端历史记录获取失败，使用本地记录:', backendError);
    }

    // 从本地存储获取
    const historyKey = '@math_solver_history';
    const historyStr = await AsyncStorage.getItem(historyKey);
    const allProblems: ProblemSolution[] = historyStr ? JSON.parse(historyStr) : [];

    // 过滤
    let filtered = allProblems;
    if (type && type !== 'all') {
      filtered = filtered.filter(p => p.type === type);
    }
    if (difficulty && difficulty !== 'all') {
      filtered = filtered.filter(p => p.difficulty === difficulty);
    }

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      problems: paginated,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    };
  } catch (error) {
    console.error('获取历史记录失败:', error);
    return {
      problems: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }
};

/**
 * 删除历史记录
 */
export const deleteHistory = async (id?: string): Promise<boolean> => {
  try {
    // 如果指定了ID，删除特定记录
    if (id) {
      // 尝试调用后端API
      try {
        const response = await fetch(`${API_URL}${API_PATHS.HISTORY}/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          console.log('后端历史记录删除成功');
        }
      } catch (backendError) {
        console.warn('后端删除失败:', backendError);
      }

      // 从本地存储删除
      const historyKey = '@math_solver_history';
      const historyStr = await AsyncStorage.getItem(historyKey);
      const history: ProblemSolution[] = historyStr ? JSON.parse(historyStr) : [];
      
      const filtered = history.filter(p => p.id !== id);
      await AsyncStorage.setItem(historyKey, JSON.stringify(filtered));
    } else {
      // 清空所有记录
      try {
        const response = await fetch(`${API_URL}${API_PATHS.HISTORY}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          console.log('后端历史记录清空成功');
        }
      } catch (backendError) {
        console.warn('后端清空失败:', backendError);
      }

      // 清空本地存储
      const historyKey = '@math_solver_history';
      await AsyncStorage.removeItem(historyKey);
    }

    return true;
  } catch (error) {
    console.error('删除历史记录失败:', error);
    return false;
  }
};

/**
 * 获取解题服务状态
 */
export const getMathServiceStatus = async (): Promise<{
  available: boolean;
  backend: boolean;
  direct: boolean;
  error?: string;
}> => {
  try {
    // 检查后端服务
    const backendAvailable = await fetch(`${API_URL}${API_PATHS.HEALTH}`)
      .then(res => res.ok)
      .catch(() => false);

    // 检查API密钥
    const directAvailable = !!QWEN_API.KEY;

    return {
      available: backendAvailable || directAvailable,
      backend: backendAvailable,
      direct: directAvailable,
    };
  } catch (error) {
    return {
      available: false,
      backend: false,
      direct: false,
      error: error instanceof Error ? error.message : '检查服务状态失败',
    };
  }
}; 