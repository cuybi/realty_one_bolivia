@echo off
title Empaquetador SiteGround - Realty ONE Group Bolivia
cls
echo ========================================================
echo   EMPAQUETANDO ARCHIVOS DE PRODUCCION PARA SITEGROUND
echo ========================================================
echo.
cd /d "%~dp0"
node crear_zip_siteground.js
echo.
echo ========================================================
echo   LISTO: Sube 'siteground_deploy.zip' a SiteGround
echo ========================================================
pause
