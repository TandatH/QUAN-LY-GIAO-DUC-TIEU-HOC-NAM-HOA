@echo off
setlocal
title TRIEN KHAI TRUC TIEP LEN CLOUDFLARE WORKERS

cd /d "%~dp0"

echo ====================================================
echo    TRIEN KHAI FMA NAM HOA TRUC TIEP LEN CLOUDFLARE
echo ====================================================
echo.

echo [1/2] Kiem tra Node.js va moi truong...
where npx >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] May tinh cua ban chua co Node.js hoac npx.
    echo Vui long kiem tra lai Node.js.
    pause
    exit /b 1
)

echo [2/2] Dang tai toan bo ma nguon va static assets len Cloudflare...
echo Chu y: Neu trinh duyet bat len hoi dang nhap Cloudflare, ban hay bam 'Allow' (Cho phep).
echo.
call npx wrangler deploy

if %errorlevel% neq 0 (
    echo.
    echo ====================================================
    echo [LOI] Trien khai chua thanh cong!
    echo Vui long kiem tra lai ket noi hoac quyen tai khoan Cloudflare.
    echo ====================================================
) else (
    echo.
    echo ====================================================
    echo   THANH CONG! TOAN BO HE THONG DA DUOC DEPLOY LEN CLOUDFLARE!
    echo   Ban co the vao tab Deployments de xem trang thai Ready.
    echo ====================================================
)

echo.
pause
