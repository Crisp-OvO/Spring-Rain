import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { Text, Button, Chip, Divider, useTheme, IconButton } from 'react-native-paper';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { solveProblem, updateProblemTags, ProblemSolution } from '../../services/mathService';
import { PROBLEM_TYPES, DIFFICULTY_LEVELS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';
import * as Share from 'expo-sharing';

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;
type ResultScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Result'>;

interface ResultScreenProps {
  route: ResultScreenRouteProp;
  navigation: ResultScreenNavigationProp;
}

/**
 * 结果屏幕
 * 显示数学题目的解析结果
 */
const ResultScreen: React.FC<ResultScreenProps> = ({ route, navigation }) => {
  const { imageUri } = route.params;
  const theme = useTheme();
  
  const [solution, setSolution] = useState<ProblemSolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [mastered, setMastered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // 加载题目解析结果
  useEffect(() => {
    const getSolution = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await solveProblem(imageUri);
        setSolution(result);
        
        // 如果已有标签，则设置选中状态
        if (result.type) {
          setSelectedType(result.type);
        }
        if (result.difficulty) {
          setSelectedDifficulty(result.difficulty);
        }
        if (result.mastered !== undefined) {
          setMastered(result.mastered);
        }
      } catch (err) {
        console.error('解题失败:', err);
        setError(err instanceof Error ? err.message : '解题失败，请重试');
      } finally {
        setLoading(false);
      }
    };
    
    getSolution();
  }, [imageUri]);
  
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
  
  // 保存标签
  const saveTagsToServer = async () => {
    if (!solution || !solution.id) {
      console.error('保存标签失败: 解题结果或ID不存在');
      Alert.alert('错误', '无法保存标签，解题结果数据不完整');
      return;
    }
    
    try {
      setSaving(true);
      
      await updateProblemTags(solution.id, {
        type: selectedType || undefined,
        difficulty: selectedDifficulty || undefined,
        mastered,
      });
      
      // 更新本地状态
      setSolution({
        ...solution,
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
  
  // 分享解题结果
  const shareResult = async () => {
    if (!solution) return;
    
    try {
      const message = 
`数学解题助手 - 解题结果
表达式: ${solution.expression}
结果: ${solution.result || ''}

解题步骤:
${solution.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`;
      
      await Share.share({
        message,
        title: '数学解题结果',
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };
  
  // 渲染加载状态
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>正在解析题目...</Text>
      </View>
    );
  }
  
  // 渲染错误状态
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
        <Text style={styles.errorTitle}>解析失败</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        >
          返回重试
        </Button>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      {solution && (
        <>
          {/* 顶部操作栏 */}
          <View style={styles.actionBar}>
            <IconButton
              icon="book-outline"
              size={24}
              onPress={() => setShowExplanation(!showExplanation)}
            />
            <IconButton
              icon="share-outline"
              size={24}
              onPress={shareResult}
            />
          </View>
          
          {/* 题目图片 */}
          <Image source={{ uri: imageUri }} style={styles.image} />
          
          {/* 识别出的表达式 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>识别结果</Text>
            <View style={styles.expressionContainer}>
              <Text style={styles.expression}>{solution.expression}</Text>
            </View>
          </View>
          
          <Divider />
          
          {/* 解题步骤 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>解题步骤</Text>
            {solution.steps.map((step, index) => (
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
        </>
      )}
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
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
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
  expressionContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  expression: {
    fontSize: 18,
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
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
});

export default ResultScreen; 