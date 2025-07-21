import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Image,
} from 'react-native';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';

import { navigate } from '../navigation/RootNavigation';
import { ProblemSolution } from '../services/mathService';
import { PROBLEM_TYPE_LABELS, DIFFICULTY_LABELS } from '../constants/config';

interface ResultScreenProps {
  route: {
    params: {
      problem: ProblemSolution;
    };
  };
}

const ResultScreen: React.FC<ResultScreenProps> = ({ route }) => {
  const { problem } = route.params;
  const dispatch = useDispatch();
  const [showSteps, setShowSteps] = useState(true);

  // 分享结果
  const handleShare = async () => {
    try {
      const shareContent = `数学解题结果\n\n题目: ${problem.expression}\n\n答案: ${problem.result}\n\n解题步骤:\n${problem.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\n来自: Qwen数学解题助手`;
      
      await Share.share({
        message: shareContent,
        title: '数学解题结果',
      });
    } catch (error) {
      console.error('分享失败:', error);
      Alert.alert('错误', '分享失败');
    }
  };

  // 重新解题
  const handleResolve = () => {
    navigate('Solve', { 
      expression: problem.expression,
      imageUri: problem.imageUri,
    });
  };

  // 获取类型标签
  const getTypeLabel = (type: string) => {
    return PROBLEM_TYPE_LABELS[type as keyof typeof PROBLEM_TYPE_LABELS] || PROBLEM_TYPE_LABELS.other;
  };

  // 获取难度标签
  const getDifficultyLabel = (difficulty: string) => {
    return DIFFICULTY_LABELS[difficulty as keyof typeof DIFFICULTY_LABELS] || DIFFICULTY_LABELS.easy;
  };

  // 获取方法标签
  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      thinking: '深度思考',
      cot: '逐步推理',
      tir: '工具集成推理',
    };
    return labels[method] || '深度思考';
  };

  // 获取类型颜色
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      algebra: '#667eea',
      calculus: '#764ba2',
      equation: '#f093fb',
      arithmetic: '#4facfe',
      inequality: '#43e97b',
      geometry: '#ffc837',
      other: '#6c757d',
    };
    return colors[type] || colors.other;
  };

  // 获取难度颜色
  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: '#10b981',
      medium: '#f59e0b',
      hard: '#ef4444',
    };
    return colors[difficulty] || colors.easy;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 题目信息 */}
        <View style={styles.problemCard}>
          <View style={styles.problemHeader}>
            <Text style={styles.problemTitle}>题目</Text>
            <View style={styles.tagsContainer}>
              <View style={[styles.tag, { backgroundColor: getTypeColor(problem.type) }]}>
                <Text style={styles.tagText}>{getTypeLabel(problem.type)}</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: getDifficultyColor(problem.difficulty) }]}>
                <Text style={styles.tagText}>{getDifficultyLabel(problem.difficulty)}</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.problemExpression}>{problem.expression}</Text>
          
          {problem.imageUri && (
            <View style={styles.imageContainer}>
              <Text style={styles.imageTitle}>原始图片:</Text>
              <Image source={{ uri: problem.imageUri }} style={styles.problemImage} />
            </View>
          )}
        </View>

        {/* 解题信息 */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="time" size={16} color="#6b7280" />
            <Text style={styles.infoLabel}>解题时间:</Text>
            <Text style={styles.infoValue}>
              {new Date(problem.timestamp).toLocaleString('zh-CN')}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Icon name="cog" size={16} color="#6b7280" />
            <Text style={styles.infoLabel}>解题方法:</Text>
            <Text style={styles.infoValue}>{getMethodLabel(problem.method)}</Text>
          </View>
          
          {problem.model && (
            <View style={styles.infoRow}>
              <Icon name="cube" size={16} color="#6b7280" />
              <Text style={styles.infoLabel}>使用模型:</Text>
              <Text style={styles.infoValue}>{problem.model}</Text>
            </View>
          )}
          
          {problem.confidence && (
            <View style={styles.infoRow}>
              <Icon name="checkmark-circle" size={16} color="#6b7280" />
              <Text style={styles.infoLabel}>置信度:</Text>
              <Text style={styles.infoValue}>{(problem.confidence * 100).toFixed(1)}%</Text>
            </View>
          )}
        </View>

        {/* 最终答案 */}
        <View style={styles.answerCard}>
          <View style={styles.answerHeader}>
            <Icon name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.answerTitle}>最终答案</Text>
          </View>
          <Text style={styles.answerText}>{problem.result}</Text>
        </View>

        {/* 解题步骤 */}
        <View style={styles.stepsCard}>
          <TouchableOpacity 
            style={styles.stepsHeader} 
            onPress={() => setShowSteps(!showSteps)}
          >
            <View style={styles.stepsHeaderLeft}>
              <Icon name="list" size={20} color="#6366f1" />
              <Text style={styles.stepsTitle}>解题步骤</Text>
              <Text style={styles.stepsCount}>({problem.steps.length}步)</Text>
            </View>
            <Icon 
              name={showSteps ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#6b7280" 
            />
          </TouchableOpacity>
          
          {showSteps && (
            <View style={styles.stepsContent}>
              {problem.steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 详细解释 */}
        {problem.explanation && (
          <View style={styles.explanationCard}>
            <View style={styles.explanationHeader}>
              <Icon name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.explanationTitle}>详细解释</Text>
            </View>
            <Text style={styles.explanationText}>{problem.explanation}</Text>
          </View>
        )}

        {/* 思考过程 */}
        {problem.thinkingProcess && (
          <View style={styles.thinkingCard}>
            <View style={styles.thinkingHeader}>
              <Icon name="bulb" size={20} color="#f59e0b" />
              <Text style={styles.thinkingTitle}>思考过程</Text>
            </View>
            <Text style={styles.thinkingText}>{problem.thinkingProcess}</Text>
          </View>
        )}
      </ScrollView>

      {/* 底部操作按钮 */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Icon name="share" size={20} color="#6366f1" />
          <Text style={styles.actionButtonText}>分享</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleResolve}>
          <Icon name="refresh" size={20} color="#10b981" />
          <Text style={styles.actionButtonText}>重新解题</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryAction]} 
          onPress={() => navigate('Home')}
        >
          <Icon name="home" size={20} color="white" />
          <Text style={[styles.actionButtonText, { color: 'white' }]}>返回首页</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  problemCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  problemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  problemExpression: {
    fontSize: 18,
    color: '#1f2937',
    lineHeight: 26,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  imageContainer: {
    marginTop: 16,
  },
  imageTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  problemImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'contain',
    backgroundColor: '#f3f4f6',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  answerCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  answerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#047857',
    marginLeft: 8,
  },
  answerText: {
    fontSize: 20,
    color: '#065f46',
    fontWeight: '600',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    textAlign: 'center',
  },
  stepsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  stepsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  stepsCount: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  stepsContent: {
    padding: 16,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  explanationCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginLeft: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#1e3a8a',
    lineHeight: 20,
  },
  thinkingCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  thinkingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  thinkingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d97706',
    marginLeft: 8,
  },
  thinkingText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
    gap: 6,
  },
  primaryAction: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});

export default ResultScreen; 