#!/bin/bash
# ========================================================
# Realty ONE Group Bolivia - KeepAlive Daemon (SiteGround)
# ========================================================
# Vigila server.js 24/7. Evita instancias duplicadas (anti-corrupción de sesión).

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR" || exit 1

PID_FILE="$DIR/bot.pid"
LOG_FILE="$DIR/bot.log"

# 1. Detectar binario de Node.js en SiteGround
NODE_BIN=""
if [ -x "/usr/local/bin/node" ]; then
    NODE_BIN="/usr/local/bin/node"
elif command -v node >/dev/null 2>&1; then
    NODE_BIN="$(command -v node)"
elif [ -d "$HOME/.nvm/versions/node" ]; then
    LATEST_NVM=$(ls -d "$HOME/.nvm/versions/node"/* 2>/dev/null | tail -n 1)
    if [ -x "$LATEST_NVM/bin/node" ]; then
        NODE_BIN="$LATEST_NVM/bin/node"
    fi
fi

if [ -z "$NODE_BIN" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ ERROR: Node.js no encontrado en SiteGround." >> "$LOG_FILE"
    exit 1
fi

# 2. Comprobar si ya existe proceso corriendo (por PID o pgrep)
IS_RUNNING=0

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE" 2>/dev/null)
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        IS_RUNNING=1
    fi
fi

if [ "$IS_RUNNING" -eq 0 ]; then
    FOUND_PID=$(ps aux 2>/dev/null | grep -E "node.*server\.js" | grep -v grep | awk '{print $2}' | head -n 1)
    if [ -z "$FOUND_PID" ]; then
        FOUND_PID=$(ps -ef 2>/dev/null | grep -E "node.*server\.js" | grep -v grep | awk '{print $2}' | head -n 1)
    fi
    if [ -n "$FOUND_PID" ]; then
        IS_RUNNING=1
        echo "$FOUND_PID" > "$PID_FILE"
    fi
fi

# 3. Si ya corre, salir inmediatamente (cero colisiones)
if [ "$IS_RUNNING" -eq 1 ]; then
    exit 0
fi

# 4. Si no corre, arrancar con nohup y registrar PID
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔄 Bot detenido. Iniciando daemon en segundo plano..." >> "$LOG_FILE"
nohup "$NODE_BIN" "$DIR/server.js" >> "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Bot iniciado exitosamente con PID $NEW_PID (Node: $NODE_BIN)" >> "$LOG_FILE"
