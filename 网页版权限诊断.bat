@echo off
chcp 65001 >nul
title 网页版权限诊断工具

echo 🌐 网页版API权限诊断工具
echo ========================
echo.

echo 1. 停止现有服务...
taskkill /f /im node.exe /t >nul 2>&1
echo ✅ 进程清理完成
echo.

echo 2. 设置环境变量...
set DASHSCOPE_API_KEY=sk-2763f2c284eb4503845e73ff6b58c172
echo ✅ API密钥: %DASHSCOPE_API_KEY%
echo.

echo 3. 启动带权限诊断的服务...
cd /d "%~dp0math-solver-backend"
start "权限诊断服务" cmd /k "echo 🌐 权限诊断服务已启动 && echo API密钥: %DASHSCOPE_API_KEY% && echo 🔍 诊断接口: 已启用 && echo ==================== && node server.js"

timeout /t 5 >nul

echo.
echo 4. 打开权限诊断页面...
start http://localhost:3001/api-test.html

echo.
echo 🔍 诊断功能:
echo ┌─────────────────────────────────────┐
echo │ ✅ 后端服务连接测试                 │
echo │ ✅ API基础连接测试                  │
echo │ ✅ 文本模型权限测试                 │
echo │ ✅ OCR模型权限测试 (关键)           │
echo │ ✅ 智能诊断和建议                   │
echo └─────────────────────────────────────┘
echo.

echo 💡 使用说明:
echo 1. 等待页面加载完成
echo 2. 点击"开始完整测试"
echo 3. 查看每个测试结果
echo 4. 特别关注OCR模型权限测试
echo 5. 根据最终诊断结果采取行动
echo.

echo 🌐 测试地址:
echo   电脑: http://localhost:3001/api-test.html
echo   手机: http://10.233.15.100:3001/api-test.html
echo.

echo 📋 预期结果分析:
echo ✅ 如果OCR测试成功 → API权限正常，问题可能在其他地方
echo ❌ 如果OCR测试失败 → 需要开通视觉模型权限
echo ⚠️ 如果文本测试失败 → API密钥可能无效
echo.

pause 