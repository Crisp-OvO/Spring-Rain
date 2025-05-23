# Spring Rain - 数学解题助手

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Spring Rain是一款智能数学解题应用，支持通过拍照识别数学题目，并提供详细的解题步骤和解析。该应用采用React Native和Expo开发，实现了从图像识别到数学推理的完整解题流程。

![应用截图预览](assets/app_preview.png)

## 📋 功能特性

- **智能拍照识别**：使用TrOCR模型识别手写或印刷数学表达式
- **强大解题引擎**：利用DeepSeekMath模型解析复杂数学问题
- **解题步骤详解**：展示解题过程和详细步骤
- **历史记录管理**：保存和查看所有解题历史
- **标签与分类**：为问题添加类型、难度和掌握情况标签
- **学习统计分析**：通过图表展示学习进度和统计数据
- **离线模式支持**：无网络情况下使用基本功能

## 🔧 技术架构

### 前端

- **框架**: React Native, Expo (SDK 53)
- **状态管理**: React Context API
- **UI组件**: React Native Paper, React Native Elements
- **导航**: React Navigation
- **图表**: Victory Native
- **网络请求**: Axios
- **存储**: AsyncStorage
- **图像处理**: Expo Camera, Image Picker

### 后端

- **服务器**: Express.js
- **图像识别**: Hugging Face TrOCR API
- **数学推理**: DeepSeekMath Model
- **数学计算库**: Mathjs
- **文件处理**: Multer
- **数据格式**: JSON

## 📁 项目结构

```
Spring Rain/
├── src/                              # 前端源代码
│   ├── constants/                    # 全局常量和配置
│   ├── contexts/                     # React Context
│   ├── mocks/                        # 模拟数据
│   ├── navigation/                   # 导航配置
│   ├── screens/                      # 界面组件
│   │   ├── auth/                     # 认证相关界面
│   │   └── main/                     # 主要功能界面
│   │       ├── CameraScreen.tsx      # 拍照界面
│   │       ├── HistoryScreen.tsx     # 历史记录列表
│   │       ├── HistoryDetailScreen.tsx # 历史记录详情
│   │       ├── ResultScreen.tsx      # 解题结果展示
│   │       └── StatsScreen.tsx       # 统计分析界面
│   ├── services/                     # 服务层
│   │   ├── apiService.ts             # API请求封装
│   │   ├── authService.ts            # 认证服务
│   │   ├── backendService.ts         # 后端交互
│   │   ├── dbService.ts              # 数据存储
│   │   ├── mathService.ts            # 数学解析
│   │   ├── ocrService.ts             # OCR识别
│   │   ├── storage.ts                # 本地存储
│   │   └── userService.ts            # 用户服务
│   └── styles/                       # 样式和主题
├── math-solver-backend/              # 后端源代码
│   ├── server.js                     # Express服务器
│   └── uploads/                      # 上传文件存储
├── App.tsx                           # 应用入口
├── app.config.js                     # Expo配置
└── tsconfig.json                     # TypeScript配置
```

## 🚀 快速开始

### 开发环境要求

- Node.js (v16.0.0+)
- npm/yarn
- Expo CLI
- 移动设备或模拟器

### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/yourusername/spring-rain.git
cd spring-rain
```

2. **安装前端依赖**

```bash
npm install
```

3. **安装后端依赖**

```bash
cd math-solver-backend
npm install
```

4. **配置API密钥**

在`src/constants/config.ts`中配置Hugging Face API密钥：

```typescript
export const HUGGING_FACE_API = {
  KEY: 'your_huggingface_api_key',
  // 其它配置...
};
```

5. **启动后端服务**

```bash
cd math-solver-backend
npm run dev
```

6. **修改API地址**

将`src/constants/config.ts`和`app.config.js`中的API_URL更新为您的计算机IP地址：

```typescript
export const API_URL = 'http://your-ip-address:3000';
```

7. **启动前端应用**

```bash
cd ..  # 返回到项目根目录
npm start
```

8. **在设备上运行**
   - 使用Expo Go应用扫描终端中的二维码
   - 或使用模拟器

### 网络连接

请确保前端应用和后端服务器在同一网络下，并且移动设备可以访问计算机IP地址。

## 🔍 主要功能详解

### OCR识别

应用使用Hugging Face的TrOCR模型进行OCR识别，支持识别手写和印刷的数学表达式。图像通过base64编码传输，以避免处理本地文件URI的麻烦。

### 数学解析

应用集成了DeepSeekMath数学推理模型，可以解析和解决多种类型的数学问题：
- 线性方程
- 二次方程
- 算术表达式
- 基础代数
- 数学公式

### 数据存储

应用使用本地存储保存解题历史和用户首选项，同时支持将数据同步到服务器（需要用户账户）。

### 标记系统

问题可以按以下维度进行标记：
- **类型**: 方程、公式、算术、其他
- **难度**: 简单、中等、困难
- **掌握状态**: 已掌握/未掌握

## ⚙️ API接口

### OCR接口

```
POST /ocr/math
// 请求体
{
  "base64Image": "data:image/jpeg;base64,..."
}
// 响应
{
  "text": "2x + 5 = 15",
  "mathExpression": "2x + 5 = 15",
  "confidence": 0.95,
  "status": "success"
}
```

### 解题接口

```
POST /math/solve
// 请求体
{
  "expression": "2x + 5 = 15"
}
// 响应
{
  "id": "problem_12345",
  "expression": "2x + 5 = 15",
  "steps": [
    { "description": "将等式两边同时减5", "formula": "2x = 10" },
    { "description": "将等式两边同时除以2", "formula": "x = 5" }
  ],
  "result": "x = 5"
}
```

## 📱 使用指南

1. **启动应用**：打开应用后，您将看到主页面
2. **拍照或选择图片**：点击"拍照"按钮使用相机，或"上传"按钮选择已有图片
3. **识别结果**：应用将自动识别图片中的数学表达式
4. **查看解答**：应用分析表达式后，将展示详细解题步骤
5. **保存和标记**：可以为解题结果添加标签和笔记
6. **历史记录**：从导航菜单访问历史记录，查看和管理过去的解题

## 💻 开发指南

### 添加新功能

1. 确定功能需求和设计
2. 在相应的服务层实现功能逻辑
3. 在屏幕组件中集成新功能
4. 添加单元测试
5. 提交PR并请求代码审查

### 调试提示

- 使用Expo调试工具进行前端调试
- 使用nodemon热重载功能进行后端调试
- 检查API响应和应用日志以识别问题

## 🛡️ 安全注意事项

- API密钥应保存在环境变量中，不应硬编码
- 用户数据应在传输和存储时加密
- 输入验证应在前端和后端同时实施

## 📄 许可证

本项目采用MIT许可证 - 详情请参阅[LICENSE](LICENSE)文件

## 👥 贡献

欢迎贡献代码、报告问题或提出改进建议。请先创建issue讨论您想要进行的更改。

---

开发者：[Your Name]  
联系方式：[Your Email]  
项目主页：[GitHub Repository URL] 