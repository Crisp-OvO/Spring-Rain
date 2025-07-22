@echo off
chcp 65001 >nul
title 环境变量设置工具

echo.
echo 🔑 环境变量设置工具
echo =======================================
echo.

echo 正在设置环境变量...
echo.

REM 设置API密钥
set DASHSCOPE_API_KEY=sk-2763f2c284eb4503845e73ff6b58c172

REM 设置后端配置
set PORT=3001
set BACKEND_URL=http://localhost:3001

REM 设置开发环境
set NODE_ENV=development
set DEBUG=true

REM 设置API配置
set API_TIMEOUT=30000
set API_RETRY_TIMES=3

REM 设置文件上传配置
set MAX_FILE_SIZE=10485760
set UPLOAD_DIR=uploads

REM 设置功能开关
set ENABLE_MOCK_DATA=false
set ENABLE_OCR=true
set ENABLE_CLOUD_SYNC=true
set ENABLE_OFFLINE_MODE=true

REM 设置安全配置
set JWT_SECRET=qwen_math_solver_secret_key_2024
set ENCRYPTION_KEY=qwen_encryption_key_2024_secure

REM 设置缓存配置
set CACHE_TTL=86400000
set MAX_CACHE_SIZE=100

REM 设置日志配置
set LOG_LEVEL=info
set LOG_FILE=logs/app.log

echo ✅ 环境变量设置完成！
echo.
echo 🔍 当前环境变量:
echo DASHSCOPE_API_KEY: %DASHSCOPE_API_KEY%
echo PORT: %PORT%
echo NODE_ENV: %NODE_ENV%
echo.

echo 🚀 现在可以启动后端服务了
echo.

echo 请选择下一步操作:
echo [1] 启动后端服务
echo [2] 启动前端开发
echo [3] 同时启动后端和前端
echo [4] 只设置环境变量，手动启动
echo.

set /p choice=请输入选择 (1-4): 

if "%choice%"=="1" goto start_backend
if "%choice%"=="2" goto start_frontend
if "%choice%"=="3" goto start_both
if "%choice%"=="4" goto end

:start_backend
echo.
echo 🔥 启动后端服务...
pushd math-solver-backend
start "Qwen后端服务" cmd /k "node server.js"
popd
timeout /t 2 >nul
start "" "http://localhost:3001"
echo ✅ 后端服务已启动！
goto end

:start_frontend
echo.
echo 🔥 启动前端开发...
start "Qwen前端开发" cmd /k "npm start"
echo ✅ 前端开发环境已启动！
goto end

:start_both
echo.
echo 🔥 启动后端和前端...
pushd math-solver-backend
start "Qwen后端服务" cmd /k "node server.js"
popd
timeout /t 3 >nul
start "Qwen前端开发" cmd /k "npm start"
timeout /t 2 >nul
start "" "http://localhost:3001"
echo ✅ 所有服务已启动！
goto end

:end
echo.
echo 🎉 完成！环境变量在当前会话中有效
echo.
echo 💡 注意：
echo • 环境变量只在当前命令行会话中有效
echo • 如果关闭命令行窗口，需要重新运行此脚本
echo • 建议创建 .env 文件进行持久化配置
echo.
pause 