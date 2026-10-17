@echo off
setlocal enabledelayedexpansion
echo ========================================================
echo   DYNASTORE LAUNCHER - MINECRAFT 1.21.1 CLIENT BUILDER
echo ========================================================

:: 0. Auto-detect Java 21 from .minecraft
if exist "%APPDATA%\.minecraft\jre\OpenJDK21U-jre_x64_windows_hotspot_21.0.3_9\bin\java.exe" (
    set "JAVA_HOME=%APPDATA%\.minecraft\jre\OpenJDK21U-jre_x64_windows_hotspot_21.0.3_9"
    set "PATH=!JAVA_HOME!\bin;!PATH!"
)

echo [1/2] Installing Launcher dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install npm dependencies!
    pause
    exit /b %errorlevel%
)

echo [2/2] Compiling DYNASTORELUNCHER.exe...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Packaging failed!
    pause
    exit /b %errorlevel%
)

if exist "dist\DYNASTORELUNCHER.exe" (
    copy /Y "dist\DYNASTORELUNCHER.exe" "DYNASTORELUNCHER.exe"
    copy /Y "dist\DYNASTORELUNCHER.exe" "DYNASTORE-LUNCHER.exe"
    echo [OK] Copied updated DYNASTORELUNCHER.exe to root directory.
)

echo ========================================================
echo [SUCCESS] Complete DYNASTORE Launcher Ready!
echo Launcher .exe created at: DYNASTORELUNCHER.exe
echo ========================================================
pause
