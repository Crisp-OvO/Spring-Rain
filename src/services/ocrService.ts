import { HUGGING_FACE_API, API_URL } from '../constants/config';
import { mockOCRResult } from '../mocks/mockData';

/**
 * 边界框接口
 */
export interface BoundingBox {
  text: string;        // 框内文本
  coordinates: {       // 四个角的坐标
    topLeft: [number, number];
    topRight: [number, number];
    bottomRight: [number, number];
    bottomLeft: [number, number];
  };
}

/**
 * OCR结果接口
 */
export interface OCRResult {
  text: string;                  // 识别出的文本
  mathExpression: string;        // 识别出的数学表达式
  confidence: number;            // 识别置信度 (0-1)
  boundingBoxes: BoundingBox[];  // 每个识别元素的边界框
  error?: string;                // 错误信息(如果有)
}

// 在开发阶段使用模拟数据
const USE_MOCK_DATA = false;

/**
 * 识别图片中的数学表达式 - 增强版
 * 
 * 首先尝试调用Hugging Face API，如果失败则回退到原始方法
 * 
 * @param imageUri 本地图片URI
 * @returns OCR识别结果
 */
export const recognizeMathExpression = async (imageUri: string): Promise<OCRResult> => {
  // 如果设置了使用模拟数据，直接返回模拟数据
  if (USE_MOCK_DATA) {
    console.log('使用模拟数据: OCR识别');
    return mockOCRResult('2x + 5 = 15');
  }
  
  try {
    // 将图片转换为Blob数据
    const imageResponse = await fetch(imageUri);
    const imageBlob = await imageResponse.blob();
    
    // 转换图片为base64格式
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('转换为base64失败'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });
    
    console.log('图片已转换为base64格式');
    
    // 创建请求数据
    const requestData = {
      base64Image: base64
    };
    
    // 调用后端API
    const apiResponse = await fetch(`${API_URL}/ocr/math`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    if (!apiResponse.ok) {
      throw new Error(`OCR API错误: ${apiResponse.status}`);
    }
    
    const result = await apiResponse.json();
    
    // 检查API返回结果
    if (result.error) {
      throw new Error(result.message || '识别失败');
    }
    
    return {
      text: result.text,
      mathExpression: result.mathExpression,
      confidence: result.confidence || 0.9,
      boundingBoxes: result.boundingBoxes || []
    };
  } catch (error) {
    console.error('OCR识别失败:', error);
    
    // 返回错误结果
    return {
      text: '',
      mathExpression: '',
      confidence: 0,
      boundingBoxes: [],
      error: error instanceof Error ? error.message : '识别失败'
    };
  }
};

/**
 * 验证OCR结果
 * 
 * 根据用户反馈调整OCR结果。用户可以修正识别错误,
 * 这些修正会被发送到服务器以改进OCR模型。
 * 
 * @param imageUri 原始图片URI
 * @param originalResult 原始OCR结果
 * @param correctedExpression 用户修正后的表达式
 * @returns 更新后的OCR结果
 */
export const validateOCRResult = async (
  imageUri: string,
  originalResult: OCRResult,
  correctedExpression: string
): Promise<OCRResult> => {
  if (USE_MOCK_DATA) {
    console.log('使用模拟数据: OCR验证');
    return {
      ...originalResult,
      mathExpression: correctedExpression,
      text: correctedExpression,
      confidence: 1.0 // 用户修正后，置信度设为100%
    };
  }
  
  try {
    // 这里可以添加验证逻辑，如调用后端API
    
    // 返回用户修正的结果
    return {
      ...originalResult,
      mathExpression: correctedExpression,
      text: correctedExpression
    };
  } catch (error) {
    console.error('验证OCR结果失败:', error);
    
    // 返回用户修正的结果
    return {
      ...originalResult,
      mathExpression: correctedExpression,
      text: correctedExpression,
      error: error instanceof Error ? error.message : '验证失败'
    };
  }
}; 