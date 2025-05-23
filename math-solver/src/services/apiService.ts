import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API基础URL，使用电脑的IP地址，方便真机访问
// 通过ipconfig查看得到的WLAN的IPv4地址
const API_BASE_URL = 'http://192.168.31.160:3000';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * 请求拦截器 - 添加认证令牌到请求头
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
 * 响应拦截器 - 处理常见错误
 */
apiClient.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 如果是未授权错误(401)且未尝试过刷新令牌
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 可以在这里实现令牌刷新逻辑
        // 例如: const refreshResponse = await refreshToken();
        console.log('令牌已过期，需要重新登录');
        return Promise.reject(new Error('认证已过期，请重新登录'));
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * 上传图片到服务器
 * @param imageUri 本地图片URI
 * @param endpoint 上传端点
 * @returns 服务器响应
 */
export const uploadImage = async (imageUri: string, endpoint: string) => {
  try {
    console.log(`准备上传图片到 ${API_BASE_URL}${endpoint}`);
    console.log('图片URI:', imageUri);
    
    // 创建表单数据
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    // 使用更简单的方式添加文件，避免复杂对象可能导致的问题
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    } as any);
    
    console.log('表单数据创建完成，发送请求');
    
    // 由于文件上传通常不需要复杂的headers，直接使用axios.post而不是apiClient
    const response = await axios.post(`${API_BASE_URL}${endpoint}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 增加超时时间
    });
    
    console.log('上传成功，响应状态:', response.status);
    return response.data;
  } catch (error) {
    console.error(`上传图片到 ${endpoint} 失败:`, error);
    // 更详细的错误信息
    if (axios.isAxiosError(error)) {
      console.error('请求配置:', error.config);
      console.error('响应状态:', error.response?.status);
      console.error('响应数据:', error.response?.data);
    }
    throw error;
  }
};

/**
 * 发送GET请求
 * @param endpoint API端点
 * @param params 查询参数
 * @returns 服务器响应
 */
export const get = async (endpoint: string, params?: any) => {
  try {
    const response = await apiClient.get(endpoint, { params });
    return response.data;
  } catch (error) {
    console.error(`GET ${endpoint} 失败:`, error);
    throw error;
  }
};

/**
 * 发送POST请求
 * @param endpoint API端点
 * @param data 请求数据
 * @returns 服务器响应
 */
export const post = async (endpoint: string, data: any) => {
  try {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`POST ${endpoint} 失败:`, error);
    throw error;
  }
};

/**
 * 发送PUT请求
 * @param endpoint API端点
 * @param data 请求数据
 * @returns 服务器响应
 */
export const put = async (endpoint: string, data: any) => {
  try {
    const response = await apiClient.put(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`PUT ${endpoint} 失败:`, error);
    throw error;
  }
};

/**
 * 发送DELETE请求
 * @param endpoint API端点
 * @returns 服务器响应
 */
export const del = async (endpoint: string) => {
  try {
    const response = await apiClient.delete(endpoint);
    return response.data;
  } catch (error) {
    console.error(`DELETE ${endpoint} 失败:`, error);
    throw error;
  }
}; 