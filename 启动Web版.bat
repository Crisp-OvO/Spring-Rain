@echo off
chcp 65001 >nul
title Qwen数学解题助手 - Web版启动

echo.
echo 🌐 ==========================================
echo    Qwen数学解题助手 - Web版启动
echo ==========================================
echo.

REM 设置API密钥环境变量
set DASHSCOPE_API_KEY=sk-2763f2c284eb4503845e73ff6b58c172
set PORT=3001
set NODE_ENV=development
set DEBUG=true

echo 🔍 检查环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js未安装！请先安装Node.js LTS版本
    echo 📥 下载地址: https://nodejs.org/zh-cn/
    pause
    exit /b 1
)
echo ✅ Node.js环境正常

echo.
echo 🔑 环境变量已配置：
echo • DASHSCOPE_API_KEY: 已设置
echo • PORT: %PORT%
echo • NODE_ENV: %NODE_ENV%

echo.
echo 🚀 启动Web版应用...
echo.

REM 启动后端服务
echo 📡 启动后端API服务...
pushd math-solver-backend
start "Qwen后端API服务" cmd /k "set DASHSCOPE_API_KEY=%DASHSCOPE_API_KEY% && set PORT=%PORT% && set NODE_ENV=%NODE_ENV% && echo 🚀 后端服务启动中... && node server.js"
popd

REM 等待后端服务启动
echo ⏱️ 等待后端服务启动... (3秒)
timeout /t 3 >nul

REM 检查后端服务是否启动成功
echo 🔍 检查后端服务状态...
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 后端服务启动成功！
) else (
    echo ⚠️ 后端服务可能需要更多时间启动，继续等待...
    timeout /t 2 >nul
)

REM 获取当前脚本所在目录
set SCRIPT_DIR=%~dp0

REM 启动Web版本
echo 🌐 启动Web版界面...
echo.
echo 📱 Web版本将在浏览器中打开...
echo 🔗 本地地址: file:///%SCRIPT_DIR%web/index.html
echo 📡 后端API: http://localhost:3001
echo.

REM 在默认浏览器中打开web版本
start "" "%SCRIPT_DIR%web\index.html"

REM 同时打开后端API状态页面
timeout /t 1 >nul
start "" "http://localhost:3001"

echo.
echo ✅ Web版启动完成！
echo.
echo 🎯 使用说明：
echo • Web界面已在浏览器中打开
echo • 后端API状态页面也已打开
echo • 可以开始使用数学解题和OCR功能
echo.
echo 📋 功能说明：
echo • 📝 数学解题：输入数学题目，AI自动解答
echo • 📷 图片识别：上传图片，OCR识别数学内容
echo • 🔄 自动填充：OCR识别结果自动填入解题框
echo • ⚡ 快捷键：Ctrl+Enter 快速解题
echo.
echo 🔧 故障排除：
echo • 如果页面无法加载，请检查后端服务是否正常
echo • 绿色圆点表示服务正常，红色表示离线
echo • 可以点击"测试连接"按钮检查API状态
echo.
echo 💡 提示：保持此窗口打开以维持后端服务运行
pause 