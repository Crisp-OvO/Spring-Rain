/**
 * Qwen数学解题助手后端服务
 * 支持最新的Qwen2.5-Math和Qwen-VL模型
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

// 导入配置
const QWEN_CONFIG = require('./config/qwen');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', express.static(path.join(__dirname, 'public')));

// 文件上传配置
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB限制
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片文件 (jpeg, jpg, png, gif, bmp, webp)'));
    }
  }
});

// 数据存储配置
const DATA_DIR = path.join(__dirname, 'data');
const PROBLEMS_FILE = path.join(DATA_DIR, 'problems.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
  
  // 初始化数据文件
  try {
    await fs.access(PROBLEMS_FILE);
  } catch {
    await fs.writeFile(PROBLEMS_FILE, JSON.stringify([], null, 2));
  }
  
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
  }
}

// 数据操作函数
async function loadProblems() {
  try {
    const data = await fs.readFile(PROBLEMS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('加载问题数据失败:', error);
    return [];
  }
}

async function saveProblems(problems) {
  try {
    await fs.writeFile(PROBLEMS_FILE, JSON.stringify(problems, null, 2));
    return true;
  } catch (error) {
    console.error('保存问题数据失败:', error);
    return false;
  }
}

async function loadUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('加载用户数据失败:', error);
    return [];
  }
}

async function saveUsers(users) {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('保存用户数据失败:', error);
    return false;
  }
}

// Qwen API调用函数
async function callQwenAPI(endpoint, data, isStream = false) {
  const apiKey = QWEN_CONFIG.DASHSCOPE.API_KEY;
  if (!apiKey) {
    throw new Error('DASHSCOPE_API_KEY 环境变量未设置');
  }

  const config = {
    method: 'POST',
    url: endpoint,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': isStream ? 'text/event-stream' : 'application/json',
    },
    data: data,
    timeout: QWEN_CONFIG.API_CONFIG.timeout,
  };

  if (isStream) {
    config.responseType = 'stream';
  }

  return axios(config);
}

// OCR识别接口 - 使用Qwen-VL模型（优化版）
app.post('/ocr/math', upload.single('image'), async (req, res) => {
  const requestId = `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] 收到OCR识别请求`);
  
  try {
    let imageData;
    let imageUrl;
    let imageSize = 0;
    
    // 第一步：处理图片数据
    if (req.file) {
      const imagePath = req.file.path;
      console.log(`[${requestId}] 处理上传文件: ${req.file.filename}, 大小: ${req.file.size} bytes`);
      
      try {
        const imageBuffer = await fs.readFile(imagePath);
        imageData = imageBuffer.toString('base64');
        imageSize = imageBuffer.length;
        imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        console.log(`[${requestId}] 文件读取成功，Base64长度: ${imageData.length}`);
      } catch (fileError) {
        console.error(`[${requestId}] 文件读取失败:`, fileError);
        return res.status(400).json({ 
          error: '文件读取失败',
          message: fileError.message,
          status: 'error',
          requestId: requestId
        });
      }
    } else if (req.body.imageData) {
      const rawImageData = req.body.imageData;
      console.log(`[${requestId}] 处理base64图片数据，原始长度: ${rawImageData.length}`);
      
      imageData = rawImageData.replace(/^data:image\/[a-z]+;base64,/, '');
      const testBuffer = Buffer.from(imageData, 'base64');
      imageSize = testBuffer.length;
      console.log(`[${requestId}] Base64处理后长度: ${imageData.length}, 解码大小: ${imageSize} bytes`);
      
      if (!imageData || imageData.length < 100) {
        console.error(`[${requestId}] Base64数据太短或无效`);
        return res.status(400).json({ 
          error: 'Base64图片数据无效',
          message: '图片数据太短或格式不正确',
          status: 'error',
          requestId: requestId
        });
      }
    } else {
      console.error(`[${requestId}] 缺少图片数据`);
      return res.status(400).json({ 
        error: '缺少图片数据',
        message: '请提供图片文件或base64数据',
        status: 'error',
        requestId: requestId
      });
    }

    // 第二步：图片质量分析
    const imageQuality = analyzeImageQuality(imageSize, imageData);
    console.log(`[${requestId}] 图片质量分析:`, imageQuality);

    // 第三步：检查API密钥
    const apiKey = QWEN_CONFIG.DASHSCOPE.API_KEY;
    console.log(`[${requestId}] API密钥检查: ${apiKey ? '已配置' : '未配置'}`);
    
    if (!apiKey) {
      console.error(`[${requestId}] API密钥未配置`);
      return res.status(500).json({
        error: 'API配置错误',
        message: 'DASHSCOPE_API_KEY环境变量未配置',
        status: 'error',
        requestId: requestId,
        suggestion: '请设置正确的API密钥'
      });
    }

    // 第四步：智能OCR识别策略
    const strategies = [
      {
        name: '高精度模式',
        model: 'qwen-vl-max',
        prompt: '请仔细识别这张图片中的所有数学公式和文字。保持原有格式，对于复杂公式请用LaTeX格式表示。',
        maxTokens: 1000
      },
      {
        name: '简化模式',
        model: 'qwen-vl-max', 
        prompt: '请识别图片中的主要数学内容，简化复杂格式。',
        maxTokens: 500
      },
      {
        name: '数学专用模式',
        model: 'qwen-vl-max',
        prompt: '这是一张数学题图片。请提取所有数学表达式、公式和题目文字。',
        maxTokens: 800
      }
    ];

    let lastError = null;
    let ocrResult = null;

    // 尝试不同的识别策略
    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      console.log(`[${requestId}] 尝试策略${i + 1}: ${strategy.name}`);
      
      try {
        const result = await attemptOCR(requestId, imageData, strategy, imageQuality);
        if (result && result.text && result.text.trim().length > 0) {
          ocrResult = result;
          console.log(`[${requestId}] 策略${i + 1}成功，识别内容长度: ${result.text.length}`);
          break;
        } else {
          console.log(`[${requestId}] 策略${i + 1}返回空内容，尝试下一个策略`);
        }
      } catch (error) {
        console.log(`[${requestId}] 策略${i + 1}失败: ${error.message}`);
        lastError = error;
        
        // 如果是权限错误，直接退出
        if (error.message.includes('download the media resource')) {
          break;
        }
      }
    }

    // 返回结果
    if (ocrResult) {
      console.log(`[${requestId}] OCR识别成功`);
      res.json(ocrResult);
    } else {
      console.log(`[${requestId}] 所有策略都失败，返回备用响应`);
      
      // 根据图片质量给出具体建议
      const suggestions = generateSuggestions(imageQuality, lastError);
      
      const fallbackResult = {
        id: requestId,
        text: `OCR识别遇到困难，${suggestions.summary}`,
        mathExpression: '无法识别',
        confidence: 0.0,
        boundingBoxes: [],
        imageUrl: imageUrl || 'uploaded',
        timestamp: new Date().toISOString(),
        status: 'fallback',
        model: 'fallback',
        error: lastError?.message || '识别失败',
        imageQuality: imageQuality,
        suggestions: suggestions.details,
        usage: {}
      };
      
      res.json(fallbackResult);
    }

  } catch (error) {
    console.error(`[${requestId}] OCR识别出现未预期错误:`, error);
    console.error(`[${requestId}] 错误堆栈:`, error.stack);
    
    const errorResponse = { 
      error: 'OCR识别失败',
      message: error.message,
      status: 'error',
      requestId: requestId,
      text: '',
      mathExpression: '',
      confidence: 0,
      boundingBoxes: [],
      timestamp: new Date().toISOString(),
      details: error.stack ? error.stack.split('\n')[0] : 'Unknown error',
      suggestion: '请检查图片格式、大小和网络连接'
    };
    
    res.status(500).json(errorResponse);
  }
});

// 图片质量分析函数
function analyzeImageQuality(imageSize, imageBase64) {
  const quality = {
    size: imageSize,
    sizeCategory: '',
    estimatedDimensions: '',
    qualityScore: 0,
    issues: []
  };

  // 大小分析
  if (imageSize < 10000) { // 10KB
    quality.sizeCategory = '太小';
    quality.issues.push('图片文件过小，可能分辨率不足');
    quality.qualityScore += 1;
  } else if (imageSize < 100000) { // 100KB
    quality.sizeCategory = '偏小';
    quality.issues.push('图片文件较小，建议使用更高分辨率');
    quality.qualityScore += 3;
  } else if (imageSize < 2000000) { // 2MB
    quality.sizeCategory = '适中';
    quality.qualityScore += 5;
  } else if (imageSize < 5000000) { // 5MB
    quality.sizeCategory = '较大';
    quality.qualityScore += 4;
  } else {
    quality.sizeCategory = '过大';
    quality.issues.push('图片文件过大，可能影响处理速度');
    quality.qualityScore += 2;
  }

  // 估算分辨率
  const estimatedPixels = imageSize / 3; // 粗略估算
  if (estimatedPixels < 100000) {
    quality.estimatedDimensions = '低分辨率';
    quality.issues.push('预估分辨率较低，可能影响识别效果');
  } else if (estimatedPixels < 500000) {
    quality.estimatedDimensions = '中等分辨率';
  } else {
    quality.estimatedDimensions = '高分辨率';
  }

  return quality;
}

// OCR尝试函数
async function attemptOCR(requestId, imageData, strategy, imageQuality) {
  const cleanImageData = imageData.replace(/[^A-Za-z0-9+/=]/g, '');
  
  // 检测图片格式
  let detectedMimeType = 'image/jpeg';
  if (cleanImageData.startsWith('/9j/')) {
    detectedMimeType = 'image/jpeg';
  } else if (cleanImageData.startsWith('iVBORw0')) {
    detectedMimeType = 'image/png';
  } else if (cleanImageData.startsWith('R0lGOD')) {
    detectedMimeType = 'image/gif';
  }
  
  console.log(`[${requestId}] ${strategy.name} - 图片格式: ${detectedMimeType}, Base64长度: ${cleanImageData.length}`);
  
  // 验证Base64数据
  if (cleanImageData.length < 100) {
    throw new Error(`Base64数据太短 (${cleanImageData.length} 字符)`);
  }
  
  if (cleanImageData.length > 2000000) { // ~1.5MB Base64 limit
    throw new Error(`Base64数据太大 (${cleanImageData.length} 字符, 建议小于2M字符)`);
  }
  
  const requestData = {
    model: strategy.model,
    input: {
      messages: [
        {
          role: 'user',
          content: [
            {
              image: `data:${detectedMimeType};base64,${cleanImageData}`
            },
            {
              text: strategy.prompt
            }
          ]
        }
      ]
    },
    parameters: {
      result_format: 'message',
      max_tokens: strategy.maxTokens,
      incremental_output: false,
      enable_search: false
    }
  };

  console.log(`[${requestId}] ${strategy.name} - 请求数据大小: ${JSON.stringify(requestData).length} 字符`);
  
  // 尝试多个API端点
  const endpoints = [
    QWEN_CONFIG.DASHSCOPE.VISION_URL,
    QWEN_CONFIG.DASHSCOPE.VISION_URL_V2,
    `${QWEN_CONFIG.DASHSCOPE.BASE_URL}/multimodal-generation/generation`
  ];

  let lastError = null;
  
  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    console.log(`[${requestId}] ${strategy.name} - 尝试端点${i + 1}: ${endpoint}`);

    const startTime = Date.now();
    
    try {
      const response = await callQwenAPI(endpoint, requestData);
      const apiCallDuration = Date.now() - startTime;

      console.log(`[${requestId}] ${strategy.name} API调用完成，耗时: ${apiCallDuration}ms`);
      console.log(`[${requestId}] ${strategy.name} 响应状态: ${response.status}`);

      const result = response.data;
      if (result.output && result.output.choices && result.output.choices[0]) {
        const choice = result.output.choices[0];
        const rawContent = choice.message?.content;
        let recognizedText = '未能提取内容';
        
        if (rawContent && typeof rawContent === 'string') {
          recognizedText = rawContent;
        } else if (Array.isArray(rawContent)) {
          // 处理数组格式的内容
          recognizedText = rawContent.map(item => {
            if (typeof item === 'string') return item;
            if (item.text) return item.text;
            return JSON.stringify(item);
          }).join('');
        } else if (rawContent && typeof rawContent === 'object' && rawContent.text) {
          recognizedText = rawContent.text;
        }
        
        console.log(`[${requestId}] ${strategy.name} 识别成功，文本长度: ${recognizedText.length}`);
        
        const ocrResult = {
          id: requestId,
          text: recognizedText,
          mathExpression: extractMathExpression(recognizedText),
          confidence: calculateConfidence(recognizedText, imageQuality),
          boundingBoxes: [],
          imageUrl: 'uploaded',
          timestamp: new Date().toISOString(),
          status: 'success',
          model: strategy.name,
          strategy: strategy.name,
          usage: result.usage || {},
          apiCallDuration: apiCallDuration,
          imageQuality: imageQuality,
          apiEndpoint: endpoint,
          rawContent: rawContent // 调试用
        };
        
        return ocrResult;
      } else {
        console.log(`[${requestId}] ${strategy.name} 响应格式异常:`, JSON.stringify(result, null, 2));
        throw new Error(`${strategy.name}返回数据格式不正确: ${JSON.stringify(result.output || result)}`);
      }
    } catch (error) {
      const apiCallDuration = Date.now() - startTime;
      console.error(`[${requestId}] ${strategy.name} 端点${i + 1}失败，耗时: ${apiCallDuration}ms`);
      console.error(`[${requestId}] ${strategy.name} 错误详情:`, error.message);
      
      lastError = error;
      
      // 详细的错误信息
      if (error.response) {
        console.error(`[${requestId}] ${strategy.name} HTTP状态: ${error.response.status}`);
        console.error(`[${requestId}] ${strategy.name} 响应头:`, error.response.headers);
        console.error(`[${requestId}] ${strategy.name} 响应数据:`, error.response.data);
        
        let detailedError = `HTTP ${error.response.status}`;
        let suggestion = '';
        
        if (error.response.status === 400) {
          const responseData = error.response.data;
          if (responseData && responseData.message) {
            detailedError += `: ${responseData.message}`;
          }
          
          if (responseData && responseData.code) {
            detailedError += ` (代码: ${responseData.code})`;
          }
          
          // 根据具体错误提供建议
          if (detailedError.includes('download the media resource')) {
            suggestion = 'API密钥可能没有视觉模型权限，请检查阿里云控制台';
          } else if (detailedError.includes('image')) {
            suggestion = '图片格式或大小可能有问题，尝试转换为JPG格式';
          } else if (detailedError.includes('token')) {
            suggestion = '请求内容可能过大，尝试压缩图片';
          } else if (detailedError.includes('format')) {
            suggestion = '请求格式可能不正确';
          } else if (detailedError.includes('not found') || detailedError.includes('404')) {
            suggestion = 'API端点可能不正确，尝试下一个端点';
            continue; // 继续尝试下一个端点
          } else {
            suggestion = '请检查图片质量、格式和大小';
          }
        } else if (error.response.status === 401) {
          detailedError += ': API密钥无效或已过期';
          suggestion = '请检查DASHSCOPE_API_KEY是否正确';
        } else if (error.response.status === 403) {
          detailedError += ': 权限不足';
          suggestion = '请检查API密钥是否有相应模型的访问权限';
        } else if (error.response.status === 429) {
          detailedError += ': 请求频率过高';
          suggestion = '请稍后重试';
        } else if (error.response.status >= 500) {
          detailedError += ': 服务器错误';
          suggestion = '阿里云服务可能暂时不可用，请稍后重试';
        }
        
        // 如果不是端点问题，记录详细错误但继续尝试
        if (!detailedError.includes('not found') && !detailedError.includes('404')) {
          lastError = new Error(`${detailedError}${suggestion ? ' - ' + suggestion : ''}`);
        }
      } else if (error.code === 'ENOTFOUND') {
        lastError = new Error('无法连接到阿里云服务，请检查网络连接');
      } else if (error.code === 'ETIMEDOUT') {
        lastError = new Error('请求超时，请检查网络连接或稍后重试');
      } else {
        lastError = new Error(`网络错误: ${error.message}`);
      }
    }
  }
  
  // 所有端点都失败了
  if (lastError) {
    throw lastError;
  } else {
    throw new Error(`所有API端点都无法访问`);
  }
}

// 置信度计算
function calculateConfidence(text, imageQuality) {
  let confidence = 0.8; // 基础置信度
  
  // 根据文本长度调整
  if (text.length > 50) confidence += 0.1;
  if (text.length < 5) confidence -= 0.3;
  
  // 根据图片质量调整
  confidence += (imageQuality.qualityScore / 5) * 0.2;
  
  // 根据数学内容调整
  if (text.match(/[+\-*/=()]/)) confidence += 0.05;
  if (text.match(/\\[a-zA-Z]+/)) confidence += 0.05; // LaTeX命令
  
  return Math.max(0.1, Math.min(0.99, confidence));
}

