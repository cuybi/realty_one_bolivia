@echo off
title Lanzador Bot y Tunel Cloudflare - Realty ONE Group Bolivia
color 0A
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -NoProfile -File "iniciar_bot_con_tunel.ps1"
