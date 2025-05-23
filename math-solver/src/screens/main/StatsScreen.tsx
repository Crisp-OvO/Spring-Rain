import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Text, Card, Divider, useTheme } from 'react-native-paper';
// 注释掉victory图表，改用简单的统计显示（需要先安装victory-native才能使用）
// import { VictoryPie, VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { Ionicons } from '@expo/vector-icons';
import { getStatistics } from '../../services/mathService';
import { PROBLEM_TYPES, DIFFICULTY_LEVELS, CHART_COLORS } from '../../constants/config';

const { width } = Dimensions.get('window');
const chartWidth = width - 40;

interface StatData {
  totalProblems: number;
  masteredProblems: number;
  typeDistribution: { [key: string]: number };
  difficultyDistribution: { [key: string]: number };
  weeklyActivity: { [key: string]: number };
}

const StatsScreen: React.FC = () => {
  const theme = useTheme();
  const [stats, setStats] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载统计数据
  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getStatistics();
        setStats(data);
      } catch (err) {
        console.error('加载统计数据失败:', err);
        setError(err instanceof Error ? err.message : '加载统计数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    loadStatistics();
  }, []);
  
  // 渲染加载状态
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>加载统计数据中...</Text>
      </View>
    );
  }
  
  // 渲染错误状态
  if (error || !stats) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="stats-chart" size={64} color={theme.colors.error} />
        <Text style={styles.errorTitle}>无法加载统计数据</Text>
        <Text style={styles.errorMessage}>{error || '未知错误'}</Text>
      </View>
    );
  }
  
  // 如果没有数据
  if (stats.totalProblems === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="bar-chart-outline" size={64} color="#999" />
        <Text style={styles.emptyTitle}>暂无统计数据</Text>
        <Text style={styles.emptyMessage}>解析更多数学题目后将显示统计信息</Text>
      </View>
    );
  }
  
  // 计算掌握百分比
  const masteredPercentage = stats.totalProblems > 0 
    ? Math.round((stats.masteredProblems / stats.totalProblems) * 100) 
    : 0;
  
  // 准备题型分布数据
  const typeData = Object.keys(stats.typeDistribution).map((key) => {
    const typeName = PROBLEM_TYPES.find(t => t.value === key)?.label || key;
    const count = stats.typeDistribution[key];
    const percentage = Math.round((count / stats.totalProblems) * 100);
    return { name: typeName, count, percentage };
  });
  
  // 准备难度分布数据  
  const difficultyData = Object.keys(stats.difficultyDistribution).map((key) => {
    const difficultyName = DIFFICULTY_LEVELS.find(d => d.value === key)?.label || key;
    const count = stats.difficultyDistribution[key];
    const percentage = Math.round((count / stats.totalProblems) * 100);
    return { name: difficultyName, count, percentage };
  });
  
  // 准备活动数据
  const activityData = Object.keys(stats.weeklyActivity).map(date => ({
    date: date.substring(5), // 只保留月-日部分
    count: stats.weeklyActivity[date]
  }));
  
  return (
    <ScrollView style={styles.container}>
      {/* 顶部摘要卡片 */}
      <Card style={styles.summaryCard}>
        <Card.Content style={styles.summaryContent}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{stats.totalProblems}</Text>
            <Text style={styles.summaryLabel}>总题数</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{stats.masteredProblems}</Text>
            <Text style={styles.summaryLabel}>已掌握</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{masteredPercentage}%</Text>
            <Text style={styles.summaryLabel}>掌握率</Text>
          </View>
        </Card.Content>
      </Card>
      
      {/* 题型分布 */}
      <Card style={styles.chartCard}>
        <Card.Title title="题型分布" />
        <Card.Content>
          {typeData.map((item, index) => (
            <View key={index} style={styles.statItem}>
              <View style={styles.statHeader}>
                <View style={[styles.statColor, { backgroundColor: Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length] }]} />
                <Text style={styles.statName}>{item.name}</Text>
                <Text style={styles.statPercentage}>{item.percentage}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${item.percentage}%`,
                      backgroundColor: Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]
                    }
                  ]} 
                />
              </View>
              <Text style={styles.statCount}>{item.count} 题</Text>
            </View>
          ))}
        </Card.Content>
      </Card>
      
      {/* 难度分布 */}
      <Card style={styles.chartCard}>
        <Card.Title title="难度分布" />
        <Card.Content>
          {difficultyData.map((item, index) => (
            <View key={index} style={styles.statItem}>
              <View style={styles.statHeader}>
                <View style={[styles.statColor, { backgroundColor: Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length] }]} />
                <Text style={styles.statName}>{item.name}</Text>
                <Text style={styles.statPercentage}>{item.percentage}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${item.percentage}%`,
                      backgroundColor: Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]
                    }
                  ]} 
                />
              </View>
              <Text style={styles.statCount}>{item.count} 题</Text>
            </View>
          ))}
        </Card.Content>
      </Card>
      
      {/* 每周活动 */}
      {activityData.length > 0 && (
        <Card style={styles.chartCard}>
          <Card.Title title="近期活动" />
          <Card.Content>
            {activityData.map((item, index) => (
              <View key={index} style={styles.activityItem}>
                <Text style={styles.activityDate}>{item.date}</Text>
                <View style={styles.activityBarContainer}>
                  <View 
                    style={[
                      styles.activityBar, 
                      { 
                        height: Math.max(item.count * 10, 5),
                        backgroundColor: theme.colors.primary
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.activityCount}>{item.count}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
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
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#ddd',
  },
  chartCard: {
    marginBottom: 16,
  },
  // 新增样式
  statItem: {
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statName: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
  },
  statPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  activityItem: {
    alignItems: 'center',
    width: '14.28%', // 七天等分
    paddingHorizontal: 2,
  },
  activityBarContainer: {
    height: 100,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  activityBar: {
    width: 20,
    borderRadius: 4,
  },
  activityDate: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  activityCount: {
    fontSize: 10,
    color: '#666',
  },
});

export default StatsScreen; 