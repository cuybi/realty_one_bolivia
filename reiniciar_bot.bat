@echo off
title Reiniciando Bot de WhatsApp - Realty ONE Group Bolivia
color 0B
cls
cd /d "%~dp0"
echo ========================================================
echo   🦁 REALTY ONE GROUP BOLIVIA - REINICIAR BOT WHATSAPP
echo ========================================================
echo.
echo Cerrando servidor previo de WhatsApp en puerto 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
timeout /t 1 >nul
echo.
echo Iniciando bot con las ultimas actualizaciones de Citas y Sincronizacion...
echo.
call iniciar_bot.bat
