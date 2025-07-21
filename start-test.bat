@echo off
chcp 65001 >nul

echo 🚀 Qwen数学解题助手 - 手机测试
echo ================================

echo 当前目录: %cd%

if not exist "package.json" (
    echo 错误: 未找到 package.json 文件
    pause
    exit /b 1
)

echo 项目文件检查通过
echo.

echo 请选择测试方案:
echo 1. 启动后端API测试
echo 2. 启动React Native测试
echo 3. 查看测试指南

set /p choice=请输入选择 (1-3): 

if "%choice%"=="1" goto api_test
if "%choice%"=="2" goto rn_test
if "%choice%"=="3" goto guide

:api_test
echo 启动后端服务...
start cmd /k "npm run backend"
echo 等待5秒...
timeout /t 5 >nul
echo 测试API...
curl http://localhost:3001/health
pause
goto end

:rn_test
echo 检查设备连接...
adb devices
echo 启动后端...
start cmd /k "npm run backend"
echo 启动应用...
npm run android
pause
goto end

:guide
if exist "手机测试指南.md" (
    start "手机测试指南.md"
) else (
    echo 未找到测试指南
)
pause

:end
echo 测试完成
pause 