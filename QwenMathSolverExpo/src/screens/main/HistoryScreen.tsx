import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Text, Card, Chip, Searchbar, Button, ActivityIndicator, useTheme, Menu, Divider } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { getHistory, ProblemSolution, HistoryQueryParams } from '../../services/mathService';
import { PROBLEM_TYPES, DIFFICULTY_LEVELS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

type HistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

interface HistoryScreenProps {
  navigation: HistoryScreenNavigationProp;
}

/**
 * 历史记录屏幕
 * 显示用户解题的历史记录，支持筛选和搜索
 */
const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  
  const [records, setRecords] = useState<ProblemSolution[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ProblemSolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [showMastered, setShowMastered] = useState<boolean | null>(null);
  
  // 加载历史记录
  const loadHistory = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      // 构建查询参数
      const params: HistoryQueryParams = {};
      if (selectedType) params.type = selectedType;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;
      if (showMastered !== null) params.mastered = showMastered;
      
      const data = await getHistory(params);
      setRecords(data);
      setFilteredRecords(data);
      applySearchFilter(data, searchQuery);
    } catch (err) {
      console.error('获取历史记录失败:', err);
      setError(err instanceof Error ? err.message : '获取历史记录失败，请重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // 当页面获得焦点时刷新数据
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [selectedType, selectedDifficulty, showMastered])
  );
  
  // 处理下拉刷新
  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory(false);
  };
  
  // 应用搜索过滤
  const applySearchFilter = (data: ProblemSolution[], query: string) => {
    if (!query.trim()) {
      setFilteredRecords(data);
      return;
    }
    
    const filtered = data.filter(record => 
      record.expression.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredRecords(filtered);
  };
  
  // 处理搜索查询变化
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    applySearchFilter(records, query);
  };
  
  // 重置所有筛选条件
  const resetFilters = () => {
    setSelectedType(null);
    setSelectedDifficulty(null);
    setShowMastered(null);
    setSearchQuery('');
    
    // 重新加载数据
    loadHistory();
  };
  
  // 处理导航到历史记录详情
  const navigateToDetail = (problemId: string) => {
    navigation.navigate('HistoryDetail', { problemId });
  };
  
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
  
  // 渲染历史记录项
  const renderHistoryItem = ({ item }: { item: ProblemSolution }) => {
    // 查找题型和难度的标签名称
    const typeName = PROBLEM_TYPES.find(t => t.value === item.type)?.label || '未分类';
    const difficultyName = DIFFICULTY_LEVELS.find(d => d.value === item.difficulty)?.label || '未标记';
    
    // 生成单条历史记录的摘要（展示前50个字符）
    const expressionSummary = item.expression.length > 50
      ? item.expression.substring(0, 50) + '...'
      : item.expression;
    
    return (
      <Card 
        style={styles.card}
        onPress={() => navigateToDetail(item.id)}
      >
        <Card.Content>
          <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
          
          <Text style={styles.expression}>{expressionSummary}</Text>
          
          <View style={styles.tagsContainer}>
            <Chip 
              style={[styles.tagChip, { backgroundColor: theme.colors.primary + '20' }]}
              textStyle={{ color: theme.colors.primary }}
            >
              {typeName}
            </Chip>
            
            <Chip 
              style={[styles.tagChip, { backgroundColor: theme.colors.secondary + '20' }]}
              textStyle={{ color: theme.colors.secondary }}
            >
              {difficultyName}
            </Chip>
            
            {item.mastered !== undefined && (
              <Chip 
                style={[
                  styles.tagChip, 
                  { 
                    backgroundColor: item.mastered 
                      ? theme.colors.success + '20' 
                      : theme.colors.error + '20' 
                  }
                ]}
                textStyle={{ 
                  color: item.mastered ? theme.colors.success : theme.colors.error 
                }}
                icon={item.mastered ? "check-circle" : "close-circle"}
              >
                {item.mastered ? '已掌握' : '未掌握'}
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <Searchbar
        placeholder="搜索历史记录..."
        onChangeText={handleSearchChange}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      {/* 筛选区域 */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterButtonsRow}>
          {/* 题型筛选 */}
          <Menu
            visible={showTypeMenu}
            onDismiss={() => setShowTypeMenu(false)}
            anchor={
              <Button 
                mode="outlined" 
                onPress={() => setShowTypeMenu(true)}
                icon="filter-variant"
                style={[
                  styles.filterButton,
                  selectedType ? { borderColor: theme.colors.primary } : null
                ]}
              >
                {selectedType 
                  ? PROBLEM_TYPES.find(t => t.value === selectedType)?.label 
                  : '题型'}
              </Button>
            }
          >
            <Menu.Item 
              onPress={() => {
                setSelectedType(null);
                setShowTypeMenu(false);
              }} 
              title="全部" 
            />
            <Divider />
            {PROBLEM_TYPES.map(type => (
              <Menu.Item
                key={type.value}
                onPress={() => {
                  setSelectedType(type.value);
                  setShowTypeMenu(false);
                }}
                title={type.label}
              />
            ))}
          </Menu>
          
          {/* 难度筛选 */}
          <Menu
            visible={showDifficultyMenu}
            onDismiss={() => setShowDifficultyMenu(false)}
            anchor={
              <Button 
                mode="outlined" 
                onPress={() => setShowDifficultyMenu(true)}
                icon="star"
                style={[
                  styles.filterButton,
                  selectedDifficulty ? { borderColor: theme.colors.primary } : null
                ]}
              >
                {selectedDifficulty 
                  ? DIFFICULTY_LEVELS.find(d => d.value === selectedDifficulty)?.label 
                  : '难度'}
              </Button>
            }
          >
            <Menu.Item 
              onPress={() => {
                setSelectedDifficulty(null);
                setShowDifficultyMenu(false);
              }} 
              title="全部" 
            />
            <Divider />
            {DIFFICULTY_LEVELS.map(difficulty => (
              <Menu.Item
                key={difficulty.value}
                onPress={() => {
                  setSelectedDifficulty(difficulty.value);
                  setShowDifficultyMenu(false);
                }}
                title={difficulty.label}
              />
            ))}
          </Menu>
          
          {/* 掌握状态切换 */}
          <Button 
            mode="outlined" 
            onPress={() => setShowMastered(showMastered === null ? true : (showMastered ? false : null))}
            icon={showMastered === true ? "check-circle" : (showMastered === false ? "close-circle" : "help-circle")}
            style={[
              styles.filterButton,
              showMastered !== null ? { borderColor: theme.colors.primary } : null
            ]}
          >
            {showMastered === true 
              ? '已掌握' 
              : (showMastered === false ? '未掌握' : '掌握状态')}
          </Button>
        </View>
        
        {/* 重置筛选按钮 */}
        {(selectedType || selectedDifficulty || showMastered !== null || searchQuery) && (
          <Button 
            mode="text" 
            onPress={resetFilters}
            icon="refresh"
            style={styles.resetButton}
          >
            重置筛选
          </Button>
        )}
      </View>
      
      {/* 列表或错误/加载状态 */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>加载历史记录中...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cloud-offline-outline" size={64} color={theme.colors.error} />
          <Text style={styles.errorTitle}>加载失败</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={() => loadHistory()}
            style={styles.retryButton}
          >
            重试
          </Button>
        </View>
      ) : filteredRecords.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="document-text-outline" size={64} color="#999" />
          <Text style={styles.emptyTitle}>
            {searchQuery || selectedType || selectedDifficulty || showMastered !== null 
              ? '没有匹配的记录' 
              : '暂无历史记录'}
          </Text>
          <Text style={styles.emptyMessage}>
            {searchQuery || selectedType || selectedDifficulty || showMastered !== null 
              ? '尝试调整筛选条件或清除搜索内容' 
              : '解析一道数学题目，开始记录您的学习历程'}
          </Text>
          {(searchQuery || selectedType || selectedDifficulty || showMastered !== null) && (
            <Button 
              mode="outlined" 
              onPress={resetFilters}
              style={styles.resetButton}
            >
              清除筛选条件
            </Button>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          renderItem={renderHistoryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 8,
    elevation: 2,
  },
  filtersContainer: {
    padding: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  resetButton: {
    alignSelf: 'flex-end',
  },
  listContainer: {
    padding: 8,
  },
  card: {
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  expression: {
    fontSize: 16,
    marginVertical: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    maxWidth: 300,
  },
  retryButton: {
    paddingHorizontal: 24,
  },
});

export default HistoryScreen; 