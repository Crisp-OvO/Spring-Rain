@echo off
chcp 65001 >nul
title 快速重启OCR测试

echo 🚀 快速重启OCR测试工具
echo ====================
echo.

echo 1. 停止现有服务...
taskkill /f /im node.exe /t >nul 2>&1
echo ✅ 进程清理完成
echo.

echo 2. 设置环境变量...
set DASHSCOPE_API_KEY=sk-2763f2c284eb4503845e73ff6b58c172
echo ✅ API密钥: %DASHSCOPE_API_KEY%
echo.

echo 3. 启动优化后的OCR服务...
cd /d "%~dp0math-solver-backend"
start "OCR优化服务" cmd /k "echo 🔧 OCR服务已优化! && echo API密钥: %DASHSCOPE_API_KEY% && echo 📸 图片格式检测: 启用 && echo 🔍 详细日志: 启用 && echo ================= && node server.js"

timeout /t 5 >nul

echo.
echo 4. 打开测试页面...
start http://localhost:3001/simple-ocr-test.html

echo.
echo 🎯 OCR优化内容:
echo ┌─────────────────────────────────────┐
echo │ ✅ 1. 图片格式自动检测 (JPG/PNG/GIF) │
echo │ ✅ 2. Base64数据验证和清理           │
echo │ ✅ 3. 图片大小检查 (1KB-10MB)        │
echo │ ✅ 4. MIME类型动态设置               │
echo │ ✅ 5. 增强错误处理和日志             │
echo │ ✅ 6. API参数优化                    │
echo └─────────────────────────────────────┘
echo.

echo 💡 测试建议:
echo 1. 使用清晰的数学题图片
echo 2. 确保图片大小在1KB-10MB之间
echo 3. 支持JPG、PNG、GIF格式
echo 4. 查看后端日志获取详细信息
echo.

echo 🌐 测试地址:
echo   电脑: http://localhost:3001/simple-ocr-test.html
echo   手机: http://10.233.15.100:3001/simple-ocr-test.html
echo.

pause 