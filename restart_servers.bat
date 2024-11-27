@echo off
setlocal EnableDelayedExpansion

echo Starting StoonGame Development Environment...
echo.

REM Kill any existing Node processes
echo Stopping any existing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

REM Wait a moment for processes to fully terminate
timeout /t 2 >nul

REM Clean dist folder
if exist "client\public\dist" (
    echo Cleaning dist folder...
    rd /s /q "client\public\dist"
)

REM Install dependencies
echo Installing dependencies...
call npm install

REM Create server public directory
if not exist "server\public" mkdir "server\public"

REM Start backend server first
echo Starting backend server...
start "Backend Server (Port 3000)" cmd /k "npm run server"

REM Wait for backend to initialize
timeout /t 3 >nul

REM Start frontend server
echo Starting frontend server...
start "Frontend Server (Port 8080)" cmd /k "npm start"

echo.
echo ==============================================
echo Servers are starting up...
echo.
echo Frontend: http://localhost:8080
echo Backend: http://localhost:3000
echo.
echo To stop the servers, either:
echo 1. Close all command windows
echo 2. Run stop_servers.bat
echo ==============================================
echo.
echo Press any key to exit this window...

pause >nul
