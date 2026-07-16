@echo off
TITLE Photo Gallery Server
echo ===================================================
echo Starting Photo Gallery Server...
echo Please leave this window open while using the gallery!
echo ===================================================

:: Navigate to the directory where this script is located
cd /d "%~dp0"

:: Check if Node.js / npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is not installed on your computer!
    echo This application requires Node.js to run the local server.
    echo Please download and install it for free from: https://nodejs.org/
    echo.
    echo After installing, double-click this file again to start the gallery.
    echo.
    pause
    exit /b
)


:: Automatically pull the latest code from GitHub
echo Checking for updates...
git pull
echo.

:: Check if dependencies are installed, install if missing
IF NOT EXIST "node_modules\" (
    echo Installing required dependencies for the first time...
    npm install
    echo.
)

:: Start the server. If "node" isn't recognized, try the absolute path.
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    "%ProgramFiles%\nodejs\node.exe" server.js
) ELSE (
    node server.js
)

pause
