import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

import { RootState } from '../store';
import { navigate } from '../navigation/RootNavigation';
import { PROBLEM_TYPE_LABELS, DIFFICULTY_LABELS } from '../constants/config';

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { problems, isLoading } = useSelector((state: RootState) => state.math);
  const { profile, statistics } = useSelector((state: RootState) => state.user);
  
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('上午好');
    } else if (hour < 18) {
      setGreeting('下午好');
    } else {
      setGreeting('晚上好');
    }
  }, []);

  const recentProblems = problems.slice(0, 3);

  const quickActions = [
    {
      id: 'camera',
      title: '拍照解题',
      description: '拍摄数学题目，AI智能识别解答',
      icon: 'camera',
      color: ['#667eea', '#764ba2'],
      onPress: () => navigate('Camera'),
    },
    {
      id: 'input',
      title: '手动输入',
      description: '直接输入数学表达式求解',
      icon: 'create',
      color: ['#f093fb', '#f5576c'],
      onPress: () => navigate('Solve'),
    },
    {
      id: 'history',
      title: '历史记录',
      description: '查看之前的解题记录',
      icon: 'time',
      color: ['#4facfe', '#00f2fe'],
      onPress: () => navigate('History'),
    },
    {
      id: 'settings',
      title: '设置',
      description: '个人设置和模型配置',
      icon: 'settings',
      color: ['#43e97b', '#38f9d7'],
      onPress: () => navigate('Settings'),
    },
  ];

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Icon name={icon} size={20} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const QuickActionCard = ({ item }: any) => (
    <TouchableOpacity onPress={item.onPress} style={styles.actionCard}>
      <LinearGradient
        colors={item.color}
        style={styles.actionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon name={item.icon} size={24} color="white" />
        <Text style={styles.actionTitle}>{item.title}</Text>
        <Text style={styles.actionDescription}>{item.description}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const RecentProblemCard = ({ problem }: any) => (
    <TouchableOpacity 
      style={styles.problemCard}
      onPress={() => navigate('Result', { problem })}
    >
      <View style={styles.problemHeader}>
        <View style={[styles.typeTag, { backgroundColor: getTypeColor(problem.type) }]}>
          <Text style={styles.typeText}>{getTypeLabel(problem.type)}</Text>
        </View>
        <Text style={styles.problemTime}>
          {new Date(problem.timestamp).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.problemExpression} numberOfLines={2}>
        {problem.expression}
      </Text>
      <Text style={styles.problemResult} numberOfLines={1}>
        答案: {problem.result}
      </Text>
    </TouchableOpacity>
  );

  function getTypeColor(type: string) {
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
  }

  function getTypeLabel(type: string) {
    return PROBLEM_TYPE_LABELS[type as keyof typeof PROBLEM_TYPE_LABELS] || PROBLEM_TYPE_LABELS.other;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 头部欢迎区域 */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>
            {greeting}
            {profile?.name ? `, ${profile.name}!` : '!'}
          </Text>
          <Text style={styles.subtitle}>Qwen数学解题助手</Text>
        </View>
        
        {profile?.avatar && (
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
        )}
      </LinearGradient>

      {/* 统计卡片 */}
      <View style={styles.statsContainer}>
        <StatCard
          title="总题目"
          value={statistics.totalProblems}
          icon="calculator"
          color="#667eea"
        />
        <StatCard
          title="已掌握"
          value={statistics.masteredProblems}
          icon="checkmark-circle"
          color="#43e97b"
        />
      </View>

      {/* 快捷操作 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>快捷操作</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <QuickActionCard key={action.id} item={action} />
          ))}
        </View>
      </View>

      {/* 最近问题 */}
      {recentProblems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近解题</Text>
            <TouchableOpacity onPress={() => navigate('History')}>
              <Text style={styles.viewAllText}>查看全部</Text>
            </TouchableOpacity>
          </View>
          
          {recentProblems.map((problem) => (
            <RecentProblemCard key={problem.id} problem={problem} />
          ))}
        </View>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>正在处理...</Text>
        </View>
      )}
    </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  actionCard: {
    width: (width - 55) / 2,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  problemTime: {
    fontSize: 12,
    color: '#6b7280',
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
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
});

export default HomeScreen; 