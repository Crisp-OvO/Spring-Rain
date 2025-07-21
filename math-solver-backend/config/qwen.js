/**
 * 阿里云通义千问模型配置
 * 使用最新的Qwen2.5-Math和Qwen-VL模型
 */

const QWEN_CONFIG = {
  // 阿里云百炼平台配置
  DASHSCOPE: {
    API_KEY: process.env.DASHSCOPE_API_KEY || '',
    BASE_URL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc',
    COMPATIBLE_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    // 新增：直接的视觉模型端点
    VISION_URL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    // 备用端点
    VISION_URL_V2: 'https://dashscope.aliyuncs.com/api/v1/multimodal-generation/generation',
  },

  // 数学推理模型配置 - 使用最新的Qwen2.5-Math-Plus
  MATH_MODEL: {
    // 商业版模型 - 推荐使用
    QWEN_PLUS: {
      model: 'qwen-plus',
      version: '2025-04-28',
      name: 'qwen-plus-2025-04-28',
      description: 'Qwen3系列最新数学推理模型',
      maxTokens: 98304,
      maxThinkingTokens: 38912,
      maxOutputTokens: 16384,
      supportsThinking: true,
      supportsFunctionCall: true,
      supportsSearch: true,
    },
    
    // 开源版模型选项
    QWEN_MATH_72B: {
      model: 'qwen2.5-math-72b-instruct',
      name: 'Qwen2.5-Math-72B-Instruct',
      description: '72B参数数学专用模型',
      maxTokens: 32768,
      supportsCoT: true,
      supportsTIR: true, // Tool-integrated Reasoning
    },
    
    QWEN_MATH_7B: {
      model: 'qwen2.5-math-7b-instruct',
      name: 'Qwen2.5-Math-7B-Instruct',
      description: '7B参数数学专用模型',
      maxTokens: 32768,
      supportsCoT: true,
      supportsTIR: true,
    },
  },

  // OCR识别模型配置 - 使用Qwen-VL最新版本
  OCR_MODEL: {
    // 通用OCR模型
    QWEN_VL_MAX: {
      model: 'qwen-vl-max',
      name: 'Qwen-VL-Max',
      description: '最强视觉理解模型，支持数学公式识别',
      maxTokens: 8192,
      supportsImageAnalysis: true,
      supportsMathFormula: true,
      supportsTableRecognition: true,
    },
    
    // 数学公式专用OCR
    QWEN_VL_PLUS: {
      model: 'qwen-vl-plus',
      name: 'Qwen-VL-Plus',
      description: '高性能视觉模型，适合数学场景',
      maxTokens: 8192,
      supportsImageAnalysis: true,
      supportsMathFormula: true,
    },
  },

  // API调用配置
  API_CONFIG: {
    timeout: 30000,
    retryTimes: 3,
    retryDelay: 1000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  },

  // 提示词模板
  PROMPTS: {
    MATH_SOLVER: {
      COT: `请使用逐步推理的方法解决以下数学问题。请按照以下格式回答：
1. 问题分析：分析题目类型和要求
2. 解题思路：说明解题方法和步骤
3. 详细计算：展示完整的计算过程
4. 最终答案：给出明确的答案

问题：{expression}

请开始解答：`,

      TIR: `请使用工具集成推理的方法解决以下数学问题。你可以使用代码来辅助计算：

问题：{expression}

请按照以下步骤：
1. 分析问题类型
2. 设计解题算法
3. 编写计算代码（如需要）
4. 执行计算并验证
5. 给出最终答案

请开始解答：`,

      THINKING: `请深度思考并解决以下数学问题：{expression}

请开启思考模式，详细分析每一步的逻辑推理过程。`
    },

    OCR_ANALYSIS: `请分析这张图片中的数学内容，提取所有的数学表达式、公式和文本。

要求：
1. 识别所有数学符号和公式
2. 保持原有的数学格式
3. 如果有复杂公式，请用LaTeX格式表示
4. 识别题目要求和条件

请返回结构化的识别结果。`
  },
};

module.exports = QWEN_CONFIG; 