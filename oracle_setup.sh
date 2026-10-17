#!/usr/bin/env bash
# ============================================================
# Realty ONE Group Bolivia — Setup Oracle Cloud Always Free
# Instala Node.js, PM2, clona el repo y arranca el bot 24/7.
# Uso (como root en la VM Ubuntu):
#   curl -fsSL https://raw.githubusercontent.com/cuybi/realty_one_bolivia/main/oracle_setup.sh | bash
# ============================================================
set -e

APP_DIR="/opt/realty-one-bot"
REPO="https://github.com/cuybi/realty_one_bolivia.git"
NODE_MAJOR=20

echo "==> [1/6] Actualizando sistema e instalando dependencias"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git build-essential ca-certificates

echo "==> [2/6] Instalando Node.js ${NODE_MAJOR}.x"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt "$NODE_MAJOR" ]]; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -
  apt-get install -y nodejs
fi
node -v
npm -v

echo "==> [3/6] Instalando PM2 globalmente"
npm install -g pm2

echo "==> [4/6] Clonando/actualizando el proyecto en ${APP_DIR}"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git pull origin main
else
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> [5/6] Instalando dependencias del proyecto"
npm install --omit=dev

# Directorio de logs
mkdir -p /var/log/realty-one-bot

# Aviso si falta .env
if [ ! -f "$APP_DIR/.env" ]; then
  echo ""
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "  IMPORTANTE: No existe ${APP_DIR}/.env"
  echo "  Crea el archivo .env con tus variables antes de arrancar:"
  echo "    nano ${APP_DIR}/.env"
  echo "  Variables requeridas: PORT, ADMIN_KEY, QR_USER, QR_PASS,"
  echo "  GEMINI_API_KEY, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID,"
  echo "  WHATSAPP_VERIFY_TOKEN, MONGODB_URI"
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo ""
  exit 1
fi

echo "==> [6/6] Arrancando bot con PM2 (auto-restart 24/7)"
cd "$APP_DIR"
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

echo ""
echo "============================================================"
echo "  ✅ INSTALACIÓN COMPLETADA"
echo "============================================================"
echo "  Estado:    pm2 status"
echo "  Logs:      pm2 logs realty-one-bot"
echo "  Health:    curl http://localhost:3000/api/health"
echo "  Panel:     http://<TU_IP_PUBLICA>:3000/ingreso_leads.html?key=ONE2026"
echo "============================================================"
