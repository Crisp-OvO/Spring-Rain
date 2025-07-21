import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';

import { RootState } from '../store';
import { navigate } from '../navigation/RootNavigation';
import { getHistory, deleteHistory, ProblemSolution } from '../services/mathService';
import { PROBLEM_TYPE_LABELS, DIFFICULTY_LABELS } from '../constants/config';

const HistoryScreen: React.FC = () => {
  const dispatch = useDispatch();
  const [problems, setProblems] = useState<ProblemSolution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // 获取历史记录
  const loadHistory = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const result = await getHistory(1, 20, selectedType, selectedDifficulty);
      setProblems(result.problems);
    } catch (error) {
      console.error('获取历史记录失败:', error);
      Alert.alert('错误', '获取历史记录失败');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedType, selectedDifficulty]);

  // 删除单个记录
  const handleDeleteProblem = (id: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这条解题记录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHistory(id);
              loadHistory();
              Alert.alert('成功', '记录已删除');
            } catch (error) {
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  };

  // 清空所有记录
  const handleClearAll = () => {
    Alert.alert(
      '确认清空',
      '确定要清空所有历史记录吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清空',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHistory();
              loadHistory();
              Alert.alert('成功', '所有记录已清空');
            } catch (error) {
              Alert.alert('错误', '清空失败');
            }
          },
        },
      ]
    );
  };

  // 渲染问题项
  const renderProblemItem = ({ item }: { item: ProblemSolution }) => (
    <TouchableOpacity
      style={styles.problemCard}
      onPress={() => navigate('Result', { problem: item })}
    >
      <View style={styles.problemHeader}>
        <View style={[styles.typeTag, { backgroundColor: getTypeColor(item.type) }]}>
          <Text style={styles.typeText}>{getTypeLabel(item.type)}</Text>
        </View>
        <View style={[styles.difficultyTag, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
          <Text style={styles.difficultyText}>{getDifficultyLabel(item.difficulty)}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteProblem(item.id)}
        >
          <Icon name="trash-outline" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.problemExpression} numberOfLines={2}>
        {item.expression}
      </Text>
      
      <Text style={styles.problemResult} numberOfLines={1}>
        答案: {item.result}
      </Text>
      
      <View style={styles.problemFooter}>
        <Text style={styles.problemTime}>
          {new Date(item.timestamp).toLocaleString('zh-CN')}
        </Text>
        <Text style={styles.problemMethod}>
          {getMethodLabel(item.method)}
        </Text>
      </View>
    </TouchableOpacity>
  );

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

  // 获取类型标签
  const getTypeLabel = (type: string) => {
    return PROBLEM_TYPE_LABELS[type as keyof typeof PROBLEM_TYPE_LABELS] || PROBLEM_TYPE_LABELS.other;
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

  // 获取难度标签
  const getDifficultyLabel = (difficulty: string) => {
    return DIFFICULTY_LABELS[difficulty as keyof typeof DIFFICULTY_LABELS] || DIFFICULTY_LABELS.easy;
  };

  // 获取方法标签
  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      thinking: '深度思考',
      cot: '逐步推理',
      tir: '工具集成',
    };
    return labels[method] || '深度思考';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>历史记录</Text>
        <Text style={styles.subtitle}>查看之前的解题记录</Text>
      </View>

      {/* 筛选器 */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === 'all' && styles.activeFilterButton]}
            onPress={() => setSelectedType('all')}
          >
            <Text style={[styles.filterText, selectedType === 'all' && styles.activeFilterText]}>
              全部类型
            </Text>
          </TouchableOpacity>
          {Object.entries(PROBLEM_TYPE_LABELS).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterButton, selectedType === key && styles.activeFilterButton]}
              onPress={() => setSelectedType(key)}
            >
              <Text style={[styles.filterText, selectedType === key && styles.activeFilterText]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 操作按钮 */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.refreshButton} onPress={() => loadHistory(true)}>
          <Icon name="refresh" size={16} color="#6366f1" />
          <Text style={styles.refreshText}>刷新</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
          <Icon name="trash" size={16} color="#ef4444" />
          <Text style={styles.clearText}>清空全部</Text>
        </TouchableOpacity>
      </View>
      
      {/* 问题列表 */}
      <FlatList
        data={problems}
        renderItem={renderProblemItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadHistory(true)} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="document-text-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>暂无历史记录</Text>
            <Text style={styles.emptySubtext}>开始解题后，记录会显示在这里</Text>
          </View>
        }
      />
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
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  activeFilterButton: {
    backgroundColor: '#6366f1',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
  },
  problemCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  problemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  difficultyTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  deleteButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  problemExpression: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  problemResult: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    marginBottom: 8,
  },
  problemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  problemTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  problemMethod: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default HistoryScreen; 