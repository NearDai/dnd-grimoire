@echo off
chcp 65001 >nul
title DND - Adventurer's Grimoire
cd /d "%~dp0"

echo ============================================
echo   ตำรานักผจญภัย (React + Vite)
echo   เปิดที่ http://localhost:5500/
echo   แก้ไฟล์ Excel แล้วบันทึก หน้าเว็บจะอัปเดตเอง
echo   ปิดหน้าต่างนี้ หรือกด Ctrl+C เพื่อหยุด
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ไม่พบ Node.js กรุณาติดตั้งก่อน: https://nodejs.org/
  goto :end
)

rem Python ใช้แปลงข้อมูลจาก Excel (ถ้าไม่มี เว็บจะใช้ข้อมูลที่แปลงไว้ล่าสุด)
where python >nul 2>nul
if not errorlevel 1 (
  python -c "import openpyxl" 2>nul || python -m pip install --quiet openpyxl
)

rem ติดตั้งแพ็กเกจครั้งแรก
if not exist node_modules (
  echo กำลังติดตั้งแพ็กเกจครั้งแรก...
  call npm install
)

call npm run dev

:end
pause