// 建议生成函数
function generateSuggestions(imageQuality, error) {
  const suggestions = {
    summary: '',
    details: []
  };

  if (imageQuality.qualityScore < 3) {
    suggestions.summary = '图片质量可能不足';
    suggestions.details.push('尝试使用更高分辨率的图片');
    suggestions.details.push('确保图片清晰、光线充足');
    suggestions.details.push('避免倾斜拍摄，正面平拍效果更佳');
  }

  if (imageQuality.size < 50000) {
    suggestions.details.push('图片文件太小，建议重新拍摄更高质量的图片');
  }

  if (error && error.message.includes('download the media resource')) {
    suggestions.summary = '可能是图片格式问题';
    suggestions.details.push('尝试转换图片格式为JPG或PNG');
    suggestions.details.push('确保图片文件没有损坏');
  }

  if (suggestions.details.length === 0) {
    suggestions.summary = '可能是复杂公式识别困难';
    suggestions.details.push('尝试分段拍摄复杂公式');
    suggestions.details.push('确保手写字体清晰工整');
    suggestions.details.push('避免背景干扰，使用纯色背景');
  }

  return suggestions;
}

// 数学表达式提取函数
function extractMathExpression(text) {
  // 简单的数学表达式提取逻辑
  const mathPatterns = [
    /\$\$(.+?)\$\$/g, // LaTeX格式
    /\$(.+?)\$/g,     // 内联LaTeX
    /([0-9+\-*/()^=√∑∏∫αβγπ≠≤≥∞]+)/g, // 数学符号
  ];
  
  for (const pattern of mathPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0].replace(/\$\$?/g, '').trim();
    }
  }
  
  return text.trim();
}

