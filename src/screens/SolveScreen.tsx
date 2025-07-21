import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';

import { RootState } from '../store';
import { setLoading, addProblem, setError } from '../store/slices/mathSlice';
import { navigate } from '../navigation/RootNavigation';
import { solveExpression, solveProblem, SolveProgress } from '../services/mathService';
import { SOLVE_METHODS } from '../constants/config';

interface RouteParams {
  expression?: string;
  imageUri?: string;
  ocrResult?: any;
}

interface SolveScreenProps {
  route?: {
    params?: RouteParams;
  };
}

const SolveScreen: React.FC<SolveScreenProps> = ({ route }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state: RootState) => state.math);
  
  const [expression, setExpression] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(SOLVE_METHODS.THINKING);
  const [progress, setProgress] = useState<SolveProgress | null>(null);
  const [thinkingContent, setThinkingContent] = useState('');
  const [solutionContent, setSolutionContent] = useState('');

  // 从路由参数获取初始表达式
  useEffect(() => {
    if (route?.params?.expression) {
      setExpression(route.params.expression);
    }
  }, [route?.params?.expression]);

  // 解题方法选项
  const methodOptions = [
    {
      value: SOLVE_METHODS.THINKING,
      label: '深度思考',
      description: '使用深度思考模式，详细分析推理过程',
      icon: 'bulb',
    },
    {
      value: SOLVE_METHODS.COT,
      label: '逐步推理',
      description: 'Chain of Thought，一步一步解决问题',
      icon: 'list',
    },
    {
      value: SOLVE_METHODS.TIR,
      label: '工具集成',
      description: 'Tool-integrated Reasoning，结合代码辅助计算',
      icon: 'code-slash',
    },
  ];

  // 处理解题进度更新
  const handleProgress = (progressData: SolveProgress) => {
    setProgress(progressData);
    
    switch (progressData.type) {
      case 'thinking':
        if (progressData.content) {
          setThinkingContent(prev => prev + progressData.content);
        }
        break;
      case 'content':
        if (progressData.content) {
          setSolutionContent(prev => prev + progressData.content);
        }
        break;
      case 'complete':
        if (progressData.solution) {
          dispatch(addProblem(progressData.solution));
          navigate('Result', { problem: progressData.solution });
        }
        break;
      case 'error':
        dispatch(setError(progressData.error || '解题失败'));
        Alert.alert('解题失败', progressData.error || '发生未知错误');
        break;
    }
  };

  // 开始解题
  const handleSolve = async () => {
    if (!expression.trim()) {
      Alert.alert('提示', '请输入数学表达式');
      return;
    }

    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      setProgress(null);
      setThinkingContent('');
      setSolutionContent('');

      let solution;

      // 如果有图片和OCR结果，使用图片解题
      if (route?.params?.imageUri && route?.params?.ocrResult) {
        console.log('使用图片解题模式');
        solution = await solveProblem(
          route.params.imageUri,
          route.params.ocrResult,
          selectedMethod,
          handleProgress
        );
      } else {
        // 手动输入模式
        console.log('使用手动输入解题模式');
        solution = await solveExpression(
          expression,
          selectedMethod,
          handleProgress
        );
      }

      // 如果没有通过流式响应处理，直接跳转
      if (solution && !progress) {
        dispatch(addProblem(solution));
        navigate('Result', { problem: solution });
      }
    } catch (error: any) {
      console.error('解题失败:', error);
      dispatch(setError(error.message || '解题失败'));
      Alert.alert('解题失败', error.message || '发生未知错误');
    } finally {
      dispatch(setLoading(false));
    }
  };

  // 清空内容
  const handleClear = () => {
    setExpression('');
    setProgress(null);
    setThinkingContent('');
    setSolutionContent('');
    dispatch(setError(null));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>解题输入</Text>
        <Text style={styles.subtitle}>选择解题方法并输入数学表达式</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 解题方法选择 */}
        <View style={styles.methodSection}>
          <Text style={styles.sectionTitle}>解题方法</Text>
          <View style={styles.methodGrid}>
            {methodOptions.map((method) => (
              <TouchableOpacity
                key={method.value}
                style={[
                  styles.methodCard,
                  selectedMethod === method.value && styles.selectedMethodCard
                ]}
                onPress={() => setSelectedMethod(method.value)}
              >
                <Icon 
                  name={method.icon} 
                  size={24} 
                  color={selectedMethod === method.value ? '#6366f1' : '#6b7280'} 
                />
                <Text style={[
                  styles.methodLabel,
                  selectedMethod === method.value && styles.selectedMethodLabel
                ]}>
                  {method.label}
                </Text>
                <Text style={styles.methodDescription}>
                  {method.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 数学表达式输入 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>数学表达式</Text>
          <TextInput
            style={styles.input}
            value={expression}
            onChangeText={setExpression}
            placeholder="请输入数学表达式，如：2x + 3 = 7"
            multiline
            numberOfLines={4}
            editable={!isLoading}
          />
        </View>

        {/* 解题进度显示 */}
        {progress && (
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>解题过程</Text>
            
            {thinkingContent && (
              <View style={styles.thinkingContainer}>
                <Text style={styles.thinkingTitle}>思考过程：</Text>
                <Text style={styles.thinkingText}>{thinkingContent}</Text>
              </View>
            )}

            {solutionContent && (
              <View style={styles.solutionContainer}>
                <Text style={styles.solutionTitle}>解题步骤：</Text>
                <Text style={styles.solutionText}>{solutionContent}</Text>
              </View>
            )}

            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6366f1" />
                <Text style={styles.loadingText}>正在解题中...</Text>
              </View>
            )}
          </View>
        )}

        {/* 操作按钮 */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={[styles.solveButton, (!expression.trim() || isLoading) && styles.disabledButton]}
            onPress={handleSolve}
            disabled={!expression.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Icon name="calculator" size={20} color="white" />
                <Text style={styles.solveButtonText}>开始解题</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleClear}
            disabled={isLoading}
          >
            <Icon name="refresh" size={20} color="#6b7280" />
            <Text style={styles.clearButtonText}>清空重置</Text>
          </TouchableOpacity>
        </View>
        
        {/* 使用提示 */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipTitle}>支持的表达式类型：</Text>
          <Text style={styles.tipText}>• 基本运算：2 + 3 * 4</Text>
          <Text style={styles.tipText}>• 方程求解：2x + 3 = 7</Text>
          <Text style={styles.tipText}>• 不等式：x^2 - 4 {'>'} 0</Text>
          <Text style={styles.tipText}>• 微积分：∫x²dx</Text>
          <Text style={styles.tipText}>• 几何问题：求三角形面积</Text>
          <Text style={styles.tipText}>• LaTeX格式：\\frac{1}{2}x + 3 = 7</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  methodSection: {
    marginBottom: 24,
  },
  methodGrid: {
    gap: 12,
  },
  methodCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  selectedMethodCard: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
  },
  methodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
  },
  selectedMethodLabel: {
    color: '#6366f1',
  },
  methodDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  progressSection: {
    marginBottom: 24,
  },
  thinkingContainer: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  thinkingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 8,
  },
  thinkingText: {
    fontSize: 14,
    color: '#075985',
    lineHeight: 20,
  },
  solutionContainer: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  solutionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 8,
  },
  solutionText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  buttonSection: {
    gap: 12,
    marginBottom: 24,
  },
  solveButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  solveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    gap: 8,
  },
  clearButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  tipContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
});

export default SolveScreen; 