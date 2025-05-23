import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, ActivityIndicator, Share } from 'react-native';
import { Text, Button, Chip, Divider, useTheme, IconButton, Card, Surface } from 'react-native-paper';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { solveProblem, updateProblemTags, ProblemSolution, generateLatex } from '../../services/mathService';
import { PROBLEM_TYPES, DIFFICULTY_LEVELS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';
import { useBackHandler } from '../../hooks/useBackHandler';
import { OCRResult } from '../../services/ocrService';
import { getUserPreferences } from '../../services/userService';

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;
type ResultScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Result'>;

interface ResultScreenProps {
  route: ResultScreenRouteProp;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ route }) => {
  const { imageUri, solution: initialSolution } = route.params;
  const theme = useTheme();
  const navigation = useNavigation<ResultScreenNavigationProp>();
  
  // 使用自定义返回钩子
  useBackHandler();
  
  const [solution, setSolution] = useState<ProblemSolution | null>(null);
  const [latexExpression, setLatexExpression] = useState<string>('');
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
        
        // 如果有初始解决方案数据，使用它
        if (initialSolution && initialSolution.expression) {
          // 发送到服务器获取完整解决方案
          const result = await solveProblem(imageUri, {
            mathExpression: initialSolution.expression,
            text: initialSolution.expression,
            confidence: 1,
            boundingBoxes: []
          });
          
          setSolution(result);
          
          // 生成LaTeX表达式
          try {
            const latex = await generateLatex(result.expression);
            setLatexExpression(latex);
          } catch (error) {
            console.error('生成LaTeX失败:', error);
          }
          
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
          
          // 加载用户首选项
          const prefs = await getUserPreferences();
          setShowExplanation(prefs.solver.detailedExplanation);
          
        } else {
          throw new Error('无法获取数学表达式');
        }
      } catch (err) {
        console.error('解题失败:', err);
        setError(err instanceof Error ? err.message : '解题失败，请重试');
      } finally {
        setLoading(false);
      }
    };
    
    getSolution();
  }, [imageUri, initialSolution]);
  
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
    if (!solution) return;
    
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
结果: ${solution.result}

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
          onPress={() => {
            if (navigation && navigation.goBack) {
              navigation.goBack();
            }
          }}
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
              tooltip="详细解释"
            />
            <IconButton
              icon="share-outline"
              size={24}
              onPress={shareResult}
              tooltip="分享结果"
            />
          </View>
          
          {/* 题目图片 */}
          <Image source={{ uri: imageUri }} style={styles.image} />
          
          {/* 识别出的表达式 */}
          <Card style={styles.card}>
            <Card.Title title="数学表达式" />
            <Card.Content>
              <Surface style={styles.expressionContainer}>
                <Text style={styles.expression}>{solution.expression}</Text>
              </Surface>
              
              {latexExpression && (
                <View style={styles.latexContainer}>
                  <Text style={styles.latexLabel}>LaTeX 格式:</Text>
                  <Text style={styles.latexExpression} selectable>
                    {latexExpression}
                  </Text>
                </View>
              )}
              
              {solution.result && (
                <View style={styles.resultContainer}>
                  <Text style={styles.resultLabel}>结果:</Text>
                  <Text style={styles.resultText}>{solution.result}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
          
          <Divider />
          
          {/* 解题步骤 */}
          <Card style={styles.card}>
            <Card.Title title="解题步骤" />
            <Card.Content>
              {solution.steps.map((step, index) => (
                <View key={index} style={styles.stepContainer}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                  <Text style={styles.stepContent}>{step}</Text>
                </View>
              ))}
              
              {showExplanation && solution.explanation && (
                <View style={styles.explanationContainer}>
                  <Text style={styles.explanationTitle}>详细解释</Text>
                  <Text style={styles.explanationText}>{solution.explanation}</Text>
                </View>
              )}
              
              {solution.method && (
                <View style={styles.methodContainer}>
                  <Text style={styles.methodLabel}>解题方法:</Text>
                  <Text style={styles.methodText}>{solution.method}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
          
          <Divider />
          
          {/* 标签选择 */}
          <Card style={styles.card}>
            <Card.Title title="题目标签" />
            <Card.Content>
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
            </Card.Content>
          </Card>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
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
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
  },
  card: {
    margin: 12,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'contain',
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  expressionContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    elevation: 1,
  },
  expression: {
    fontSize: 18,
    fontWeight: '500',
  },
  latexContainer: {
    marginTop: 12,
  },
  latexLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  latexExpression: {
    fontSize: 14,
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
  },
  resultContainer: {
    marginTop: 16,
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#388e3c',
    marginBottom: 4,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
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
  explanationContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  methodContainer: {
    marginTop: 16,
  },
  methodLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  methodText: {
    fontSize: 14,
    fontStyle: 'italic',
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

export default ResultScreen; 