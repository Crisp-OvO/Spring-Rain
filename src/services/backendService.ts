import axios from 'axios';
import { API_URL, HUGGING_FACE_API } from '../constants/config';
import { API_PATHS } from './dbService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 创建API客户端实例
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// 创建Hugging Face API客户端实例
const huggingFaceClient = axios.create({
  baseURL: HUGGING_FACE_API.OCR_MODEL_URL,
  timeout: HUGGING_FACE_API.TIMEOUT,
  headers: {
    'Authorization': `Bearer ${HUGGING_FACE_API.KEY}`,
    'Content-Type': 'application/octet-stream',
  }
});

/**
 * 添加认证令牌到请求头
 */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const userJson = await AsyncStorage.getItem('math_solver_user');
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (error) {
      console.error('读取认证信息失败:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 使用Hugging Face API进行OCR识别
 * @param imageData 图像二进制数据
 * @returns 识别结果文本
 */
export const recognizeTextWithHuggingFace = async (imageData: Blob): Promise<string> => {
  try {
    const response = await huggingFaceClient.post('', imageData);
    if (response.data && typeof response.data === 'string') {
      return response.data;
    }
    throw new Error('无效的OCR响应格式');
  } catch (error) {
    console.error('Hugging Face OCR调用失败:', error);
    throw error;
  }
};

/**
 * 解析数学表达式并生成解题步骤
 * @param expression 数学表达式文本
 * @returns 解题步骤和结果
 */
export const solveMathExpression = async (expression: string) => {
  try {
    const response = await apiClient.post(API_PATHS.MATH.SOLVE, { expression });
    return response.data;
  } catch (error) {
    console.error('解析数学表达式失败:', error);
    throw error;
  }
};

/**
 * 获取用户解题历史记录
 * @returns 解题历史记录列表
 */
export const fetchSolutionHistory = async () => {
  try {
    const response = await apiClient.get(API_PATHS.USER.HISTORY);
    return response.data;
  } catch (error) {
    console.error('获取解题历史记录失败:', error);
    throw error;
  }
};

/**
 * 保存解题结果到历史记录
 * @param solution 解题结果
 * @returns 保存后的记录
 */
export const saveSolutionToHistory = async (solution: any) => {
  try {
    const response = await apiClient.post(API_PATHS.USER.HISTORY, solution);
    return response.data;
  } catch (error) {
    console.error('保存解题结果失败:', error);
    throw error;
  }
};

/**
 * 生成LaTeX格式的数学表达式
 * @param expression 普通格式的数学表达式
 * @returns LaTeX格式的表达式
 */
export const generateLatexExpression = async (expression: string) => {
  try {
    const response = await apiClient.post(API_PATHS.MATH.LATEX, { expression });
    return response.data.latex;
  } catch (error) {
    console.error('生成LaTeX表达式失败:', error);
    throw error;
  }
};

export default {
  recognizeTextWithHuggingFace,
  solveMathExpression,
  fetchSolutionHistory,
  saveSolutionToHistory,
  generateLatexExpression,
}; 