// 数学解题接口 - 使用Qwen2.5-Math模型
app.post('/math/solve', async (req, res) => {
  console.log('收到解题请求:', req.body);
  
  const { expression, method = 'thinking', enableSearch = false } = req.body;
  
  if (!expression) {
    return res.status(400).json({ error: '缺少数学表达式' });
  }
  
  try {
    const problemId = `problem_${Date.now()}_${uuidv4().substring(0, 8)}`;
    
    // 选择模型和提示词
    const mathModel = QWEN_CONFIG.MATH_MODEL.QWEN_PLUS;
    let prompt;
    
    switch (method) {
      case 'cot':
        prompt = QWEN_CONFIG.PROMPTS.MATH_SOLVER.COT.replace('{expression}', expression);
        break;
      case 'tir':
        prompt = QWEN_CONFIG.PROMPTS.MATH_SOLVER.TIR.replace('{expression}', expression);
        break;
      default:
        prompt = QWEN_CONFIG.PROMPTS.MATH_SOLVER.THINKING.replace('{expression}', expression);
    }

    // 构建API请求
    const requestData = {
      model: mathModel.name,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的数学解题助手，擅长解决各种数学问题。请提供详细、准确的解题过程。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: true,
      enable_thinking: mathModel.supportsThinking,
      enable_search: enableSearch && mathModel.supportsSearch,
      max_tokens: mathModel.maxOutputTokens,
    };

    console.log('调用Qwen数学模型:', mathModel.name);
    
    // 设置流式响应
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const response = await callQwenAPI(
      `${QWEN_CONFIG.DASHSCOPE.COMPATIBLE_URL}/chat/completions`,
      requestData,
      true
    );

    let fullResponse = '';
    let thinkingContent = '';
    let solution = {
      id: problemId,
      expression,
      steps: [],
      result: '',
      latex: '',
      method: method,
      explanation: '',
      type: determineProblemType(expression),
      difficulty: determineDifficulty(expression),
      timestamp: new Date().toISOString(),
      model: mathModel.name
    };

    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.replace('data: ', '');
          
          if (data === '[DONE]') {
            // 处理完整响应
            solution.explanation = fullResponse;
            solution.steps = parseSteps(fullResponse);
            solution.result = extractFinalAnswer(fullResponse);
            
            // 保存问题到数据库
            saveProblemToDatabase(solution);
            
            res.write(`data: ${JSON.stringify({ type: 'complete', solution })}\n\n`);
            res.end();
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;
            
            if (delta?.reasoning_content) {
              thinkingContent += delta.reasoning_content;
              res.write(`data: ${JSON.stringify({ 
                type: 'thinking', 
                content: delta.reasoning_content 
              })}\n\n`);
            }
            
            if (delta?.content) {
              fullResponse += delta.content;
              res.write(`data: ${JSON.stringify({ 
                type: 'content', 
                content: delta.content 
              })}\n\n`);
            }
          } catch (parseError) {
            console.error('解析流数据失败:', parseError);
          }
        }
      }
    });

    response.data.on('error', (error) => {
      console.error('流式响应错误:', error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        error: error.message 
      })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('解题失败:', error);
    res.status(500).json({
      error: '解题失败',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 保存问题到数据库
async function saveProblemToDatabase(solution) {
  try {
    const problems = await loadProblems();
    problems.unshift(solution);
    
    // 保留最近1000个问题
    if (problems.length > 1000) {
      problems.splice(1000);
    }
    
    await saveProblems(problems);
    console.log('问题已保存到数据库:', solution.id);
  } catch (error) {
    console.error('保存问题失败:', error);
  }
}

// 解析解题步骤
function parseSteps(content) {
  const stepPatterns = [
    /\d+[\.、]\s*(.+?)(?=\d+[\.、]|$)/g,
    /步骤\s*\d+[：:]\s*(.+?)(?=步骤\s*\d+|$)/g,
    /第\s*\d+\s*步[：:]\s*(.+?)(?=第\s*\d+\s*步|$)/g,
  ];
  
  for (const pattern of stepPatterns) {
    const matches = [...content.matchAll(pattern)];
    if (matches.length > 0) {
      return matches.map(match => match[1].trim());
    }
  }
  
  // 如果没有明确的步骤标记，按段落分割
  return content.split('\n').filter(line => line.trim().length > 0);
}

// 提取最终答案
function extractFinalAnswer(content) {
  const answerPatterns = [
    /答案[：:]?\s*(.+?)$/m,
    /结果[：:]?\s*(.+?)$/m,
    /因此[：:]?\s*(.+?)$/m,
    /所以[：:]?\s*(.+?)$/m,
    /\\boxed\{([^}]+)\}/,
    /最终答案[：:]?\s*(.+?)$/m,
  ];
  
  for (const pattern of answerPatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  // 如果没有找到明确答案，返回最后一行
  const lines = content.split('\n').filter(line => line.trim());
  return lines[lines.length - 1] || '无法确定答案';
}

// 判断问题类型
function determineProblemType(expression) {
  if (/[∫∑∏]/.test(expression)) return 'calculus';
  if (/[a-z]\s*=/.test(expression)) return 'equation';
  if (/[+\-*/]/.test(expression)) return 'arithmetic';
  if (/[≤≥<>]/.test(expression)) return 'inequality';
  if (/[√^²³]/.test(expression)) return 'algebra';
  return 'other';
}

// 判断难度级别
function determineDifficulty(expression) {
  let complexity = 0;
  
  if (/[∫∑∏]/.test(expression)) complexity += 3;
  if (/[√^]/.test(expression)) complexity += 2;
  if (/[+\-*/()]/.test(expression)) complexity += 1;
  if (expression.length > 50) complexity += 1;
  
  if (complexity <= 2) return 'easy';
  if (complexity <= 4) return 'medium';
  return 'hard';
}

// 获取历史记录接口
app.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, difficulty } = req.query;
    const problems = await loadProblems();
    
    let filtered = problems;
    
    if (type && type !== 'all') {
      filtered = filtered.filter(p => p.type === type);
    }
    
    if (difficulty && difficulty !== 'all') {
      filtered = filtered.filter(p => p.difficulty === difficulty);
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginated = filtered.slice(startIndex, endIndex);
        
        res.json({ 
      problems: paginated,
      total: filtered.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(filtered.length / limit)
    });
  } catch (error) {
    console.error('获取历史记录失败:', error);
    res.status(500).json({ error: '获取历史记录失败' });
  }
});

