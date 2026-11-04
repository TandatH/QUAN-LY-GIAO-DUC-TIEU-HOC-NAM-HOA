@echo off
setlocal
title DAY CODE FMA NAM HOA LEN GITHUB

cd /d "%~dp0"

echo ====================================================
echo       DAY TOAN BO CODE FMA NAM HOA LEN GITHUB
echo ====================================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] May tinh cua ban chua cai dat Git.
    echo Vui long cai dat Git tu: https://git-scm.com/
    pause
    exit /b 1
)

echo [1/5] Khoi tao thu vien Git...
if not exist ".git" (
    git init
)
git branch -M main

echo [Cau hinh danh tinh Git...]
git config user.name "TandatH"
git config user.email "tandath@users.noreply.github.com"

echo [2/5] Ket noi voi kho GitHub...
git remote remove origin >nul 2>nul
git remote add origin https://github.com/TandatH/QUAN-LY-GIAO-DUC-TIEU-HOC-NAM-HOA.git

echo [3/5] Thu thap toan bo file ma nguon moi nhat...
git add .

echo [4/5] Tao ban ghi Commit v5.37.0...
git commit -m "Cap nhat he thong FMA Nam Hoa v5.37.0: 11 Bieu mau BGH, Ke hoach day hoc, Khao sat 85 cot, Cloudflare SPA"

echo [5/5] Dang day toan bo ma nguon len nhanh main cua GitHub...
echo Chu y: Neu trinh duyet hoi dang nhap GitHub, hay bam 'Sign in with browser'.
echo.
git push -u origin main --force

if %errorlevel% neq 0 (
    echo.
    echo ====================================================
    echo [LOI] Chua day duoc code len GitHub!
    echo Nguyen nhan thuong gap:
    echo 1. Ban chua dang nhap GitHub tren trinh duyet.
    echo 2. Mat ket noi mang Internet.
    echo 3. Chua du quyen ghi vao kho TandatH/QUAN-LY-GIAO-DUC-TIEU-HOC-NAM-HOA.
    echo ====================================================
) else (
    echo.
    echo ====================================================
    echo   THANH CONG! TOAN BO CODE DA DUOC DAY LEN GITHUB!
    echo   Cloudflare se tu dong build va deploy len web.
    echo ====================================================
)

echo.
pause
