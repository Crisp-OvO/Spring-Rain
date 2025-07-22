@echo off
chcp 65001 >nul
title Web版一键启动

echo.
echo 🌐 Qwen数学解题助手 - Web版一键启动
echo.

REM 设置环境变量
set DASHSCOPE_API_KEY=sk-2763f2c284eb4503845e73ff6b58c172
set PORT=3001

echo 🚀 启动中...

REM 启动后端
pushd math-solver-backend
start /min "后端服务" cmd /c "set DASHSCOPE_API_KEY=%DASHSCOPE_API_KEY% && set PORT=%PORT% && node server.js"
popd

REM 等待启动
timeout /t 2 >nul

REM 打开Web版
start "" "%~dp0web\index.html"

echo ✅ Web版已启动！浏览器中即将打开应用界面
echo 💡 后端服务在后台运行，关闭浏览器不会停止服务
timeout /t 3 