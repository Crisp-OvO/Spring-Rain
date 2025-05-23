import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiLogin, apiRegister } from '../services/authService';

// 定义用户类型
export interface User {
  id: string;
  email: string;
  token: string;
}

// 定义认证上下文接口
interface AuthContextData {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// 创建认证上下文
export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 认证上下文提供者组件
 * 管理用户的认证状态，包括登录、注册和登出功能
 * 使用AsyncStorage持久化存储用户令牌
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化时检查本地存储的用户信息
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('@MathSolver:user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (e) {
        console.error('Error loading user data:', e);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // 登录方法
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await apiLogin(email, password);
      setUser(userData);
      await AsyncStorage.setItem('@MathSolver:user', JSON.stringify(userData));
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败，请重试');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // 注册方法
  const register = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await apiRegister(email, password);
      setUser(userData);
      await AsyncStorage.setItem('@MathSolver:user', JSON.stringify(userData));
    } catch (e) {
      setError(e instanceof Error ? e.message : '注册失败，请重试');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // 登出方法
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('@MathSolver:user');
      setUser(null);
    } catch (e) {
      console.error('Error during logout:', e);
    }
  };

  // 清除错误
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 