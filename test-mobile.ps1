# Qwen数学解题助手 - 手机测试自动化脚本
# 作者: AI Assistant
# 版本: 1.0.0

Write-Host "🚀 Qwen数学解题助手 - 手机测试启动器" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Yellow

# 检查当前目录
$currentDir = Get-Location
Write-Host "📂 当前目录: $currentDir" -ForegroundColor Cyan

# 检查必要文件
$requiredFiles = @("package.json", "index.js", "src")
$missingFiles = @()

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ 缺少必要文件: $($missingFiles -join ', ')" -ForegroundColor Red
    Write-Host "请确保在正确的项目根目录下运行此脚本" -ForegroundColor Red
    pause
    exit
}

Write-Host "✅ 项目文件检查通过" -ForegroundColor Green

# 选择测试方案
Write-Host "`n🔧 请选择测试方案:" -ForegroundColor Yellow
Write-Host "1. Expo开发版测试 (推荐，最简单)" -ForegroundColor White
Write-Host "2. 传统React Native测试 (需要Android Studio)" -ForegroundColor White
Write-Host "3. 仅启动后端服务进行API测试" -ForegroundColor White
Write-Host "4. 查看完整测试指南" -ForegroundColor White

$choice = Read-Host "`n请输入选择 (1-4)"

switch ($choice) {
    "1" {
        Write-Host "`n🚀 启动Expo开发版测试..." -ForegroundColor Green
        
        # 检查Expo CLI
        try {
            $expoVersion = & npx @expo/cli --version 2>$null
            Write-Host "✅ Expo CLI版本: $expoVersion" -ForegroundColor Green
        }
        catch {
            Write-Host "📦 正在安装Expo CLI..." -ForegroundColor Yellow
            npm install -g @expo/cli
        }
        
        # 启动Expo开发服务器
        Write-Host "🌐 启动Expo开发服务器..." -ForegroundColor Cyan
        Write-Host "请在手机上安装 'Expo Go' 应用，然后扫描二维码" -ForegroundColor Yellow
        npx expo start
    }
    
    "2" {
        Write-Host "`n🔧 启动传统React Native测试..." -ForegroundColor Green
        
        # 检查ADB
        try {
            $adbDevices = & adb devices 2>$null
            Write-Host "📱 检测到的设备:" -ForegroundColor Cyan
            Write-Host $adbDevices -ForegroundColor White
        }
        catch {
            Write-Host "❌ 未找到ADB工具，请确保已安装Android Studio" -ForegroundColor Red
            Write-Host "下载地址: https://developer.android.com/studio" -ForegroundColor Yellow
            pause
            exit
        }
        
        # 启动后端服务 (后台)
        Write-Host "🖥️ 启动后端服务..." -ForegroundColor Cyan
        $backendJob = Start-Job -ScriptBlock {
            Set-Location $using:currentDir
            npm run backend
        }
        
        Start-Sleep -Seconds 3
        
        # 启动React Native
        Write-Host "📱 启动React Native应用..." -ForegroundColor Cyan
        npm run android
    }
    
    "3" {
        Write-Host "`n🖥️ 启动后端服务进行API测试..." -ForegroundColor Green
        
        # 启动后端
        Write-Host "🚀 启动后端服务..." -ForegroundColor Cyan
        Start-Process cmd -ArgumentList "/k", "npm run backend"
        
        Start-Sleep -Seconds 5
        
        # 测试API
        Write-Host "🧪 测试API连接..." -ForegroundColor Cyan
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 10
            Write-Host "✅ 后端API响应正常:" -ForegroundColor Green
            Write-Host ($response | ConvertTo-Json -Depth 2) -ForegroundColor White
        }
        catch {
            Write-Host "❌ API测试失败: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "请检查后端服务是否正常启动" -ForegroundColor Yellow
        }
        
        # 获取本机IP
        try {
            $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.InterfaceAlias -notlike "*VirtualBox*"} | Select-Object -First 1).IPAddress
            Write-Host "`n📱 移动设备访问地址: http://$localIP:3001" -ForegroundColor Yellow
        }
        catch {
            Write-Host "`n📱 移动设备访问地址: http://192.168.1.100:3001 (请替换为您的IP)" -ForegroundColor Yellow
        }
        Write-Host "请确保手机和电脑在同一WiFi网络中" -ForegroundColor Yellow
    }
    
    "4" {
        Write-Host "`n📖 打开完整测试指南..." -ForegroundColor Green
        if (Test-Path "手机测试指南.md") {
            Start-Process "手机测试指南.md"
        } else {
            Write-Host "❌ 未找到测试指南文件" -ForegroundColor Red
        }
    }
    
    default {
        Write-Host "❌ 无效选择，请重新运行脚本" -ForegroundColor Red
        pause
        exit
    }
}

Write-Host "`n📋 快速测试清单:" -ForegroundColor Yellow
Write-Host "1. ✅ 应用启动正常，显示中文界面" -ForegroundColor White
Write-Host "2. ✅ 底部导航4个Tab正常切换" -ForegroundColor White  
Write-Host "3. ✅ 手动输入解题功能正常" -ForegroundColor White
Write-Host "4. ✅ 相机/相册选择功能正常" -ForegroundColor White
Write-Host "5. ✅ 设置页面配置正常" -ForegroundColor White
Write-Host "6. ✅ 历史记录查看正常" -ForegroundColor White

Write-Host "`n🎉 测试启动完成！请按照清单进行功能验证" -ForegroundColor Green
Write-Host "如遇问题，请查看 '手机测试指南.md' 获取详细解决方案" -ForegroundColor Cyan

# 等待用户确认
Write-Host "`n按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 清理后台任务
if ($backendJob) {
    Stop-Job $backendJob
    Remove-Job $backendJob
} 