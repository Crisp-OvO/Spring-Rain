#!/usr/bin/env node

// 启动脚本 - 检查环境配置
console.log('🚀 启动Spring Rain数学解题后端服务...\n');

// 检查环境变量
const requiredEnvVars = {
  'MONGODB_URI': process.env.MONGODB_URI,
  'HUGGING_FACE_API_KEY': process.env.HUGGING_FACE_API_KEY
};

console.log('📋 环境配置检查:');
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (value) {
    console.log(`✅ ${key}: 已配置`);
  } else {
    console.log(`⚠️  ${key}: 未配置 (将使用默认值)`);
  }
}

console.log('\n🔗 连接信息:');
console.log(`MongoDB: ${process.env.MONGODB_URI || '使用默认连接字符串'}`);
console.log(`HuggingFace API: ${process.env.HUGGING_FACE_API_KEY ? '已配置' : '使用默认密钥'}`);

console.log('\n⚙️  启动配置建议:');
console.log('1. 设置环境变量 MONGODB_URI 为您的MongoDB连接字符串');
console.log('2. 设置环境变量 HUGGING_FACE_API_KEY 为您的Hugging Face API密钥');
console.log('3. 可选: 设置 DEEPSEEK_MATH_API_KEY 用于数学推理');

console.log('\n🌐 启动服务器...\n');

// 启动主服务器
require('./server.js'); 