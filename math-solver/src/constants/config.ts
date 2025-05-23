/**
 * API基础URL
 * 在实际开发环境中应替换为您的后端服务地址
 */
export const API_URL = 'http://localhost:3000';

/**
 * 图表颜色配置
 * 用于统计图表显示
 */
export const CHART_COLORS = {
  BLUE: '#4A90E2',
  GREEN: '#6FCF97',
  ORANGE: '#F2994A',
  RED: '#EB5757',
  PURPLE: '#9B51E0',
  YELLOW: '#F2C94C',
};

/**
 * 题型类别
 * 用于标记题目类型
 */
export const PROBLEM_TYPES = [
  { label: '代数', value: 'algebra' },
  { label: '几何', value: 'geometry' },
  { label: '算术', value: 'arithmetic' },
  { label: '方程', value: 'equation' },
  { label: '其他', value: 'other' },
];

/**
 * 难度级别
 * 用于标记题目难度
 */
export const DIFFICULTY_LEVELS = [
  { label: '容易', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' },
]; 