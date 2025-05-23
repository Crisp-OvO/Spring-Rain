import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { Text, Button, Chip, Divider, useTheme } from 'react-native-paper';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { getHistory, updateProblemTags, ProblemSolution } from '../../services/mathService';
import { PROBLEM_TYPES, DIFFICULTY_LEVELS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

type HistoryDetailScreenRouteProp = RouteProp<RootStackParamList, 'HistoryDetail'>;
type HistoryDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HistoryDetail'>;

interface HistoryDetailScreenProps {
  route: HistoryDetailScreenRouteProp;
  navigation: HistoryDetailScreenNavigationProp;
}

/**
 * 历史记录详情屏幕
 * 显示单个解题记录的详细信息，包括解题步骤和可编辑的标签
 */
const HistoryDetailScreen: React.FC<HistoryDetailScreenProps> = ({ route, navigation }) => {
  const { problemId } = route.params;
  const theme = useTheme();
  
  const [problem, setProblem] = useState<ProblemSolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [mastered, setMastered] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // 加载题目详情
  useEffect(() => {
    const loadProblemDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 获取所有历史记录并查找当前ID
        const records = await getHistory();
        const currentProblem = records.find(r => r.id === problemId);
        
        if (!currentProblem) {
          throw new Error('未找到题目记录');
        }
        
        setProblem(currentProblem);
        
        // 设置当前标签状态
        if (currentProblem.type) {
          setSelectedType(currentProblem.type);
        }
        if (currentProblem.difficulty) {
          setSelectedDifficulty(currentProblem.difficulty);
        }
        if (currentProblem.mastered !== undefined) {
          setMastered(currentProblem.mastered);
        }
      } catch (err) {
        console.error('加载题目详情失败:', err);
        setError(err instanceof Error ? err.message : '加载失败，请重试');
      } finally {
        setLoading(false);
      }
    };
    
    loadProblemDetail();
  }, [problemId]);
  
  // 处理题型选择
  const handleTypeSelect = (type: string) => {
    setSelectedType(selectedType === type ? null : type);
  };
  
  // 处理难度选择
  const handleDifficultySelect = (difficulty: string) => {
    setSelectedDifficulty(selectedDifficulty === difficulty ? null : difficulty);
  };
  
  // 处理掌握状态切换
  const handleMasteredToggle = () => {
    setMastered(!mastered);
  };
  
  // 保存标签更新
  const saveTagsToServer = async () => {
    if (!problem || !problem.id) {
      console.error('保存标签失败: 问题对象或ID不存在');
      Alert.alert('错误', '无法保存标签，问题数据不完整');
      return;
    }
    
    try {
      setSaving(true);
      
      await updateProblemTags(problem.id, {
        type: selectedType || undefined,
        difficulty: selectedDifficulty || undefined,
        mastered,
      });
      
      // 更新本地状态
      setProblem({
        ...problem,
        type: selectedType || undefined,
        difficulty: selectedDifficulty || undefined,
        mastered,
      });
      
      Alert.alert('成功', '标签已更新');
    } catch (err) {
      console.error('保存标签失败:', err);
      Alert.alert('错误', '保存标签失败，请重试');
    } finally {
      setSaving(false);
    }
  };
  
  // 渲染加载状态
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }
  
  // 渲染错误状态
  if (error || !problem) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
        <Text style={styles.errorTitle}>加载失败</Text>
        <Text style={styles.errorMessage}>{error || '未找到题目详情'}</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        >
          返回
        </Button>
      </View>
    );
  }
  
  // 格式化日期显示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <ScrollView style={styles.container}>
      {/* 题目信息 */}
      <View style={styles.header}>
        <Text style={styles.timestamp}>{formatDate(problem.timestamp)}</Text>
        <Text style={styles.expression}>{problem.expression}</Text>
      </View>
      
      <Divider />
      
      {/* 图片展示（如果有） */}
      {problem.imagePath && (
        <Image 
          source={{ uri: problem.imagePath }}
          style={styles.image}
          resizeMode="contain"
        />
      )}
      
      {/* 解题步骤 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>解题步骤</Text>
        {problem.steps.map((step, index) => (
          <View key={index} style={styles.stepContainer}>
            <Text style={styles.stepNumber}>{index + 1}</Text>
            <Text style={styles.stepContent}>{step}</Text>
          </View>
        ))}
      </View>
      
      <Divider />
      
      {/* 标签选择 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>题目标签</Text>
        
        <Text style={styles.labelText}>题型</Text>
        <View style={styles.chipContainer}>
          {PROBLEM_TYPES.map((item) => (
            <Chip
              key={item.value}
              selected={selectedType === item.value}
              onPress={() => handleTypeSelect(item.value)}
              style={[
                styles.chip,
                selectedType === item.value && { backgroundColor: theme.colors.primary + '20' }
              ]}
              textStyle={selectedType === item.value ? { color: theme.colors.primary } : undefined}
            >
              {item.label}
            </Chip>
          ))}
        </View>
        
        <Text style={styles.labelText}>难度</Text>
        <View style={styles.chipContainer}>
          {DIFFICULTY_LEVELS.map((item) => (
            <Chip
              key={item.value}
              selected={selectedDifficulty === item.value}
              onPress={() => handleDifficultySelect(item.value)}
              style={[
                styles.chip,
                selectedDifficulty === item.value && { backgroundColor: theme.colors.primary + '20' }
              ]}
              textStyle={selectedDifficulty === item.value ? { color: theme.colors.primary } : undefined}
            >
              {item.label}
            </Chip>
          ))}
        </View>
        
        <Button
          mode={mastered ? "contained" : "outlined"}
          onPress={handleMasteredToggle}
          style={styles.masteredButton}
          icon={mastered ? "check-circle" : "check-circle-outline"}
        >
          {mastered ? "已掌握" : "标记为已掌握"}
        </Button>
        
        <Button
          mode="contained"
          onPress={saveTagsToServer}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
        >
          保存标签
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  errorButton: {
    paddingHorizontal: 24,
  },
  header: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  expression: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A90E2',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  labelText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    margin: 4,
  },
  masteredButton: {
    marginTop: 16,
  },
  saveButton: {
    marginTop: 16,
  },
});

export default HistoryDetailScreen; 