// 删除历史记录接口
app.delete('/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const problems = await loadProblems();
    const filtered = problems.filter(p => p.id !== id);
    
    if (await saveProblems(filtered)) {
      res.json({ success: true, message: '删除成功' });
      } else {
      res.status(500).json({ error: '删除失败' });
    }
  } catch (error) {
    console.error('删除记录失败:', error);
    res.status(500).json({ error: '删除记录失败' });
  }
});

// 清空历史记录接口
app.delete('/history', async (req, res) => {
  try {
    if (await saveProblems([])) {
      res.json({ success: true, message: '清空成功' });
      } else {
      res.status(500).json({ error: '清空失败' });
    }
  } catch (error) {
    console.error('清空记录失败:', error);
    res.status(500).json({ error: '清空记录失败' });
  }
});

// 用户数据接口
app.post('/user/profile', async (req, res) => {
  try {
    const { userId, ...profileData } = req.body;
    const users = await loadUsers();
    
    let userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      // 新用户
      const newUser = {
        id: userId || uuidv4(),
        ...profileData,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      users.push(newUser);
      } else {
      // 更新用户
      users[userIndex] = {
        ...users[userIndex],
        ...profileData,
        lastLogin: new Date().toISOString()
      };
    }
    
    if (await saveUsers(users)) {
      res.json({ success: true, user: users[userIndex] || users[users.length - 1] });
      } else {
      res.status(500).json({ error: '保存用户数据失败' });
    }
  } catch (error) {
    console.error('用户数据操作失败:', error);
    res.status(500).json({ error: '用户数据操作失败' });
  }
});

