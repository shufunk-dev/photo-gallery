@echo off
TITLE Photo Gallery Server
echo ===================================================
echo Starting Photo Gallery Server...
echo Please leave this window open while using the gallery!
echo ===================================================

:: Navigate to the directory where this script is located
cd /d "%~dp0"

:: Start the server. If "node" isn't recognized, try the absolute path.
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    "%ProgramFiles%\nodejs\node.exe" server.js
) ELSE (
    node server.js
)

pause
