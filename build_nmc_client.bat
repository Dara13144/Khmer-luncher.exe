@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo       NMC LAUNCHER - COMPLETE CLIENT AND MOD BUILDER
echo ========================================================

:: Auto-detect Java 21
if exist "%APPDATA%\.minecraft\jre\OpenJDK21U-jre_x64_windows_hotspot_21.0.3_9\bin\java.exe" (
    set "JAVA_HOME=%APPDATA%\.minecraft\jre\OpenJDK21U-jre_x64_windows_hotspot_21.0.3_9"
    set "PATH=%APPDATA%\.minecraft\jre\OpenJDK21U-jre_x64_windows_hotspot_21.0.3_9\bin;!PATH!"
    echo [OK] Using Java Home: !JAVA_HOME!
)

echo [1/3] Compiling Fabric 1.21.1 Java PvP Mod...
cd NMCClientMod
call gradlew.bat build
if %errorlevel% neq 0 (
    echo [ERROR] Fabric Mod build failed! Please make sure JDK 21 is configured.
    pause
    exit /b %errorlevel%
)
cd ..

echo [2/3] Bundling compiled Mod into Launcher resources...
if not exist "NMCLauncherApp\bundled_mods" mkdir "NMCLauncherApp\bundled_mods"
copy /Y "NMCClientMod\build\libs\NMCClientMod-1.21.1-1.0.0.jar" "NMCLauncherApp\bundled_mods\"

echo [3/3] Installing Dependencies & Packaging NMCLUNCHER.exe...
cd NMCLauncherApp
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Packaging failed!
    pause
    exit /b %errorlevel%
)
cd ..

echo ========================================================
echo [SUCCESS] NMCLUNCHER.exe Created Successfully!
echo Path: NMCLauncherApp\dist\NMCLUNCHER Setup 1.3.0.exe
echo ========================================================
pause
