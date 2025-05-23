const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
// 引入mathjs库用于数学计算和解析
const math = require('mathjs');

const app = express();
const PORT = 3000;

// 创建uploads目录
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 允许跨域请求
app.use(cors());

// 解析JSON请求体，增加限制大小
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 处理静态文件
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('public'));

// 内存存储 - 实际应用中应使用数据库
const historyRecords = [];

// Hugging Face API配置
const HUGGING_FACE_API = {
  KEY: process.env.HUGGING_FACE_API_KEY || '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',
  OCR_MODEL_URL: 'https://api.huggingface.co/models/microsoft/trocr-base-handwritten'
};

// DeepSeekMath API配置
const DEEPSEEK_MATH_API = {
  KEY: process.env.DEEPSEEK_MATH_API_KEY || process.env.HUGGING_FACE_API_KEY || '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',
  MODEL_URL: 'https://api.huggingface.co/models/deepseek-ai/deepseek-math-7b-instruct'
};

// 模拟数据
const mockData = {
  preferences: {
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
  },
  user: {
    id: 'user123',
    email: 'user@example.com',
    name: '测试用户',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  }
};

// 用户首选项接口
app.get('/user/preferences', (req, res) => {
  res.json({ preferences: mockData.preferences });
});

// 用户资料接口
app.get('/user/profile', (req, res) => {
  res.json({ profile: mockData.user });
});

// OCR识别接口 - 接收JSON格式的数据
app.post('/ocr/math', async (req, res) => {
  console.log('收到OCR请求');
  
  try {
    // 尝试从请求中获取图片数据
    const imageUri = req.body.imageUri;
    const base64Image = req.body.base64Image;
    
    if (!imageUri && !base64Image) {
      return res.status(400).json({ error: '缺少图片数据' });
    }
    
    console.log('图片URI:', imageUri ? '已提供' : '未提供');
    console.log('Base64图片:', base64Image ? '已提供' : '未提供');

    // 调用Hugging Face API进行OCR识别
    try {
      let imageData;
      
      if (base64Image && base64Image.startsWith('data:image')) {
        // 处理base64图片
        console.log('使用base64图片数据');
        const base64Data = base64Image.split(',')[1];
        imageData = Buffer.from(base64Data, 'base64');
      } else if (imageUri && imageUri.startsWith('http')) {
        // 处理网络图片
        console.log('下载网络图片');
        const response = await axios.get(imageUri, { responseType: 'arraybuffer' });
        imageData = Buffer.from(response.data);
      } else {
        // 移动设备本地文件URI，返回错误告知需要使用base64格式
        console.log('无法直接处理移动设备文件URI，需要base64编码');
        return res.status(400).json({ 
          error: '图片格式不支持', 
          message: '移动设备本地文件需要转换为base64格式后提交',
          status: 'error'
        });
      }

      // 调用Hugging Face API
      console.log('调用Hugging Face OCR API...');
      const huggingFaceResponse = await axios.post(
        HUGGING_FACE_API.OCR_MODEL_URL,
        imageData,
        {
          headers: {
            'Authorization': `Bearer ${HUGGING_FACE_API.KEY}`,
            'Content-Type': 'application/octet-stream'
          },
          responseType: 'json'
        }
      );

      // 处理API响应
      console.log('Hugging Face API调用成功');
      
      // TrOCR模型通常直接返回识别的文本字符串
      let recognizedText = '';
      if (typeof huggingFaceResponse.data === 'string') {
        recognizedText = huggingFaceResponse.data;
      } else if (huggingFaceResponse.data && huggingFaceResponse.data.generated_text) {
        // 某些模型可能返回一个包含generated_text字段的对象
        recognizedText = huggingFaceResponse.data.generated_text;
      } else {
        // 如果返回格式不明确，尝试将响应转换为字符串
        recognizedText = JSON.stringify(huggingFaceResponse.data);
      }
      
      console.log('识别的文本:', recognizedText);
      
      // 格式化为OCR结果
      const ocrResult = {
        text: recognizedText,
        mathExpression: recognizedText, // 直接使用识别文本作为数学表达式
        confidence: 0.9, // API可能不提供置信度
        boundingBoxes: [], // API可能不提供边界框
        imageUrl: imageUri || base64Image.substring(0, 30) + '...',
        timestamp: new Date().toISOString(),
        status: 'success',
        id: `ocr_${Date.now()}`
      };
      
      console.log('返回OCR结果');
      res.json(ocrResult);
    } catch (apiError) {
      console.error('Hugging Face API调用失败:', apiError.message);
      
      // 如果API调用失败，返回错误信息
      res.status(500).json({ 
        error: 'OCR API调用失败', 
        message: apiError.message,
        status: 'error',
        text: '',
        mathExpression: '',
        confidence: 0,
        boundingBoxes: [],
        imageUrl: imageUri || 'unknown'
      });
    }
  } catch (error) {
    console.error('OCR服务通用错误:', error.message);
    res.status(500).json({ 
      error: '识别失败', 
      message: error.message,
      status: 'error',
      text: '',
      mathExpression: '',
      confidence: 0,
      boundingBoxes: []
    });
  }
});

