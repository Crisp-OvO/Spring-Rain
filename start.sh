#!/bin/bash

# 设置环境变量
export DASHSCOPE_API_KEY="sk-2763f2c284eb4503845e73ff6b58c172"
export PORT=3001

echo "🚀 启动 Qwen 数学解题助手 Web 版..."

# 启动后端服务
cd math-solver-backend
echo "🔧 启动后端服务（端口：$PORT）..."
node server.js &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 2

# 打开网页界面
echo "🌐 打开前端 index.html..."
open web/index.html

echo "✅ 启动完成！"

# 提示用户关闭说明
echo ""
echo "📌 注意：关闭终端或按 Ctrl+C 会终止后端服务。"
echo "🔚 若你想手动关闭后端服务，运行： kill $BACKEND_PID"
