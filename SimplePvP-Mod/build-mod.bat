@echo off
setlocal enabledelayedexpansion
title Build SimplePvP Mod 1.21.1

echo =======================================================
echo          BUILDING SIMPLEPVP FABRIC MOD (1.21.1)
echo =======================================================

:: 1. ស្វែងរក Java 21
set "FOUND_JAVA="
if exist "%APPDATA%\.minecraft\jre\OpenJDK21U-jre_x64_windows_hotspot_21.0.3_9\bin\java.exe" (
    set "JAVA_HOME=%APPDATA%\.minecraft\jre\OpenJDK21U-jre_x64_windows_hotspot_21.0.3_9"
    set "FOUND_JAVA=1"
)

if not defined FOUND_JAVA (
    where java >nul 2>nul
    if %errorlevel% equ 0 (
        set "FOUND_JAVA=1"
    )
)

if defined JAVA_HOME (
    set "PATH=%JAVA_HOME%\bin;%PATH%"
    echo [OK] Using Java Home: %JAVA_HOME%
)

:: 2. ពិនិត្យ Gradle / Gradlew
if not exist "gradlew.bat" (
    echo [Info] Fetching Gradle Wrapper...
    call gradle wrapper 2>nul
)

echo [Info] Compiling Fabric Mod...
if exist "gradlew.bat" (
    call gradlew.bat build --no-daemon
) else (
    call gradle build
)

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed! Please make sure JDK 21 is installed.
    pause
    exit /b %errorlevel%
)

:: 3. ចម្លង File .jar ទៅកាន់ mods folder
set "MODS_DIR=%APPDATA%\.minecraft\mods"
if not exist "%MODS_DIR%" (
    mkdir "%MODS_DIR%"
)

if exist "build\libs\simplepvp-1.0.0.jar" (
    copy /Y "build\libs\simplepvp-1.0.0.jar" "%MODS_DIR%\"
    echo.
    echo =======================================================
    echo [SUCCESS] Mod built successfully!
    echo [Copied] simplepvp-1.0.0.jar to %MODS_DIR%
    echo =======================================================
) else (
    echo [Warning] .jar file not found in build/libs.
)

pause
