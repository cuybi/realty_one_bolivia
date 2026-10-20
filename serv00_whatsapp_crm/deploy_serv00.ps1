<#
.SYNOPSIS
    Despliegue automatizado en 1-clic a Serv00.com para Realty ONE Group
.DESCRIPTION
    Conecta por SSH a Serv00, activa binexec, sube los archivos, instala dependencias,
    ejecuta el script SQL en MySQL y arranca el bot para escanear el QR.
#>

param(
    [string]$ServidorServ00,
    [string]$UsuarioServ00,
    [string]$PasswordServ00,
    [string]$DbUser,
    [string]$DbPass,
    [string]$DbHost,
    [string]$DbName,
    [string]$SalesPhone = "59160937050"
)

Clear-Host
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   REALTY ONE GROUP - DESPLEGADOR AUTOMÁTICO SERV00     " -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Solicitar datos si no fueron pasados por parámetro
if (-not $ServidorServ00) {
    $ServidorServ00 = Read-Host "Ingresa tu servidor Serv00 (ej: s1.serv00.com, s2.serv00.com)"
}
if (-not $UsuarioServ00) {
    $UsuarioServ00 = Read-Host "Ingresa tu usuario de Serv00"
}
if (-not $PasswordServ00) {
    $secPass = Read-Host "Ingresa tu contraseña de Serv00" -AsSecureString
    $PasswordServ00 = [System.Net.NetworkCredential]::new("", $secPass).Password
}

# Base de datos
if (-not $DbHost) { $DbHost = "mysql1.serv00.com" }
if (-not $DbUser) { $DbUser = $UsuarioServ00 }
if (-not $DbPass) { $DbPass = $PasswordServ00 }
if (-not $DbName) { $DbName = "${UsuarioServ00}_crm" }

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 2. Generar .env adaptado
$envContent = @"
DB_HOST=$DbHost
DB_USER=$DbUser
DB_PASS=$DbPass
DB_NAME=$DbName
DB_PORT=3306
SALES_PHONE=$SalesPhone
TRIGGER_MESSAGE=Hola, vi tu anuncio de Facebook
"@
Set-Content -Path (Join-Path $scriptDir ".env") -Value $envContent -Encoding UTF8

Write-Host "`n[1/5] Conectando a Serv00 y habilitando procesos en segundo plano (binexec)..." -ForegroundColor White
# Probar conexión SSH y habilitar binexec
$sshCmd = "devil binexec on && mkdir -p ~/whatsapp-crm"

# Ejecutar mediante SSH de Windows
Write-Host "Ejecutando comando en Serv00..." -ForegroundColor Gray
& ssh -o StrictHostKeyChecking=no "${UsuarioServ00}@${ServidorServ00}" "$sshCmd"

Write-Host "`n[2/5] Subiendo archivos del bot vía SCP..." -ForegroundColor White
$filesToUpload = @("index.js", "db_adapter.js", "package.json", "ecosystem.config.js", ".env", "schema.sql")
foreach ($f in $filesToUpload) {
    $localFile = Join-Path $scriptDir $f
    if (Test-Path $localFile) {
        Write-Host "   -> Subiendo $f..." -ForegroundColor Gray
        & scp -o StrictHostKeyChecking=no "$localFile" "${UsuarioServ00}@${ServidorServ00}:~/whatsapp-crm/"
    }
}

Write-Host "`n[3/5] Ejecutando script de Base de Datos MySQL en Serv00..." -ForegroundColor White
$mysqlRemoteCmd = "cd ~/whatsapp-crm && mysql -h $DbHost -u $DbUser -p'$DbPass' $DbName < schema.sql"
& ssh -o StrictHostKeyChecking=no "${UsuarioServ00}@${ServidorServ00}" "$mysqlRemoteCmd"

Write-Host "`n[4/5] Instalando dependencias de Node.js en Serv00 (npm install)..." -ForegroundColor White
$npmCmd = "cd ~/whatsapp-crm && npm install --omit=dev"
& ssh -o StrictHostKeyChecking=no "${UsuarioServ00}@${ServidorServ00}" "$npmCmd"

Write-Host "`n[5/5] ¡Todo listo! Iniciando el bot para que vincules tu WhatsApp..." -ForegroundColor Green
Write-Host "Se abrirá la consola para que escanees el código QR con tu celular.`n" -ForegroundColor Yellow

& ssh -t -o StrictHostKeyChecking=no "${UsuarioServ00}@${ServidorServ00}" "cd ~/whatsapp-crm && node index.js"
