import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, useTheme, Button } from 'react-native-paper';
import { VictoryPie, VictoryChart, VictoryBar, VictoryLine, VictoryAxis, VictoryLabel, VictoryTheme } from 'victory-native';
import { getStats } from '../../services/mathService';
import { CHART_COLORS, PROBLEM_TYPES } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

// 图表配置
const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 40;

/**
 * 统计屏幕
 * 显示用户解题情况的各种统计图表
 */
const StatsScreen: React.FC = () => {
  const theme = useTheme();
  
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // 加载统计数据
  const loadStats = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      const data = await getStats();
      setStats(data);
    } catch (err) {
      console.error('获取统计数据失败:', err);
      setError(err instanceof Error ? err.message : '获取统计数据失败，请重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // 初始加载
  useEffect(() => {
    loadStats();
  }, []);
  
  // 处理下拉刷新
  const handleRefresh = () => {
    setRefreshing(true);
    loadStats(false);
  };
  
  // 准备题型分布数据
  const preparePieData = () => {
    if (!stats || !stats.by_type) return [];
    
    return Object.entries(stats.by_type).map(([type, count]: [string, number], index) => {
      // 找到对应的类型标签
      const typeLabel = PROBLEM_TYPES.find(t => t.value === type)?.label || type;
      
      // 选择颜色
      const colorKeys = Object.keys(CHART_COLORS);
      const colorKey = colorKeys[index % colorKeys.length];
      const color = CHART_COLORS[colorKey as keyof typeof CHART_COLORS];
      
      return {
        x: typeLabel,
        y: count,
        fill: color,
      };
    });
  };
  
  // 准备每日解题趋势数据
  const prepareTrendData = () => {
    if (!stats || !stats.by_date) return [];
    
    return Object.entries(stats.by_date)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, count]: [string, number]) => {
        // 格式化日期，只显示月和日
        const formattedDate = new Date(date).toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric',
        });
        
        return {
          x: formattedDate,
          y: count,
        };
      });
  };
  
  // 准备错误率数据
  const prepareErrorRateData = () => {
    if (!stats || !stats.error_rate) return [];
    
    return Object.entries(stats.error_rate).map(([type, rate]: [string, number], index) => {
      // 找到对应的类型标签
      const typeLabel = PROBLEM_TYPES.find(t => t.value === type)?.label || type;
      
      return {
        x: typeLabel,
        y: rate,
        fill: rate > 0.5 ? CHART_COLORS.RED : CHART_COLORS.GREEN,
      };
    });
  };
  
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
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="analytics-outline" size={64} color={theme.colors.error} />
        <Text style={styles.errorTitle}>加载失败</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={() => loadStats()}
          style={styles.retryButton}
        >
          重试
        </Button>
      </View>
    );
  }
  
  // 如果没有足够的数据
  if (!stats || !stats.total_solved || stats.total_solved === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="bar-chart-outline" size={64} color="#999" />
        <Text style={styles.emptyTitle}>暂无统计数据</Text>
        <Text style={styles.emptyMessage}>
          解题后，我们将为您生成数据统计和图表分析
        </Text>
      </View>
    );
  }
  
  // 准备图表数据
  const pieData = preparePieData();
  const trendData = prepareTrendData();
  const errorRateData = prepareErrorRateData();
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* 总解题数 */}
      <Card style={styles.card}>
        <Card.Content style={styles.totalSolvedContainer}>
          <View>
            <Text style={styles.totalSolvedLabel}>累计解题</Text>
            <Text style={styles.totalSolvedValue}>{stats.total_solved}</Text>
          </View>
          <Ionicons name="school-outline" size={48} color={theme.colors.primary} />
        </Card.Content>
      </Card>
      
      {/* 题型分布 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>题型分布</Text>
          <View style={styles.chartContainer}>
            {pieData.length > 0 ? (
              <VictoryPie
                data={pieData}
                width={chartWidth}
                height={chartWidth * 0.8}
                colorScale={pieData.map(item => item.fill)}
                innerRadius={chartWidth * 0.15}
                labelRadius={chartWidth * 0.35}
                style={{ 
                  labels: { 
                    fontSize: 14, 
                    fill: '#333333',
                  },
                }}
                labelPlacement="parallel"
                labels={({ datum }) => `${datum.x}: ${datum.y}`}
              />
            ) : (
              <Text style={styles.noDataText}>暂无题型数据</Text>
            )}
          </View>
        </Card.Content>
      </Card>
      
      {/* 解题趋势 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>解题趋势</Text>
          <View style={styles.chartContainer}>
            {trendData.length > 0 ? (
              <VictoryChart
                width={chartWidth}
                height={chartWidth * 0.6}
                padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
                theme={VictoryTheme.material}
              >
                <VictoryAxis
                  tickFormat={(x) => x}
                  style={{
                    tickLabels: { fontSize: 10, angle: -45, textAnchor: 'end' }
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(t) => Math.round(t)}
                />
                <VictoryLine
                  data={trendData}
                  style={{
                    data: { stroke: theme.colors.primary, strokeWidth: 2 },
                  }}
                />
                <VictoryBar
                  data={trendData}
                  style={{
                    data: { fill: theme.colors.primary + '80' },
                  }}
                  barWidth={10}
                />
              </VictoryChart>
            ) : (
              <Text style={styles.noDataText}>暂无趋势数据</Text>
            )}
          </View>
        </Card.Content>
      </Card>
      
      {/* 错误率 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>错误率分析</Text>
          <View style={styles.chartContainer}>
            {errorRateData.length > 0 ? (
              <VictoryChart
                width={chartWidth}
                height={chartWidth * 0.6}
                domainPadding={{ x: 30 }}
                padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
                theme={VictoryTheme.material}
              >
                <VictoryAxis
                  tickFormat={(x) => x}
                  style={{
                    tickLabels: { fontSize: 10, angle: -45, textAnchor: 'end' }
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(t) => `${Math.round(t * 100)}%`}
                />
                <VictoryBar
                  data={errorRateData}
                  style={{
                    data: { fill: ({ datum }) => datum.fill }
                  }}
                  barWidth={30}
                  labels={({ datum }) => `${Math.round(datum.y * 100)}%`}
                  labelComponent={
                    <VictoryLabel
                      dy={-10}
                      style={{ fontSize: 12 }}
                    />
                  }
                />
              </VictoryChart>
            ) : (
              <Text style={styles.noDataText}>暂无错误率数据</Text>
            )}
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  totalSolvedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalSolvedLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalSolvedValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
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
  noDataText: {
    fontSize: 14,
    color: '#999',
    marginVertical: 30,
  },
});

export default StatsScreen; 