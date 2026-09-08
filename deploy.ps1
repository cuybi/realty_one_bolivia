# =====================================================
# SCRIPT DE DESPLIEGUE - Realty ONE Group Bolivia Bot
# Ejecutar en PowerShell como Administrador
# =====================================================

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  REALTY ONE GROUP BOLIVIA - DEPLOY CHATBOT" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Set-Location $projectRoot

# ---- PASO 1: Verificar Node.js ----
Write-Host "[1/6] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  OK - Node.js $nodeVersion encontrado" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Node.js no esta instalado. Instala desde https://nodejs.org" -ForegroundColor Red
    exit 1
}

# ---- PASO 2: Verificar Git ----
Write-Host "[2/6] Verificando Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "  OK - $gitVersion encontrado" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Git no esta instalado. Instala desde https://git-scm.com" -ForegroundColor Red
    exit 1
}

# ---- PASO 3: Instalar dependencias ----
Write-Host "[3/6] Instalando dependencias npm..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK - Dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Fallo npm install" -ForegroundColor Red
    exit 1
}

# ---- PASO 4: Test local del bot ----
Write-Host "[4/6] Ejecutando prueba local del chatbot..." -ForegroundColor Yellow
Set-Location backend
node test_bot.js
Set-Location ..
Write-Host "  OK - Prueba completada" -ForegroundColor Green

# ---- PASO 5: Inicializar repositorio Git ----
Write-Host "[5/6] Configurando repositorio Git..." -ForegroundColor Yellow

if (-not (Test-Path ".git")) {
    git init
    Write-Host "  OK - Repositorio Git inicializado" -ForegroundColor Green
} else {
    Write-Host "  OK - Repositorio Git ya existe" -ForegroundColor Green
}

git add .
git status --short

$commitMsg = "feat: Chatbot WhatsApp ONEBot v1.0 - Realty ONE Group Bolivia"
git commit -m $commitMsg 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK - Commit creado: $commitMsg" -ForegroundColor Green
} else {
    Write-Host "  INFO: No hay cambios nuevos para commitear" -ForegroundColor Yellow
}

# ---- PASO 6: Instrucciones para GitHub y Render ----
Write-Host ""
Write-Host "[6/6] SIGUIENTES PASOS MANUALES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  A) Crea un repositorio NUEVO en GitHub:" -ForegroundColor White
Write-Host "     1. Ve a https://github.com/new" -ForegroundColor Gray
Write-Host "     2. Nombre: realty-one-bolivia" -ForegroundColor Gray
Write-Host "     3. Privado o Publico (recomendado: Privado)" -ForegroundColor Gray
Write-Host "     4. NO inicialices con README" -ForegroundColor Gray
Write-Host "     5. Copia la URL del repo (ej: https://github.com/TU_USUARIO/realty-one-bolivia.git)" -ForegroundColor Gray
Write-Host ""
Write-Host "  B) Conecta y sube tu codigo a GitHub:" -ForegroundColor White
Write-Host "     git remote add origin https://github.com/TU_USUARIO/realty-one-bolivia.git" -ForegroundColor Gray
Write-Host "     git branch -M main" -ForegroundColor Gray
Write-Host "     git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "  C) Despliega en Render.com:" -ForegroundColor White
Write-Host "     1. Ve a https://render.com y crea cuenta (gratis)" -ForegroundColor Gray
Write-Host "     2. New + > Web Service > Connect GitHub" -ForegroundColor Gray
Write-Host "     3. Selecciona tu repo 'realty-one-bolivia'" -ForegroundColor Gray
Write-Host "     4. Render detectara automaticamente el render.yaml" -ForegroundColor Gray
Write-Host "     5. Agrega las variables de entorno:" -ForegroundColor Gray
Write-Host "        WHATSAPP_TOKEN = [tu token de Meta]" -ForegroundColor Yellow
Write-Host "        WHATSAPP_PHONE_NUMBER_ID = 1293934853795426" -ForegroundColor Yellow
Write-Host "        WHATSAPP_VERIFY_TOKEN = realty_one_whatsapp_verify_token_2026" -ForegroundColor Yellow
Write-Host "     6. Click en 'Create Web Service'" -ForegroundColor Gray
Write-Host "     7. Espera ~3 minutos, obtendras una URL como:" -ForegroundColor Gray
Write-Host "        https://realty-one-bolivia.onrender.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "  D) Configura el Webhook en Meta:" -ForegroundColor White
Write-Host "     URL Webhook: https://realty-one-bolivia.onrender.com/api/whatsapp/webhook" -ForegroundColor Cyan
Write-Host "     Token: realty_one_whatsapp_verify_token_2026" -ForegroundColor Cyan
Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "  Listo para iniciar! Sigue los pasos A > B > C > D" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
