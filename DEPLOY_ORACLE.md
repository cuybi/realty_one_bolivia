# 🦁 Realty ONE Group Bolivia — Bot 24/7 Gratis en Oracle Cloud

Guía para desplegar el bot de WhatsApp **gratis para siempre** en Oracle Cloud Always Free.

---

## Arquitectura

```
[WhatsApp] → [Oracle Cloud VM (Ubuntu, gratis 24/7)] → [MongoDB Atlas (sesión persistente)]
                     ↓
              Panel: http://<IP>:3000/ingreso_leads.html?key=ONE2026
```

- **Oracle Cloud Always Free**: VM ARM (Ampere A1) con 4 OCPU + 24 GB RAM — **gratis de por vida**, no se suspende como Render.
- **MongoDB Atlas (M0 gratis)**: guarda la sesión de WhatsApp, así que el bot no pierde la conexión tras reinicios.
- **PM2**: mantiene el bot vivo, se reinicia solo si se cae.

---

## Paso 1 — Crear cuenta en Oracle Cloud (~10 min)

1. Ve a [https://www.oracle.com/cloud/free/](https://www.oracle.com/cloud/free/).
2. Click **"Start for free"** / **"Empezar gratis"**.
3. Registra tu email, país (Bolivia), y datos.
4. **Tarjeta de crédito requerida** para verificar identidad — **NO se cobra** en el plan Always Free. Oracle solo hace una preautorización temporal.
5. Verifica tu email y completa el registro.
6. Entra al **Cloud Console**: [https://cloud.oracle.com/](https://cloud.oracle.com/)

> ⚠️ **Importante**: Oracle a veces suspende cuentas nuevas si no usan la tarjeta correctamente o si detectan actividad sospechosa. Usa tu nombre real y tarjeta propia.

---

## Paso 2 — Crear la VM Always Free (~10 min)

1. En el menú lateral: **☰ → Compute → Instances → Create Instance** (o busca "Compute").
2. Click **"Create"**.
3. Configura así:

| Campo | Valor |
|---|---|
| **Name** | `realty-one-bot` |
| **Image** | **Canonical Ubuntu** (22.04 o 24.04) |
| **Shape** | Cambiar a **Ampere A1** (ARM, Always Free) — click "Change shape" → "Ampere" → **VM.Standard.A1.Flex** → 4 OCPU, 24 GB RAM |
| **SSH keys** | Selecciona **"Generate a key pair"** → descarga la clave `.key` (guárdala, la necesitarás) |
| **Boot volume** | Déjalo en 47 GB (máx gratis) o menos |

4. Click **"Create"** y espera ~2 min a que la VM esté **Running**.
5. Anota la **IP pública** de la VM (aparece en la instancia).

---

## Paso 3 — Abrir el puerto 3000 (~2 min)

1. En la VM, ve a **"Subnet"** (click en el link de la instancia).
2. **"Security Lists"** → click en la default.
3. **"Add Ingress Rules"**:

| Campo | Valor |
|---|---|
| **Source CIDR** | `0.0.0.0/0` |
| **Destination Port** | `3000` |

4. **"Add Ingress Rules"** otra vez para puerto `22` (SSH) si no está.

---

## Paso 4 — Conectarte por SSH (~2 min)

### Desde Windows (PowerShell o CMD):
```powershell
# Usa la clave .key que descargaste
ssh -i "C:\ruta\a\tu_clave.key" ubuntu@<IP_PUBLICA>
```

### O desde la web de Oracle:
- En la instancia, click **"SSH connection"** → **"Cloud Shell"** (se abre terminal en el navegador).

---

## Paso 5 — Desplegar el bot (~5 min)

Una vez dentro de la VM (terminal SSH), pega este comando:

```bash
curl -fsSL https://raw.githubusercontent.com/cuybi/realty_one_bolivia/main/oracle_setup.sh | bash
```

Esto instala Node.js, PM2, clona el proyecto y prepara todo.

---

## Paso 6 — Subir tu archivo `.env` (~2 min)

El script te avisará que falta `.env`. Súbelo desde tu PC:

```powershell
# En tu PC (PowerShell), reemplaza <IP> con la IP de tu VM
scp -i "C:\ruta\a\tu_clave.key" "C:\Users\etechadmin\.gemini\antigravity-ide\scratch\realty_one_bolivia\.env" ubuntu@<IP>:/opt/realty-one-bot/.env
```

O edita directo en la VM:
```bash
nano /opt/realty-one-bot/.env
# Pega el contenido de tu .env local, guarda con Ctrl+O, Enter, Ctrl+X
```

**Variables requeridas en `.env`:**
```
PORT=3000
BAILEYS_PORT=3000
ADMIN_KEY=ONE2026
QR_USER=admin
QR_PASS=ONE2026
GEMINI_API_KEY=...
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_VERIFY_TOKEN=...
MONGODB_URI=...
```

---

## Paso 7 — Arrancar el bot (~2 min)

En la VM:
```bash
cd /opt/realty-one-bot
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root
```

Verifica:
```bash
pm2 status
curl http://localhost:3000/api/health
```

Deberías ver: `"connection":"conectado"` y `"numeroConectado":"59160937050"`.

> **Si pide QR**: abre `http://<IP>:3000/qr_connect.html?key=ONE2026` desde tu navegador, escanea el QR con tu WhatsApp, y la sesión quedará guardada en MongoDB Atlas (no se pierde).

---

## Paso 8 — Panel de Ingreso de Leads

Abre en tu navegador desde cualquier dispositivo:
```
http://<IP_PUBLICA>:3000/ingreso_leads.html?key=ONE2026
```

---

## Comandos útiles (en la VM)

| Comando | Qué hace |
|---|---|
| `pm2 status` | Ver estado del bot |
| `pm2 logs realty-one-bot` | Ver logs en tiempo real |
| `pm2 restart realty-one-bot` | Reiniciar el bot |
| `pm2 stop realty-one-bot` | Detener el bot |
| `pm2 monit` | Monitor de CPU/RAM |

---

## Preguntas frecuentes

**¿Cuánto cuesta?** — $0. Oracle Always Free no cobra mientras la VM sea A1 con ≤4 OCPU / 24 GB RAM. No uses shapes OCPU (AMD) ni más recursos.

**¿Se suspenderá como Render?** — No. Always Free no tiene límite de horas ni se suspende por inactividad.

**¿Qué pasa si reinicio la VM?** — PM2 arranca el bot automáticamente al boot. La sesión de WhatsApp se restaura desde MongoDB Atlas.

**¿Y si pierdo la sesión de WhatsApp?** — Vuelve a `qr_connect.html` y escanea el QR de nuevo. Con MongoDB Atlas configurado, esto rara vez pasa.

**¿Puedo usar el bot desde mi PC local también?** — Sí, pero **no los enciendas al mismo tiempo** (dos Baileys en el mismo número causan conflictos). Usa uno u otro.

---

## Solución de problemas

| Problema | Solución |
|---|---|
| `connection: desconectado` | Revisa `pm2 logs` — puede necesitar re-escanear QR |
| No carga el panel | Verifica que el puerto 3000 esté abierto en Security Lists |
| PM2 no arranca al boot | Ejecuta `pm2 startup systemd -u root --hp /root` de nuevo |
| VM lenta o suspendida | Verifica en Oracle Console que siga en plan Always Free (A1, ≤4 OCPU) |
