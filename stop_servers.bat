@echo off
setlocal EnableDelayedExpansion

echo Stopping development servers...

REM Function to kill process on a port
:KillPort
set PORT=%1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":%PORT%" ^| find "LISTENING"') do (
    echo Found process on port %PORT%: %%a
    taskkill /F /PID %%a >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo Successfully terminated process on port %PORT%
    ) else (
        echo Failed to terminate process on port %PORT%
    )
)
goto :eof

REM Kill processes on required ports
call :KillPort 3000
call :KillPort 8080

echo.
echo All development servers have been stopped.
echo Press any key to exit...
pause >nul
