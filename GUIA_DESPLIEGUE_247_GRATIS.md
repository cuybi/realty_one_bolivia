# 🦁 Guía de Despliegue 24/7 Gratis — Realty ONE Group Bolivia

Esta guía te permite dejar el **Chatbot de WhatsApp**, el **Conector QR** y el **Panel de Leads** en línea **las 24 horas del día, los 7 días de la semana**, con **costo $0 real, sin tarjeta de crédito y con tu PC y celular apagados**.

---

## 📌 ¿Cómo funciona?

```
[Cliente en WhatsApp] 
         │
         ▼
[Servidores de Meta / WhatsApp]
         │ (WebSocket 24/7 Multi-Device)
         ▼
[Koyeb Cloud (Contenedor Docker Gratis)] ◄───► [MongoDB Atlas (Sesión guardada)]
         │
         ├──► Panel CRM:  https://tu-app.koyeb.app/ingreso_leads.html
         ├──► Conector QR: https://tu-app.koyeb.app/qr_connect.html
         └──► Login:       https://tu-app.koyeb.app/login.html
```

Una vez desplegado:
- **Tu PC puede estar apagada.**
- **Tu celular puede estar apagado o sin internet** (WhatsApp Multi-Device mantiene la conexión hasta por 14 días seguidos de forma autónoma).
- **El enlace NUNCA cambia** (no más túneles efímeros caídos).
- **Acceso seguro con Login**: Ya no depende de `?key=ONE2026`; tiene pantalla de inicio de sesión con usuario y contraseña.

---

## 🚀 Paso a Paso: Despliegue en Koyeb (Recomendado: 100% Gratis, Cero Tarjeta)

### Paso 1: Crear cuenta en Koyeb
1. Entra a [https://www.koyeb.com/](https://www.koyeb.com/).
2. Haz clic en **"Sign up"** y elige **"Continue with GitHub"** (inicia sesión con tu cuenta de GitHub `cuybi`).
3. Koyeb **NO te pedirá tarjeta de crédito**.

---

### Paso 2: Crear el Servicio Web
1. En el panel de Koyeb, haz clic en **"Create Service"** o **"Create App"**.
2. Selecciona **GitHub** como origen del despliegue.
3. Elige tu repositorio: `cuybi/realty_one_bolivia` (rama `main`).
4. En **Builder**, selecciona **Dockerfile** (Koyeb detectará automáticamente nuestro `Dockerfile` optimizado).
5. En **Instance Type**, selecciona **Eco / Free** ($0 / mes).

---

### Paso 3: Configurar Variables de Entorno
Baja a la sección **Environment variables** y haz clic en **Add variable**. Agrega las siguientes variables tal como están en tu archivo `.env`:

| Clave (Key) | Valor (Value) | ¿Para qué sirve? |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Modo de producción optimizado |
| `PORT` | `3000` | Puerto interno de escucha |
| `TZ` | `America/La_Paz` | Hora oficial de Bolivia (UTC-4) |
| `ADMIN_USER` | `admin` | Usuario de login |
| `ADMIN_PASS` | `ONE2026` | Contraseña de login para el panel |
| `ADMIN_KEY` | `ONE2026` | Clave maestra retrocompatible |
| `MONGODB_URI` | `mongodb+srv://pixelbolivia_db_user:p15RQRIGZSavT37H@cluster0.qvkco9y.mongodb.net/realty_one_bot?appName=Cluster0` | Guarda la sesión de WhatsApp 24/7 en la nube |
| `WHATSAPP_VERIFY_TOKEN` | `realty_one_whatsapp_verify_token_2026` | Token de seguridad Webhook |

---

### Paso 4: Puerto y Despliegue
1. En la sección **Ports / Routing**:
   - Puerto: `3000`
   - Protocolo: `HTTP`
   - Ruta: `/`
2. Haz clic en **"Deploy"** (abajo a la derecha).
3. Espera ~2 minutos mientras Koyeb compila el contenedor Docker. Cuando termine, el estado cambiará a **Healthy (Verde)**.

---

### Paso 5: Vincular WhatsApp por Única Vez
1. Koyeb te dará un dominio público permanente (por ejemplo: `https://realty-one-bot-cuybi.koyeb.app`).
2. Abre en tu navegador:
   `https://tu-app.koyeb.app/login.html`
3. Ingresa con:
   - **Usuario:** `admin`
   - **Contraseña:** `ONE2026`
4. Ve al Conector QR: `https://tu-app.koyeb.app/qr_connect.html`.
5. Abre WhatsApp en tu celular ➔ **Dispositivos vinculados** ➔ **Vincular un dispositivo** ➔ Escanea el código QR en pantalla.
6. **¡Listo!** Verás el mensaje verde: **"¡Bot Conectado! Respondiendo en tiempo real 24/7"**.

> [!TIP]
> Dado que la sesión se guarda en MongoDB Atlas en la nube, **si Koyeb se reinicia o se actualiza, la sesión NO se pierde**. No tendrás que volver a escanear el QR.

---

## 🔒 Acceso a tus Páginas en Producción

Tus enlaces permanentes serán:

1. **Pantalla de Login:**
   `https://tu-app.koyeb.app/login.html`
2. **Panel de Ingreso de Leads:**
   `https://tu-app.koyeb.app/ingreso_leads.html`
3. **Conector QR WhatsApp:**
   `https://tu-app.koyeb.app/qr_connect.html`
4. **Estado de Salud de la API:**
   `https://tu-app.koyeb.app/api/health`

---

## 💡 Alternativa B: Render.com + UptimeRobot (Si prefieres Render)

Si prefieres usar Render:
1. Entra a [render.com](https://render.com/) con tu cuenta de GitHub (tampoco pide tarjeta).
2. Haz clic en **New + ➔ Web Service** ➔ Elige `cuybi/realty_one_bolivia`.
3. Plan: **Free ($0)**.
4. Runtime: **Node**. Build: `npm install`. Start: `node server.js`.
5. Agrega las mismas variables de entorno del paso 3.
6. Clic en **Deploy Web Service**.
7. **Para que no se suspenda tras 15 minutos:**
   - Ve a [uptimerobot.com](https://uptimerobot.com/) (registro gratis sin tarjeta).
   - Crea un monitor tipo **HTTP(s)** con URL: `https://tu-app.onrender.com/api/health` cada 5 minutos.
   - Esto mantiene Render despierto 24/7 sin dormirse.
