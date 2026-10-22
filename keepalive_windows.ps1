# KeepAlive para Windows: asegura que el bot de WhatsApp este vivo.
# Lo invoca la tarea programada "RealtyOneBotWatchdog" cada 5 minutos.
# Si el bot no responde, lo reinicia. No toca nada mas.

$ErrorActionPreference = 'Continue'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Log = Join-Path $Root 'bot-keepalive.log'
$Health = 'http://127.0.0.1:3000/api/health'

function Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Add-Content -LiteralPath $Log -Value $line -Encoding UTF8
}

# 1) ¿Esta vivo?
$vivo = $false
try {
    $r = Invoke-WebRequest -Uri $Health -UseBasicParsing -TimeoutSec 8
    if ($r.StatusCode -eq 200) { $vivo = $true }
} catch { $vivo = $false }

if ($vivo) {
    Log 'Bot activo. Nada que hacer.'
    exit 0
}

Log 'Bot caido. Reiniciando...'

# 2) Limpiar instancias zombie (mismo numero,.session unica)
Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'server\.js' -and $_.CommandLine -notmatch 'src/server' } |
    ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        Log "Proceso anterior detenido (PID $($_.ProcessId))"
    }
Start-Sleep -Seconds 2

# 3) Arrancar el bot
$out = Join-Path $Root 'bot.out.log'
$err = Join-Path $Root 'bot.err.log'
$proc = Start-Process -FilePath 'node' -ArgumentList 'server.js' -WorkingDirectory $Root `
    -RedirectStandardOutput $out -RedirectStandardError $err -WindowStyle Hidden -PassThru
Log "Bot iniciado (PID $($proc.Id))."