// API权限测试接口
app.post('/api/test-connection', async (req, res) => {
  console.log('API连接测试请求');
  
  try {
    const apiKey = QWEN_CONFIG.DASHSCOPE.API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API密钥未配置'
      });
    }

    // 简单的健康检查
    res.json({
      success: true,
      message: 'API密钥已配置',
      hasApiKey: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API连接测试失败:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 文本模型测试接口
app.post('/api/test-text', async (req, res) => {
  console.log('文本模型测试请求');
  
  try {
    const apiKey = QWEN_CONFIG.DASHSCOPE.API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API密钥未配置'
      });
    }

    const requestData = {
      model: 'qwen-plus',
      input: {
        messages: [
          {
            role: 'user',
            content: '你好，这是一个API权限测试。请简短回复。'
          }
        ]
      },
      parameters: {
        result_format: 'message',
        max_tokens: 50
      }
    };

    const response = await callQwenAPI(
      `${QWEN_CONFIG.DASHSCOPE.BASE_URL}/text-generation/generation`,
      requestData
    );

    if (response.data.output && response.data.output.choices && response.data.output.choices[0]) {
      const responseText = response.data.output.choices[0].message.content;
      res.json({
        success: true,
        message: '文本模型测试成功',
        response: responseText,
        model: 'qwen-plus'
      });
    } else {
      throw new Error('文本模型响应格式异常');
    }
  } catch (error) {
    console.error('文本模型测试失败:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message,
      error: error.message
    });
  }
});

