@echo off
chcp 65001 >nul
title 简单启动工具

echo.
echo 🚀 Qwen数学解题助手 - 简单启动
echo =======================================
echo.

REM 设置API密钥环境变量
set DASHSCOPE_API_KEY=sk-2763f2c284eb4503845e73ff6b58c172
set PORT=3001
set NODE_ENV=development

echo 请选择启动方式:
echo [1] 启动后端服务
echo [2] 启动前端开发  
echo [3] 同时启动后端和前端
echo [4] 退出
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
start "Qwen后端服务" cmd /k "set DASHSCOPE_API_KEY=%DASHSCOPE_API_KEY% && set PORT=%PORT% && set NODE_ENV=%NODE_ENV% && node server.js"
popd
timeout /t 2 >nul
start "" "http://localhost:3001"
echo ✅ 后端服务已启动！访问 http://localhost:3001
goto end

:start_frontend
echo.
echo 🔥 启动前端开发...
start "Qwen前端开发" cmd /k "npm start"
echo ✅ 前端开发环境已启动！
echo 💡 在Metro窗口中按 'a' 启动Android 或 'i' 启动iOS
goto end

:start_both
echo.
echo 🔥 启动后端和前端...
echo.
echo 启动后端服务...
pushd math-solver-backend
start "Qwen后端服务" cmd /k "set DASHSCOPE_API_KEY=%DASHSCOPE_API_KEY% && set PORT=%PORT% && set NODE_ENV=%NODE_ENV% && node server.js"
popd
timeout /t 3 >nul

echo 启动前端开发...
start "Qwen前端开发" cmd /k "npm start"
timeout /t 2 >nul

start "" "http://localhost:3001"
echo.
echo ✅ 所有服务已启动！
echo 📱 后端: http://localhost:3001
echo 🖥️  前端: 在Metro窗口中按 'a' 或 'i'
goto end

:end
echo.
echo 🎉 完成！
pause 