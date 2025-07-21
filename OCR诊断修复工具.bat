@echo off
chcp 65001 >nul
title OCR诊断修复工具

echo 🔍 OCR诊断修复工具
echo ================
echo.

echo 正在诊断OCR识别问题...
echo.

echo 1. 检查API密钥配置...
set DASHSCOPE_API_KEY=sk-2763f2c284eb4503845e73ff6b58c172
echo ✅ API密钥: %DASHSCOPE_API_KEY%
echo.

echo 2. 测试网络连接...
echo 检查阿里云服务连接...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://dashscope.aliyuncs.com' -UseBasicParsing -TimeoutSec 5; Write-Host '✅ 阿里云服务可访问' -ForegroundColor Green } catch { Write-Host '❌ 无法访问阿里云服务' -ForegroundColor Red; Write-Host $_.Exception.Message }"
echo.

echo 3. 重启后端服务（带详细日志）...
taskkill /f /im node.exe /t >nul 2>&1
echo ✅ 旧进程已清理
echo.

echo 启动OCR调试模式...
cd /d "%~dp0math-solver-backend"

echo 设置环境变量...
set NODE_ENV=development
set DEBUG=ocr:*
set DASHSCOPE_API_KEY=%DASHSCOPE_API_KEY%

echo.
echo 🚀 启动服务器（OCR调试模式）...
start "OCR调试-后端服务" cmd /k "echo === OCR调试模式 === && echo API密钥: %DASHSCOPE_API_KEY% && echo 调试级别: 详细 && echo ===================== && node server.js"

timeout /t 8 >nul

echo.
echo 4. 测试OCR接口可用性...
cd /d "%~dp0"

echo 测试健康检查...
powershell -Command "try { $health = Invoke-RestMethod -Uri 'http://localhost:3001/health' -TimeoutSec 5; Write-Host '✅ 后端服务正常' -ForegroundColor Green; Write-Host ('OCR模型: ' + $health.models.ocr) } catch { Write-Host '❌ 后端服务异常' -ForegroundColor Red }"

echo.
echo 测试OCR接口响应（空请求）...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/ocr/math' -Method POST -ContentType 'application/json' -Body '{}' -UseBasicParsing; Write-Host ('响应状态: ' + $response.StatusCode) } catch { if($_.Exception.Response.StatusCode -eq 400) { Write-Host '✅ OCR接口响应正常（400为预期错误）' -ForegroundColor Green } else { Write-Host '❌ OCR接口异常' -ForegroundColor Red; Write-Host $_.Exception.Message } }"

echo.
echo 5. 创建测试图片进行OCR测试...
powershell -Command "
# 创建一个简单的测试用base64图片（1x1像素PNG）
$testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='

# 构建测试请求
$body = @{
    imageData = 'data:image/png;base64,' + $testImageBase64
} | ConvertTo-Json

try {
    Write-Host '🧪 发送OCR测试请求...'
    $response = Invoke-RestMethod -Uri 'http://localhost:3001/ocr/math' -Method POST -ContentType 'application/json' -Body $body -TimeoutSec 10
    
    Write-Host '✅ OCR测试成功！' -ForegroundColor Green
    Write-Host ('识别状态: ' + $response.status)
    Write-Host ('识别文本: ' + $response.text)
    Write-Host ('使用模型: ' + $response.model)
    
    if($response.error) {
        Write-Host ('⚠️ 注意: ' + $response.error) -ForegroundColor Yellow
    }
} catch {
    Write-Host '❌ OCR测试失败！' -ForegroundColor Red
    Write-Host ('错误信息: ' + $_.Exception.Message)
    
    if($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host ('服务器响应: ' + $errorBody)
    }
}
"

echo.
echo 6. 打开OCR专用测试页面...
timeout /t 2 >nul
start http://localhost:3001/ocr-test.html

echo.
echo 📋 OCR问题排查清单:
echo ┌─────────────────────────────────────┐
echo │ ☐ 1. API密钥是否有效？              │
echo │ ☐ 2. 阿里云账户余额是否充足？        │
echo │ ☐ 3. DashScope OCR服务是否开通？     │
echo │ ☐ 4. 网络是否能访问阿里云？          │
echo │ ☐ 5. 图片格式是否支持？              │
echo │ ☐ 6. 图片大小是否超限？              │
echo │ ☐ 7. 服务器日志中是否有详细错误？    │
echo └─────────────────────────────────────┘
echo.

echo 💡 如果OCR仍然失败，请：
echo 1. 查看后端服务窗口的详细错误日志
echo 2. 检查阿里云DashScope控制台的API使用情况
echo 3. 确认API密钥有OCR权限
echo 4. 尝试使用不同格式的图片测试
echo.

echo 🌐 测试页面地址:
echo   电脑: http://localhost:3001/ocr-test.html
echo   手机: http://10.233.15.100:3001/ocr-test.html
echo.

pause 