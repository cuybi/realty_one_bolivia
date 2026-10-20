# ==============================================================================
# Realty ONE Group Bolivia — Lanzador Unificado Bot + Tunel Cloudflare
# ==============================================================================

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   REALTY ONE GROUP BOLIVIA - BOT + TUNEL CLOUDFLARE    " -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $workspace

# 1. Limpieza de procesos previos
Write-Host "[1/4] Limpiando procesos previos en puerto 3000 y cloudflared..." -ForegroundColor White
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

$p3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($p3000) {
    foreach ($conn in $p3000) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 1

# 2. Iniciar Servidor Node.js (server.js)
Write-Host "[2/4] Iniciando Servidor Node.js (server.js)..." -ForegroundColor White
$nodeProcess = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $workspace -PassThru -WindowStyle Minimized

# Esperar que el puerto 3000 este activo
$serverReady = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    $check = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
    if ($check) {
        $serverReady = $true
        break
    }
}

if (-not $serverReady) {
    Write-Host "ERROR: El servidor node server.js no respondio en el puerto 3000." -ForegroundColor Red
    Pause
    exit 1
}
Write-Host "      Servidor Node.js activo en http://localhost:3000 (PID: $($nodeProcess.Id))" -ForegroundColor Green

# 3. Iniciar Cloudflare Tunnel
Write-Host "[3/4] Creando tunel Cloudflare seguro..." -ForegroundColor White
$logFile = Join-Path $workspace "tunnel.log"
if (Test-Path $logFile) { Remove-Item $logFile -Force }

$cloudflaredPath = Join-Path $workspace "cloudflared.exe"
if (-not (Test-Path $cloudflaredPath)) {
    Write-Host "ERROR: No se encontro cloudflared.exe en $workspace" -ForegroundColor Red
    Pause
    exit 1
}

$tunnelProcess = Start-Process -FilePath $cloudflaredPath -ArgumentList "tunnel --protocol http2 --url http://localhost:3000" -RedirectStandardError $logFile -PassThru -WindowStyle Hidden

# 4. Obtener URL publica de trycloudflare.com
Write-Host "[4/4] Obteniendo enlace publico de Cloudflare..." -ForegroundColor White
$tunnelUrl = $null

for ($i = 0; $i -lt 25; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $logFile) {
        $content = Get-Content $logFile -ErrorAction SilentlyContinue | Out-String
        if ($content -match "https://[a-zA-Z0-9\-]+\.trycloudflare\.com") {
            $tunnelUrl = $matches[0]
            break
        }
    }
}

if ($tunnelUrl) {
    $leadsUrl = "$tunnelUrl/ingreso_leads.html?key=ONE2026"
    $qrUrl = "$tunnelUrl/qr_connect.html?key=ONE2026"

    $tunnelInfo = @"
========================================================
   REALTY ONE GROUP BOLIVIA - ENLACES EN VIVO ACTIVOS
========================================================

ENLACE PUBLICO GLOBAL:
$tunnelUrl

PANEL INGRESO LEADS:
$leadsUrl

CONECTOR QR WHATSAPP:
$qrUrl

========================================================
"@
    Set-Content -Path (Join-Path $workspace "TUNNEL_ACTUAL.txt") -Value $tunnelInfo -Encoding UTF8

    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "   SISTEMA EN LINEA Y OPERATIVO AL 100%               " -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Leads Panel: $leadsUrl" -ForegroundColor Yellow
    Write-Host "  QR Conector: $qrUrl" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Abriendo en tu navegador..." -ForegroundColor Cyan

    Start-Process $leadsUrl
    Start-Process $qrUrl
} else {
    Write-Host "No se pudo capturar la URL publica automaticamente. Revisa tunnel.log" -ForegroundColor Yellow
    Write-Host "Acceso local disponible en: http://localhost:3000/ingreso_leads.html?key=ONE2026" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "El bot y el tunel continuan ejecutandose en segundo plano." -ForegroundColor Green
Write-Host "Para detenerlos, cierra esta ventana o ejecuta reiniciar_bot.bat." -ForegroundColor Gray
Write-Host ""
if ([Environment]::UserInteractive -and -not [Console]::IsInputRedirected) {
    Write-Host "Presiona cualquier tecla para salir de esta consola (los servicios seguiran activos)..."
    try { $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") } catch {}
}
