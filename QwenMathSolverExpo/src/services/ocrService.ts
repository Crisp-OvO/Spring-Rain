/**
 * OCR服务 - 使用阿里云通义千问Qwen-VL模型
 * 支持数学公式识别和文本提取
 */

import { QWEN_API, APP_CONFIG, API_URL, API_PATHS, ERROR_CODES } from '../constants/config';

// OCR识别结果接口
export interface OCRResult {
  text: string;
  mathExpression: string;
  confidence: number;
  boundingBoxes: BoundingBox[];
  latex?: string;
  error?: string;
  timestamp?: string;
  model?: string;
}

// 边界框接口
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  confidence: number;
}

// 模拟OCR结果（开发阶段使用）
const mockOCRResult = (expression: string): OCRResult => ({
  text: `数学表达式: ${expression}`,
  mathExpression: expression,
  confidence: 0.95,
  boundingBoxes: [
    {
      x: 10,
      y: 10,
      width: 200,
      height: 30,
      text: expression,
      confidence: 0.95,
    }
  ],
  latex: expression,
  timestamp: new Date().toISOString(),
  model: 'mock',
});

/**
 * 将图片转换为Base64格式
 */
const imageToBase64 = async (imageUri: string): Promise<string> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // 移除data:image/xxx;base64,前缀
          const base64 = reader.result.replace(/^data:image\/[a-z]+;base64,/, '');
          resolve(base64);
        } else {
          reject(new Error('转换为base64失败'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`图片转换失败: ${error}`);
  }
};

/**
 * 调用后端OCR接口
 */
const callBackendOCR = async (imageUri: string): Promise<OCRResult> => {
  try {
    // 创建FormData对象
    const formData = new FormData();
    
    // 添加图片文件
    const imageFile = {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'math_image.jpg',
    } as any;
    
    formData.append('image', imageFile);

    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), QWEN_API.TIMEOUT);

    try {
      const response = await fetch(`${API_URL}${API_PATHS.OCR}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OCR API错误: HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'error') {
        throw new Error(result.message || 'OCR识别失败');
      }

      return {
        text: result.text || '',
        mathExpression: result.mathExpression || '',
        confidence: result.confidence || 0,
        boundingBoxes: result.boundingBoxes || [],
        latex: result.latex || result.mathExpression,
        timestamp: result.timestamp,
        model: result.model,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('后端OCR调用失败:', error);
    throw error;
  }
};

/**
 * 直接调用阿里云Qwen-VL API（备用方案）
 */
const callQwenVLDirect = async (base64Image: string): Promise<OCRResult> => {
  try {
    if (!QWEN_API.KEY) {
      throw new Error('缺少API密钥，请配置DASHSCOPE_API_KEY环境变量');
    }

    const requestData = {
      model: QWEN_API.OCR_MODEL.NAME,
      input: {
        messages: [
          {
            role: 'user',
            content: [
              {
                image: `data:image/jpeg;base64,${base64Image}`
              },
              {
                text: `请分析这张图片中的数学内容，提取所有的数学表达式、公式和文本。

要求：
1. 识别所有数学符号和公式
2. 保持原有的数学格式
3. 如果有复杂公式，请用LaTeX格式表示
4. 识别题目要求和条件

请返回结构化的识别结果。`
              }
            ]
          }
        ]
      },
      parameters: {
        result_format: 'message',
        max_tokens: QWEN_API.OCR_MODEL.MAX_TOKENS,
      }
    };

    const response = await fetch(`${QWEN_API.BASE_URL}/multimodal-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QWEN_API.KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`Qwen API错误: HTTP ${response.status}`);
    }

    const result = await response.json();
    const recognizedText = result.output?.choices?.[0]?.message?.content || '';

    // 提取数学表达式
    const mathExpression = extractMathExpression(recognizedText);

    return {
      text: recognizedText,
      mathExpression,
      confidence: 0.95, // Qwen-VL通常有较高准确率
      boundingBoxes: [], // Qwen-VL可能不返回边界框
      latex: mathExpression,
      timestamp: new Date().toISOString(),
      model: QWEN_API.OCR_MODEL.NAME,
    };
  } catch (error) {
    console.error('Qwen-VL API调用失败:', error);
    throw error;
  }
};

