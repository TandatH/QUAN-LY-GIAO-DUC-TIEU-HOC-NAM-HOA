# Script tự động đẩy toàn bộ mã nguồn FMA Nam Hòa lên GitHub
Set-Location $PSScriptRoot

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "       ĐẨY TOÀN BỘ CODE FMA NAM HÒA LÊN GITHUB      " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[LỖI] Máy tính chưa cài đặt Git. Vui lòng tải tại: https://git-scm.com/" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "[1/5] Khởi tạo Git repository..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    git init
}
git branch -M main

Write-Host "[Cấu hình danh tính Git...]" -ForegroundColor Yellow
git config user.name "TandatH"
git config user.email "tandath@users.noreply.github.com"

Write-Host "[2/5] Kết nối kho GitHub TandatH/QUAN-LY-GIAO-DUC-TIEU-HOC-NAM-HOA..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/TandatH/QUAN-LY-GIAO-DUC-TIEU-HOC-NAM-HOA.git

Write-Host "[3/5] Gom tất cả file mới..." -ForegroundColor Yellow
git add .

Write-Host "[4/5] Tạo commit phiên bản v5.37.0..." -ForegroundColor Yellow
git commit -m "Cap nhat he thong FMA Nam Hoa v5.37.0: 11 Bieu mau BGH, Ke hoach day hoc, Khao sat 85 cot, Cloudflare SPA"

Write-Host "[5/5] Đang đẩy code lên GitHub nhánh main..." -ForegroundColor Yellow
Write-Host "Nếu có cửa sổ trình duyệt hiện ra, vui lòng chọn 'Sign in with your browser'." -ForegroundColor Cyan
git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "====================================================" -ForegroundColor Green
    Write-Host "  THÀNH CÔNG! ĐÃ ĐẨY CODE LÊN GITHUB THÀNH CÔNG!     " -ForegroundColor Green
    Write-Host "  Cloudflare sẽ tự động nhận diện và Deploy!        " -ForegroundColor Green
    Write-Host "====================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "====================================================" -ForegroundColor Red
    Write-Host "  [LỖI] Chưa đẩy được code lên GitHub.                " -ForegroundColor Red
    Write-Host "  Vui lòng kiểm tra đăng nhập hoặc kết nối mạng.      " -ForegroundColor Red
    Write-Host "====================================================" -ForegroundColor Red
}

Write-Host ""
Write-Host "Bấm phím bất kỳ để đóng..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
