import axios from 'axios';
import { User } from '../contexts/AuthContext';
import { API_URL } from '../constants/config';

/**
 * 用户登录API调用
 * @param email 用户邮箱
 * @param password 用户密码
 * @returns Promise<User> 包含用户数据的Promise
 */
export const apiLogin = async (email: string, password: string): Promise<User> => {
  try {
    const response = await axios.post(`${API_URL}/api/login`, {
      email,
      password,
    });
    
    if (response.status !== 200) {
      throw new Error(response.data.message || '登录失败');
    }
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || '登录失败');
    }
    throw error;
  }
};

/**
 * 用户注册API调用
 * @param email 用户邮箱
 * @param password 用户密码
 * @returns Promise<User> 包含用户数据的Promise
 */
export const apiRegister = async (email: string, password: string): Promise<User> => {
  try {
    const response = await axios.post(`${API_URL}/api/register`, {
      email,
      password,
    });
    
    if (response.status !== 201) {
      throw new Error(response.data.message || '注册失败');
    }
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || '注册失败');
    }
    throw error;
  }
}; 