/**
 * 从文本中提取数学表达式
 */
const extractMathExpression = (text: string): string => {
  // 匹配各种数学表达式格式
  const mathPatterns = [
    /\$\$(.+?)\$\$/g, // LaTeX格式
    /\$(.+?)\$/g,     // 内联LaTeX
    /([0-9+\-*/()^=√∑∏∫αβγπ≠≤≥∞x-z]+)/g, // 数学符号和变量
  ];
  
  for (const pattern of mathPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0].replace(/\$\$?/g, '').trim();
    }
  }
  
  // 如果没有找到特定格式，返回原文本
  return text.trim();
};

/**
 * 识别图片中的数学表达式 - 主函数
 * 
 * @param imageUri 本地图片URI
 * @returns OCR识别结果
 */
export const recognizeMathExpression = async (imageUri: string): Promise<OCRResult> => {
  console.log('开始OCR识别，图片路径:', imageUri);

  // 如果开启模拟数据模式
  if (APP_CONFIG.FEATURES.USE_MOCK_DATA) {
    console.log('使用模拟数据: OCR识别');
    return mockOCRResult('2x + 5 = 15');
  }

  try {
    // 优先使用后端接口
    try {
      console.log('尝试调用后端OCR接口...');
      const result = await callBackendOCR(imageUri);
      console.log('后端OCR识别成功:', result.mathExpression);
      return result;
    } catch (backendError) {
      console.warn('后端OCR调用失败，尝试直接调用Qwen-VL API:', backendError);
      
      // 如果后端调用失败，尝试直接调用Qwen API
      const base64Image = await imageToBase64(imageUri);
      const result = await callQwenVLDirect(base64Image);
      console.log('Qwen-VL API识别成功:', result.mathExpression);
      return result;
    }
  } catch (error) {
    console.error('OCR识别完全失败:', error);

    // 返回错误结果
    return {
      text: '',
      mathExpression: '',
      confidence: 0,
      boundingBoxes: [],
      error: error instanceof Error ? error.message : '识别失败',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * 批量OCR识别
 */
export const batchRecognizeMathExpressions = async (imageUris: string[]): Promise<OCRResult[]> => {
  console.log(`开始批量OCR识别，共${imageUris.length}张图片`);

  const results: OCRResult[] = [];
  
  for (let i = 0; i < imageUris.length; i++) {
    try {
      console.log(`正在处理第${i + 1}张图片...`);
      const result = await recognizeMathExpression(imageUris[i]);
      results.push(result);
    } catch (error) {
      console.error(`第${i + 1}张图片识别失败:`, error);
      results.push({
        text: '',
        mathExpression: '',
        confidence: 0,
        boundingBoxes: [],
        error: error instanceof Error ? error.message : '识别失败',
        timestamp: new Date().toISOString(),
      });
    }
  }

  console.log(`批量OCR识别完成，成功${results.filter(r => !r.error).length}张`);
  return results;
};

/**
 * 验证OCR结果质量
 */
export const validateOCRResult = (result: OCRResult): boolean => {
  if (result.error) return false;
  if (result.confidence < 0.5) return false;
  if (!result.mathExpression || result.mathExpression.length < 2) return false;
  
  return true;
};

/**
 * 获取OCR服务状态
 */
export const getOCRServiceStatus = async (): Promise<{
  available: boolean;
  backend: boolean;
  direct: boolean;
  error?: string;
}> => {
  try {
    // 检查后端服务
    const backendAvailable = await fetch(`${API_URL}${API_PATHS.HEALTH}`)
      .then(res => res.ok)
      .catch(() => false);

    // 检查API密钥
    const directAvailable = !!QWEN_API.KEY;

    return {
      available: backendAvailable || directAvailable,
      backend: backendAvailable,
      direct: directAvailable,
    };
  } catch (error) {
    return {
      available: false,
      backend: false,
      direct: false,
      error: error instanceof Error ? error.message : '检查服务状态失败',
    };
  }
}; 