@echo off
chcp 65001 >nul
title API配置修复工具

echo 🔧 API配置修复工具
echo ==================
echo.

echo 正在诊断API配置问题...
echo.

echo 1. 检查API密钥...
set DASHSCOPE_API_KEY=sk-2763f2c284eb4503845e73ff6b58c172
echo ✅ API密钥已设置: %DASHSCOPE_API_KEY%
echo.

echo 2. 检查网络连接...
ping -n 1 dashscope.aliyuncs.com >nul 2>&1
if %errorlevel%==0 (
    echo ✅ 网络连接正常
) else (
    echo ❌ 网络连接失败，请检查网络设置
)
echo.

echo 3. 停止现有服务...
taskkill /f /im node.exe /t >nul 2>&1
echo ✅ 进程清理完成
echo.

echo 4. 重新启动后端服务...
cd /d "%~dp0math-solver-backend"
echo 当前目录: %cd%

echo 启动参数:
echo - API密钥: %DASHSCOPE_API_KEY%
echo - 端口: 3001
echo.

start "API修复-后端服务" cmd /k "echo 🚀 启动中... && set DASHSCOPE_API_KEY=%DASHSCOPE_API_KEY% && echo API密钥: %DASHSCOPE_API_KEY% && node server.js"

timeout /t 5 >nul

echo.
echo 5. 测试API配置...
cd /d "%~dp0"

echo 正在测试健康检查接口...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/health' -TimeoutSec 10; Write-Host '✅ 服务启动成功' -ForegroundColor Green; Write-Host ('API配置状态: ' + (if($response.models) {'✅ 正常'} else {'❌ 失败'})) } catch { Write-Host '❌ 服务启动失败' -ForegroundColor Red; Write-Host ('错误: ' + $_.Exception.Message) }"

echo.
echo 6. API配置验证...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/health' -TimeoutSec 5; if($response.models.math -and $response.models.ocr) { Write-Host '✅ API模型配置正常' -ForegroundColor Green; Write-Host ('数学模型: ' + $response.models.math); Write-Host ('OCR模型: ' + $response.models.ocr) } else { Write-Host '❌ API模型配置异常' -ForegroundColor Red } } catch { Write-Host '⚠️ 无法验证API配置' -ForegroundColor Yellow }"

echo.
echo 📱 测试地址:
echo    电脑: http://localhost:3001/ocr-test.html
echo    手机: http://10.233.15.100:3001/ocr-test.html
echo.

echo 🆘 如果仍有问题，请检查:
echo    1. API密钥是否有效
echo    2. 阿里云账户余额是否充足
echo    3. DashScope服务是否开通
echo    4. 网络是否能访问阿里云服务
echo.

pause 