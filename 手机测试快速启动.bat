@echo off
chcp 65001 >nul
title Qwen数学解题助手 - 手机测试一键启动

echo.
echo 🚀 Qwen数学解题助手 - 手机测试一键启动
echo ================================================
echo.

echo 📱 手机访问地址: 
echo 主地址: http://10.233.15.100:3001
echo 备用地址: http://26.26.26.1:3001
echo.

echo 🌐 网页测试界面:
echo http://10.233.15.100:3001/mobile-test.html
echo.

echo 正在启动服务...
echo.

echo 1. 启动后端服务...
start "Qwen后端服务" cmd /k "cd /d \"%~dp0math-solver-backend\" && set DASHSCOPE_API_KEY=sk-2763f2c284eb4503845e73ff6b58c172 && node server.js"

timeout /t 3 >nul

echo 2. 启动网页服务器...
start "网页服务器" cmd /k "cd /d \"%~dp0\" && python -m http.server 8080"

timeout /t 2 >nul

echo 3. 启动React Native Metro...
start "Metro服务器" cmd /k "cd /d \"%~dp0\" && npm start"

timeout /t 3 >nul

echo 4. 打开测试页面...
start "" "http://localhost:8080/mobile-test.html"

echo.
echo ✅ 所有服务启动完成！
echo.
echo 📋 测试步骤:
echo.
echo 方案1 - 网页测试 (推荐):
echo   1. 确保手机和电脑在同一WiFi
echo   2. 手机浏览器访问: http://10.233.15.100:8080/mobile-test.html
echo   3. 按界面提示进行各项功能测试
echo.
echo 方案2 - API直接测试:
echo   手机浏览器访问: http://10.233.15.100:3001/health
echo.
echo 方案3 - React Native测试:
echo   按 'a' 键启动Android应用 (需要连接设备)
echo.
echo 🚨 如遇问题:
echo   - 检查WiFi连接
echo   - 重启服务
echo   - 尝试备用IP地址
echo.

pause 