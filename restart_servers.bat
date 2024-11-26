@echo off
echo Killing all Node.js processes...
taskkill /F /IM node.exe

echo Starting webpack build...
start cmd /k "cd /d %~dp0 && npm run build"

echo Starting development server...
start cmd /k "cd /d %~dp0 && npm run dev"

echo Servers restarted successfully!
