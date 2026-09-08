@echo off
title Conectar Nuevo Numero WhatsApp - Realty ONE Group Bolivia
color 0E
cls
cd /d "%~dp0"
echo ========================================================
echo   🦁 VINCULAR NUEVO NUMERO DE WHATSAPP (BOT REALTY ONE)
echo ========================================================
echo.
echo [1/3] Limpiando sesion anterior guardada...
if exist "backend\baileys_auth" (
    rmdir /s /q "backend\baileys_auth"
    echo      Sesion anterior eliminada con exito.
)
echo.
echo [2/3] Verificando dependencias...
call npm install --prefix backend @whiskeysockets/baileys pino qrcode
echo.
echo [3/3] Iniciando servidor y generando nuevo Codigo QR...
echo.
echo ========================================================
echo   Abre en tu navegador: http://localhost:3000/qr_connect.html
echo   O escanea el codigo QR que aparecera aqui abajo
echo   con tu WhatsApp en: Ajustes -> Dispositivos vinculados
echo ========================================================
echo.
node backend/whatsapp_baileys.js
pause
