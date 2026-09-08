@echo off
title Chatbot WhatsApp Business - Realty ONE Group Bolivia
color 0A
cls
cd /d "%~dp0"
echo ========================================================
echo   🦁 REALTY ONE GROUP BOLIVIA - CONECTOR WHATSAPP BOT
echo ========================================================
echo.
echo Iniciando conector de WhatsApp con soporte para Facebook Ads...
echo.
node backend/whatsapp_baileys.js
pause
