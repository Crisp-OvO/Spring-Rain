import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, MONGODB_CONFIG } from '../constants/config';

// 使用配置文件中的API_URL
const API_BASE_URL = API_URL;

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// MongoDB连接配置
export const MONGODB_CONNECTION = {
  connectionString: MONGODB_CONFIG.CONNECTION_STRING,
  dbName: MONGODB_CONFIG.DB_NAME,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
};

/**
 * 请求拦截器 - 添加认证令牌到请求头
 */
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * GET请求
 * 
 * @param url 请求地址
 * @param params 请求参数
 * @returns 响应数据
 */
export const get = async (url: string, params = {}) => {
  console.log(`GET ${url} 请求中...`);
  try {
    const response = await apiClient.get(url, { params });
    return response.data;
  } catch (error) {
    console.error(`GET ${url} 失败:`, error);
    throw error;
  }
};

/**
 * POST请求
 * 
 * @param url 请求地址
 * @param data 请求数据
 * @param config 请求配置
 * @returns 响应数据
 */
export const post = async (url: string, data = {}, config = {}) => {
  console.log(`POST ${url} 请求中...`);
  try {
    const response = await apiClient.post(url, data, config);
    return response.data;
  } catch (error) {
    console.error(`POST ${url} 失败:`, error);
    throw error;
  }
};

/**
 * PUT请求
 * 
 * @param url 请求地址
 * @param data 请求数据
 * @param config 请求配置
 * @returns 响应数据
 */
export const put = async (url: string, data = {}, config = {}) => {
  console.log(`PUT ${url} 请求中...`);
  try {
    const response = await apiClient.put(url, data, config);
    return response.data;
  } catch (error) {
    console.error(`PUT ${url} 失败:`, error);
    throw error;
  }
};

export default apiClient; 