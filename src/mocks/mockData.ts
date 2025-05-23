/**
 * 模拟数据
 * 用于离线模式和开发测试
 */

// 用户首选项
export const mockUserPreferences = {
  theme: 'system',
  notificationsEnabled: true,
  syncEnabled: true,
  ocr: {
    autoCorrect: true,
    highAccuracyMode: true
  },
  solver: {
    showSteps: true,
    detailedExplanation: true,
    mathFormat: 'normal'
  },
  privacy: {
    shareData: true,
    saveHistory: true
  }
};

// 模拟解题历史
export const mockHistory = [
  {
    id: 'problem_1',
    expression: '2x + 5 = 15',
    steps: [
      { description: '将等式两边同时减去5', formula: '2x = 10' },
      { description: '将等式两边同时除以2', formula: 'x = 5' }
    ],
    result: 'x = 5',
    timestamp: new Date().toISOString(),
    type: 'equation',
    difficulty: 'easy',
    mastered: true
  },
  {
    id: 'problem_2',
    expression: 'x^2 - 4 = 0',
    steps: [
      { description: '将方程变形', formula: 'x^2 = 4' },
      { description: '取平方根', formula: 'x = ±2' },
      { description: '得到两个解', formula: 'x = 2 或 x = -2' }
    ],
    result: 'x = 2 或 x = -2',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    type: 'equation',
    difficulty: 'medium',
    mastered: false
  }
];

// OCR识别模拟结果
export const mockOCRResult = (expression: string) => ({
  text: expression,
  mathExpression: expression,
  confidence: 0.95,
  boundingBoxes: []
});

// 模拟数学解析结果
export const mockMathSolution = {
  id: `problem_${Date.now()}`,
  expression: '2x + 5 = 15',
  steps: [
    { description: '分析表达式: 2x + 5 = 15', formula: '2x + 5 = 15' },
    { description: '将等式两边同时减去5', formula: '2x = 10' },
    { description: '将等式两边同时除以2', formula: 'x = 5' }
  ],
  result: 'x = 5',
  timestamp: new Date().toISOString(),
  type: 'equation',
  difficulty: 'easy',
  mastered: false
};

// 模拟用户数据
export const mockUserProfile = {
  id: 'user_123',
  email: 'test@example.com',
  name: '测试用户',
  createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  lastLoginAt: new Date().toISOString(),
  subscription: {
    type: 'free',
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString()
  },
  stats: {
    solvedProblems: 28,
    masteredConcepts: 12,
    streak: 5
  }
};

// 模拟统计数据
export const mockStatistics = {
  totalProblems: 28,
  masteredProblems: 15,
  typeDistribution: {
    'algebra': 12,
    'geometry': 8,
    'arithmetic': 6,
    'equation': 2
  },
  difficultyDistribution: {
    'easy': 10,
    'medium': 15,
    'hard': 3
  },
  weeklyActivity: {
    '2023-10-01': 3,
    '2023-10-02': 5,
    '2023-10-03': 2,
    '2023-10-04': 4,
    '2023-10-05': 1,
    '2023-10-06': 0,
    '2023-10-07': 2
  }
}; 