// OCR模型测试接口
app.post('/api/test-ocr', async (req, res) => {
  console.log('OCR模型测试请求');
  
  try {
    const { imageData } = req.body;
    const apiKey = QWEN_CONFIG.DASHSCOPE.API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API密钥未配置'
      });
    }

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: '缺少测试图片数据'
      });
    }

    // 提取base64数据
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const requestData = {
      model: 'qwen-vl-max',
      input: {
        messages: [
          {
            role: 'user',
            content: [
              {
                image: imageData
              },
              {
                text: '这是什么图片？请简短回复。'
              }
            ]
          }
        ]
      },
      parameters: {
        result_format: 'message',
        max_tokens: 100
      }
    };

    const response = await callQwenAPI(
      `${QWEN_CONFIG.DASHSCOPE.BASE_URL}/multimodal-generation/generation`,
      requestData
    );

    if (response.data.output && response.data.output.choices && response.data.output.choices[0]) {
      const responseText = response.data.output.choices[0].message.content;
      res.json({
        success: true,
        message: 'OCR模型测试成功',
        response: responseText,
        model: 'qwen-vl-max'
      });
    } else {
      throw new Error('OCR模型响应格式异常');
    }
  } catch (error) {
    console.error('OCR模型测试失败:', error);
    
    let errorMessage = error.message;
    let errorDetails = '';
    
    if (error.response) {
      errorMessage = `HTTP ${error.response.status}`;
      errorDetails = error.response.data?.message || error.response.statusText;
      
      if (error.response.status === 400 && errorDetails.includes('download the media resource')) {
        errorMessage = 'OCR权限不足';
        errorDetails = '无法下载媒体资源，可能是API密钥没有视觉模型权限';
      }
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: errorDetails || error.message,
      statusCode: error.response?.status
    });
  }
});

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    models: {
      math: QWEN_CONFIG.MATH_MODEL.QWEN_PLUS.name,
      ocr: QWEN_CONFIG.OCR_MODEL.QWEN_VL_MAX.name
    }
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
    res.status(500).json({
    error: '服务器内部错误',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
async function startServer() {
  try {
    await ensureDataDir();
    console.log('数据目录初始化完成');
    
    app.listen(PORT, () => {
      console.log(`🚀 Qwen数学解题助手后端服务启动成功`);
      console.log(`📡 服务地址: http://localhost:${PORT}`);
      console.log(`🤖 数学模型: ${QWEN_CONFIG.MATH_MODEL.QWEN_PLUS.name}`);
      console.log(`👁️ OCR模型: ${QWEN_CONFIG.OCR_MODEL.QWEN_VL_MAX.name}`);
      console.log(`📊 API配置: ${QWEN_CONFIG.DASHSCOPE.API_KEY ? '✅' : '❌'} DASHSCOPE_API_KEY`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

startServer(); 