@echo off
chcp 65001 >nul
title OCR修复测试 - 多端点版本

echo.
echo 🔧 ==========================================
echo    OCR修复测试 - 多端点API尝试
echo ==========================================
echo.
echo 🎯 修复内容:
echo    ✅ 更新API端点配置
echo    ✅ 添加多端点自动尝试
echo    ✅ 增强错误诊断功能
echo    ✅ 优化图片格式检测
echo.

echo 🔧 配置API密钥...
set DASHSCOPE_API_KEY=sk-2763f2c284eb4503845e73ff6b58c172

echo 📂 进入项目目录...
cd /d "%~dp0math-solver-backend"

echo.
echo 🚀 启动修复版OCR服务...
echo    🌐 端点1: https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
echo    🌐 端点2: https://dashscope.aliyuncs.com/api/v1/multimodal-generation/generation
echo    🌐 端点3: 原始端点 (备用)
echo.
echo 📱 将自动打开测试页面: http://localhost:3001/smart-ocr-test.html
echo.

start "" node server.js

echo 📱 等待服务启动...
timeout /t 3 /nobreak >nul
start "" "http://localhost:3001/smart-ocr-test.html"

echo.
echo ✅ 修复版OCR系统已启动！
echo.
echo 🔍 测试建议:
echo    1. 先测试内置的简单图片 "1+1=2"
echo    2. 如果成功，说明修复有效
echo    3. 如果仍失败，查看控制台的详细错误信息
echo    4. 系统会自动尝试3个不同的API端点
echo.
echo 📊 预期结果:
echo    • 如果端点1成功 → 问题已解决
echo    • 如果端点2成功 → API路径问题已修复
echo    • 如果都失败 → 可能是权限问题
echo.
echo 按任意键查看服务器日志...
pause >nul 