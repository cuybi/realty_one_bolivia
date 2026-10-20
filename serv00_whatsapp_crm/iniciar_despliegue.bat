@echo off
title Desplegador Serv00 - Realty ONE Group Bolivia
color 0A
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -NoProfile -File "deploy_serv00.ps1"
pause
