@echo off
title Bebesup Survey Deployer
cls
echo ============================================================
echo   [Bebesup Survey] Web Deploy
echo ============================================================
echo.
echo Netlify Web Deploy started...
echo.

cd /d "D:\bebesup-survey\standalone-preview"
call npx --yes netlify deploy --prod --dir=.

echo.
echo ============================================================
echo   Deploy finished. Check your browser.
echo ============================================================
pause
