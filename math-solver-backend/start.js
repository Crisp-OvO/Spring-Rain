#!/usr/bin/env node

// 启动脚本 - 检查环境配置
console.log('🚀 启动Qwen数学解题后端服务...\n');

// 检查环境变量
const requiredEnvVars = {
  'DASHSCOPE_API_KEY': process.env.DASHSCOPE_API_KEY || 'sk-2763f2c284eb4503845e73ff6b58c172',
  'PORT': process.env.PORT || '3001',
  'NODE_ENV': process.env.NODE_ENV || 'development'
};

console.log('📋 环境配置检查:');
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (value && value !== 'your_dashscope_api_key_here') {
    console.log(`✅ ${key}: 已配置`);
  } else {
    console.log(`⚠️  ${key}: 未配置 (将使用默认值)`);
  }
}

console.log('\n🔗 连接信息:');
console.log(`阿里云API: ${process.env.DASHSCOPE_API_KEY ? '已配置' : '使用默认密钥'}`);
console.log(`服务端口: ${process.env.PORT || '3001'}`);
console.log(`运行环境: ${process.env.NODE_ENV || 'development'}`);

console.log('\n⚙️  启动配置建议:');
console.log('1. 设置环境变量 DASHSCOPE_API_KEY 为您的阿里云百炼API密钥');
console.log('2. 可选: 设置 PORT 自定义服务端口');
console.log('3. 可选: 设置 NODE_ENV=production 用于生产环境');

console.log('\n🌐 启动服务器...\n');

// 设置默认环境变量
if (!process.env.DASHSCOPE_API_KEY) {
  process.env.DASHSCOPE_API_KEY = 'sk-2763f2c284eb4503845e73ff6b58c172';
}

// 启动主服务器
require('./server.js'); 