// 验证OCR结果接口
app.post('/ocr/validate', (req, res) => {
  console.log('收到OCR验证请求:', req.body);
  const { correctedExpression } = req.body;
  const result = {
    mathExpression: correctedExpression,
    text: correctedExpression,
    confidence: 1.0
  };
  console.log('返回验证结果:', result);
  res.json(result);
});

// 解析数学表达式接口 - 使用DeepSeekMath模型
app.post('/math/solve', async (req, res) => {
  console.log('收到解题请求:', req.body);
  const { expression } = req.body;
  
  if (!expression) {
    return res.status(400).json({ error: '缺少表达式参数' });
  }
  
  try {
    console.log('开始解析表达式:', expression);
    
    // 创建解题结果对象
    const solution = {
      id: `problem_${Date.now()}`,
      expression,
      steps: [],
      result: '',
      latex: expression,
      method: '数学推理模型',
      explanation: '',
      type: determineExpressionType(expression),
      difficulty: determineDifficulty(expression),
      timestamp: new Date().toISOString()
    };
    
    try {
      // 构建提示词
      const prompt = `请解决以下数学问题，并提供详细的解题步骤：\n${expression}\n请首先分析问题类型，然后按照逻辑顺序给出解题步骤，最后给出结果。`;
      
      // 调用DeepSeekMath模型
      console.log('调用DeepSeekMath API...');
      const deepseekResponse = await axios.post(
        DEEPSEEK_MATH_API.MODEL_URL,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 512,
            temperature: 0.2,
            top_p: 0.9,
            do_sample: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${DEEPSEEK_MATH_API.KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('DeepSeekMath API调用成功');
      
      // 处理API响应
      let modelOutput = '';
      if (typeof deepseekResponse.data === 'string') {
        modelOutput = deepseekResponse.data;
      } else if (deepseekResponse.data && deepseekResponse.data.generated_text) {
        modelOutput = deepseekResponse.data.generated_text;
      } else {
        modelOutput = JSON.stringify(deepseekResponse.data);
      }
      
      // 解析模型输出
      console.log('解析模型输出');
      
      // 尝试从输出中提取步骤和结果
      const lines = modelOutput.split('\n').filter(line => line.trim());
      
      // 找到答案或结果
      let resultLine = lines.find(line => 
        line.includes('答案') || 
        line.includes('结果') || 
        line.includes('solution') || 
        line.includes('=')
      );
      
      // 步骤是除了前两行（可能是重复问题）之外的所有行
      let steps = lines.slice(2);
      
      // 如果找不到明确的结果行，使用最后一行
      if (!resultLine && steps.length > 0) {
        resultLine = steps[steps.length - 1];
      }
      
      solution.steps = steps;
      solution.result = resultLine || '无法确定结果';
      solution.explanation = modelOutput;
      
    } catch (modelError) {
      console.error('DeepSeekMath API调用失败:', modelError.message);
      
      // 如果API调用失败，使用mathjs作为备份方案
      solution.steps.push('数学推理模型调用失败，使用备用方法');
      
      if (expression.includes('=')) {
        // 方程处理的简化逻辑
        solution.steps.push(`原方程: ${expression}`);
        solution.steps.push('由于模型不可用，无法提供详细步骤');
        solution.result = '请稍后重试';
      } else {
        // 表达式计算的简化逻辑
        try {
          const result = math.evaluate(expression);
          solution.steps.push(`表达式求值: ${expression} = ${result}`);
          solution.result = `${result}`;
        } catch (err) {
          solution.steps.push(`计算失败: ${err.message}`);
          solution.result = '表达式格式错误';
        }
      }
    }
    
    console.log('解题完成:', solution.result);
    res.json(solution);
  } catch (error) {
    console.error('解题失败:', error);
    res.status(500).json({
      error: '解题失败',
      message: error.message,
      expression,
      steps: ['解题过程出错'],
      result: '求解失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 生成LaTeX格式接口
app.post('/math/latex', (req, res) => {
  console.log('收到LaTeX生成请求:', req.body);
  const { expression } = req.body;
  
  if (!expression) {
    console.error('缺少表达式参数');
    return res.status(400).json({ 
      error: '缺少参数', 
      message: '需要提供expression参数' 
    });
  }
  
  try {
    // 使用mathjs解析表达式，然后转换为LaTeX
    const node = math.parse(expression);
    const latex = node.toTex({
      parenthesis: 'keep',
      implicit: 'show'
    });
    
    const result = { 
      expression,
      latex,
      formatted: true
    };
    
    console.log('返回LaTeX结果:', result);
    res.json(result);
  } catch (error) {
    console.error('生成LaTeX失败:', error);
    
    // 简单转换(备用方案)
    const simpleLatex = expression
      .replace(/\*/g, '\\cdot ')
      .replace(/\//g, '\\frac{')
      .replace(/\^/g, '^{');
    
    res.json({ 
      expression,
      latex: simpleLatex,
      formatted: false,
      error: error.message
    });
  }
});

// 历史记录接口
app.get('/user/history', (req, res) => {
  console.log('获取历史记录');
  // 如果有内存存储的记录就返回，否则返回模拟数据
  if (historyRecords.length > 0) {
    res.json(historyRecords);
  } else {
    res.json([
      {
        id: 'problem_1',
        expression: '2x + 5 = 15',
        steps: ['移项: 2x = 10', '除以2: x = 5'],
        result: 'x = 5',
        timestamp: new Date().toISOString(),
        type: 'algebra',
        difficulty: 'easy',
        mastered: true
      },
      {
        id: 'problem_2',
        expression: 'x^2 - 4 = 0',
        steps: ['因式分解: (x+2)(x-2) = 0', '求解: x = 2 或 x = -2'],
        result: 'x = 2 或 x = -2',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        type: 'algebra',
        difficulty: 'medium',
        mastered: false
      }
    ]);
  }
});

// 保存历史记录接口
app.post('/user/history', (req, res) => {
  console.log('收到历史记录保存请求:', req.body);
  
  try {
    const { problemId, solution } = req.body;
    
    if (solution) {
      // 保存到内存中 - 实际应用应保存到数据库
      historyRecords.unshift(solution);
      
      // 限制最多保存100条记录
      if (historyRecords.length > 100) {
        historyRecords.pop();
      }
      
      res.json({ 
        success: true, 
        message: '历史记录已保存',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({ error: '无效的解题记录' });
    }
  } catch (error) {
    console.error('保存历史记录失败:', error);
    res.status(500).json({ error: '保存失败', message: error.message });
  }
});

// 更新历史记录接口
app.put('/user/history/:id', (req, res) => {
  console.log(`更新历史记录 ID: ${req.params.id}`, req.body);
  
  try {
    const recordId = req.params.id;
    const updates = req.body;
    
    // 查找并更新记录
    const recordIndex = historyRecords.findIndex(record => record.id === recordId);
    
    if (recordIndex !== -1) {
      // 更新记录
      historyRecords[recordIndex] = {
        ...historyRecords[recordIndex],
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      
      res.json({
        success: true,
        message: `历史记录 ${recordId} 已更新`,
        updatedFields: updates
      });
    } else {
      res.status(404).json({ error: '找不到指定的记录' });
    }
  } catch (error) {
    console.error('更新历史记录失败:', error);
    res.status(500).json({ error: '更新失败', message: error.message });
  }
});

// 统计数据接口
app.get('/user/statistics', (req, res) => {
  console.log('获取统计数据');
  
  try {
    // 根据历史记录计算统计数据
    const totalProblems = historyRecords.length;
    const masteredProblems = historyRecords.filter(item => item.mastered).length;
    
    // 题型分布
    const typeDistribution = {};
    historyRecords.forEach(item => {
      if (item.type) {
        typeDistribution[item.type] = (typeDistribution[item.type] || 0) + 1;
      } else {
        typeDistribution['other'] = (typeDistribution['other'] || 0) + 1;
      }
    });
    
    // 难度分布
    const difficultyDistribution = {};
    historyRecords.forEach(item => {
      if (item.difficulty) {
        difficultyDistribution[item.difficulty] = (difficultyDistribution[item.difficulty] || 0) + 1;
      } else {
        difficultyDistribution['medium'] = (difficultyDistribution['medium'] || 0) + 1;
      }
    });
    
    res.json({
      statistics: {
        totalProblems,
        masteredProblems,
        typeDistribution,
        difficultyDistribution,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: '获取统计失败', message: error.message });
  }
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`对外IP地址: http://192.168.31.160:${PORT}`);
  console.log(`使用Hugging Face OCR API: ${HUGGING_FACE_API.OCR_MODEL_URL}`);
  console.log(`使用DeepSeekMath API: ${DEEPSEEK_MATH_API.MODEL_URL}`);
});

// 辅助函数

// 确定表达式类型
function determineExpressionType(expr) {
  if (expr.includes('=')) {
    if (expr.match(/x\^2/) || expr.match(/x²/) || expr.match(/\([^)]*\)\^2/)) {
      return 'quadratic';
    } else if (expr.match(/x[\s]*[\+\-\=]/)) {
      return 'algebra';
    } else if (expr.match(/sin|cos|tan|log|ln/i)) {
      return 'calculus';
    } else if (expr.match(/√|sqrt|root/i)) {
      return 'algebra';
    }
    return 'algebra';
  } else if (expr.match(/[\+\-\*\/\^]/)) {
    return 'arithmetic';
  }
  return 'other';
}

// 确定难度
function determineDifficulty(expr) {
  // 简单判断：表达式长度和复杂性
  const complexity = expr.length + (expr.match(/[\+\-\*\/\^=]/g) || []).length;
  
  if (complexity < 10) return 'easy';
  if (complexity < 20) return 'medium';
  return 'hard';
}

// 解析是否为线性方程
function isLinearEquation(expr) {
  // 检查是否包含x的二次方或更高次
  return expr.includes('=') && 
         !expr.match(/x\^[2-9]|x²|x³/) && 
         expr.match(/[a-z]/);
}

// 检查是否为二次方程
function isQuadraticEquation(expr) {
  // 检查是否包含x的二次方但不包含更高次
  return expr.includes('=') && 
         (expr.match(/x\^2|x²/) || expr.match(/\([^)]*\)\^2/)) && 
         !expr.match(/x\^[3-9]|x³/);
}

// 将表达式展开为项
function expandTerms(expr) {
  // 简单的拆分方法，实际应用中需要更复杂的解析
  return expr.replace(/\s/g, '')
      .replace(/-/g, '+-')
      .split('+')
      .filter(term => term !== '');
}

// 找出表达式中的变量
function findVariables(expr) {
  const matches = expr.match(/[a-z]/g);
  if (!matches) return [];
  return [...new Set(matches)]; // 去重
}

// 提取系数
function extractCoefficient(term, variable) {
  if (term === variable) return 1;
  if (term === `-${variable}`) return -1;
  
  const coefficient = term.replace(new RegExp(`${variable}$`), '');
  return parseFloat(coefficient) || 0;
}

// 将二次方程标准化为 ax^2 + bx + c = 0
function standardizeQuadratic(leftSide, rightSide) {
  try {
    // 移项：所有内容移到左侧
    const expr = `(${leftSide}) - (${rightSide})`;
    // 使用mathjs展开并简化
    const simplified = math.simplify(expr).toString();
    return simplified;
  } catch (e) {
    // 简化失败时返回原始表达式
    return `${leftSide} - (${rightSide})`;
  }
}

// 从标准形式提取二次方程系数
function extractQuadraticCoefficients(expr) {
  let variable = 'x'; // 默认变量
  
  // 先尝试找出变量
  const vars = findVariables(expr);
  if (vars.length > 0) {
    variable = vars[0];
  }
  
  // 尝试通过按项分割提取系数
  const terms = expandTerms(expr);
  let a = 0, b = 0, c = 0;
  
  for (const term of terms) {
    if (term.includes(`${variable}^2`) || term.includes(`${variable}²`)) {
      // 二次项
      a += extractCoefficient(term.replace(`^2`, ''), variable);
    } else if (term.includes(variable)) {
      // 一次项
      b += extractCoefficient(term, variable);
    } else {
      // 常数项
      c += parseFloat(term) || 0;
    }
  }
  
  return { a, b, c, variable };
}

// 使用mathjs尝试求解方程
function solveWithMath(equation) {
  try {
    if (!equation.includes('=')) {
      return null;
    }
    
    const [left, right] = equation.split('=').map(side => side.trim());
    const expr = `${left} - (${right})`;
    
    // 找出变量
    const vars = findVariables(equation);
    if (vars.length !== 1) return null;
    
    const variable = vars[0];
    
    // 尝试数值求解
    // 注意：实际项目中应该使用更专业的方程求解库
    // 这里使用简化的线性插值法尝试求解，高级方程可能不准确
    
    // 对于简单的线性方程可以直接计算
    const simplified = math.simplify(expr).toString();
    
    if (simplified.match(new RegExp(`^[\\d\\+\\-\\*\\/\\.]*${variable}[\\d\\+\\-\\*\\/\\.]*$`))) {
      // 简单的形式如 ax + b
      const withX1 = simplified.replace(new RegExp(variable, 'g'), '1');
      const withX0 = simplified.replace(new RegExp(variable, 'g'), '0');
      
      const y1 = math.evaluate(withX1);
      const y0 = math.evaluate(withX0);
      
      // 线性插值: x = -y0 / (y1 - y0)
      if (y1 !== y0) {
        const solution = -y0 / (y1 - y0);
        return `${variable} = ${solution}`;
      }
    }
    
    return null;
  } catch (e) {
    console.error('求解出错:', e);
    return null;
  }
}

// 生成解题说明
function generateExplanation(solution) {
  const { type, method, steps, result } = solution;
  
  if (type === 'algebra' || type === 'quadratic') {
    return `这是一个${type === 'quadratic' ? '二次' : '线性'}方程。解题使用${method}，通过${steps.length}个步骤得出结果：${result}。`;
  } else if (type === 'arithmetic') {
    return `这是一个算术表达式。通过直接计算得出结果：${result}。`;
  } else {
    return `使用${method}解决这个问题，最终结果是：${result}。`;
  }
} 