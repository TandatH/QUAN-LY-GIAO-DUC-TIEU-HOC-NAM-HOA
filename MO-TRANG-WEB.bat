@echo off
setlocal
title FMA Nam Hoa - May chu cuc bo
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo KHONG TIM THAY NODE.JS.
    echo Vui long cai Node.js hoac deploy thu muc bang Cloudflare Worker.
    echo.
    pause
    exit /b 1
)

echo Dang khoi dong FMA Nam Hoa...
echo Giu cua so nay mo trong luc su dung. Bam Ctrl+C de dung.
echo.
node local-server.mjs --open

if errorlevel 1 (
    echo.
    echo Khong khoi dong duoc may chu cuc bo.
    pause
)
