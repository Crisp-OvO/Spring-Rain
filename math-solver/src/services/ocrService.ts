import { uploadImage, post } from './apiService';
import * as FileSystem from 'expo-file-system';

/**
 * OCR结果接口
 */
export interface OCRResult {
  text: string;                  // 识别出的文本
  mathExpression: string;        // 识别出的数学表达式
  confidence: number;            // 识别置信度 (0-1)
  boundingBoxes: BoundingBox[];  // 每个识别元素的边界框
  imageUrl?: string;             // 图片URL (如有)
  error?: string;                // 错误信息(如果有)
}

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

// 禁用模拟数据，始终使用真实API
const USE_MOCK_DATA = false;

/**
 * 识别图片中的数学表达式 - 在线模式
 * 
 * 使用远程OCR服务识别数学表达式。
 * 这个函数将图片信息发送到OCR服务器，服务器处理图片并返回识别结果。
 * 
 * @param imageUri 本地图片URI
 * @returns OCR识别结果
 */
export const recognizeMathExpression = async (imageUri: string): Promise<OCRResult> => {
  try {
    console.log('开始OCR识别，图片路径:', imageUri);
    
    if (!imageUri) {
      throw new Error('图片路径不能为空');
    }
    
    // 将图片转换为base64格式
    let base64Image;
    try {
      // 读取图片文件为base64
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (fileInfo.exists) {
        base64Image = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        console.log('图片已转换为base64格式');
      } else {
        console.error('图片文件不存在');
        throw new Error('图片文件不存在');
      }
    } catch (fileError) {
      console.error('读取图片文件失败:', fileError);
      // 如果无法读取为base64，则直接发送图片URI
      base64Image = null;
    }
    
    // 构建请求数据
    const requestData = {
      imageUri: imageUri,
      // 如果成功转换为base64，则一并发送
      base64Image: base64Image ? `data:image/jpeg;base64,${base64Image}` : null
    };
    
    // 使用POST请求发送图片数据
    const response = await post('/ocr/math', requestData);
    
    console.log('OCR识别成功，结果:', response);
    
    // 确保返回的结果包含所有必要的字段
    const result: OCRResult = {
      text: response?.text || '',
      mathExpression: response?.mathExpression || '',
      confidence: response?.confidence || 0,
      boundingBoxes: response?.boundingBoxes || [],
      imageUrl: response?.imageUrl || imageUri,
      // 以下是可选字段，但我们提供默认值以防undefined
      error: response?.error
    };
    
    return result;
  } catch (error) {
    console.error('识别数学表达式失败:', error);
    
    // 返回错误结果，确保所有字段都有值
    return {
      text: '',
      mathExpression: '',
      confidence: 0,
      boundingBoxes: [],
      imageUrl: imageUri, // 保留原图片路径
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
  try {
    const response = await post('/ocr/validate', {
      imageUri,
      originalExpression: originalResult.mathExpression,
      correctedExpression
    });
    
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

/**
 * 离线模式OCR处理(备用方案)
 * 
 * 当无法连接到远程OCR服务器时，使用本地正则表达式简单处理数学表达式
 * 注意: 这个函数只作为备用方案，识别能力有限
 * 
 * @param text OCR服务返回的原始文本
 * @returns 解析后的数学表达式
 */
export const parseMathExpressionFallback = (text: string): string => {
  // 去除多余空格
  let expression = text.trim().replace(/\s+/g, ' ');
  
  // 替换常见误识别
  expression = expression
    .replace(/[oO]/g, '0')            // 字母O替换为数字0
    .replace(/[lI]/g, '1')            // 字母l或I替换为数字1
    .replace(/\s*[xX×]\s*/g, ' × ')   // 规范化乘法符号
    .replace(/\s*÷\s*/g, ' ÷ ')       // 规范化除法符号
    .replace(/\s*[=]\s*/g, ' = ');    // 规范化等于符号
  
  // 处理分数
  // 例如：将"1 2/3"转换为"(1+2/3)"
  expression = expression.replace(/(\d+)\s+(\d+)\/(\d+)/g, '($1+$2/$3)');
  
  return expression;
}; 