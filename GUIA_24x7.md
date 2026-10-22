# Bot de WhatsApp 24/7 — sin PC, sin tarjeta y sin cobros

**Objetivo:** que el bot atienda WhatsApp las 24 horas con el celular y la PC apagados,
sin depender de ninguna tarjeta ni de que nadie pague nada.

---

## 1. Arquitectura objetivo

```
Lead escribe al +591 60937050
        │
        ▼
  WhatsApp (Baileys: sesión multi-dispositivo, sesión en MongoDB Atlas M0)
        │
        ▼
  Node server.js  ← corre en RENDER FREE (750 h/mes, no cobra nada, no duerme con el pinger)
        ▲
        │  ping cada 10 min
        │
  GitHub Actions (gratis, sin tarjeta)   ← impide que Render apague el servicio
```

- **Render Free**: 750 horas de cómputo al mes (alcanza para 24/7). **Nunca cobra**: solo
  cobra si alguien pulsa *Upgrade*. No pide tarjeta para el plan free.
- **MongoDB Atlas M0**: guarda la sesión de WhatsApp → el bot reconecta solo tras reinicios
  y no pierde el número vinculado. Gratis, sin tarjeta.
- **Gemini (Google AI Studio)**: capa de respuesta, free tier sin tarjeta.
- **GitHub Actions**: ping gratuito al servicio (unalated repo privado: 864 jobs/mes ≈ 864 min
  de los 2000 min/mes gratis).

**Costo recurrente: 0.** Lo único que puede cobrar algo es que alguien entre al panel de
Render y pulse *Upgrade*. No lo hagas.

---

## 1.5 Opción "ya" — el bot corriendo en esta PC, con autoinicio y autorreparación

Mientras la nube no esté lista, el bot puede vivir en esta PC de forma estable con dos
tareas programadas de Windows (ya creadas en esta máquina):

| Tarea | Qué hace | Cuándo corre |
| --- | --- | --- |
| `RealtyOneBot` | Arranca el bot (`keepalive_windows.ps1`) | Al iniciar sesión en Windows |
| `RealtyOneBotWatchdog` | Comprueba `/api/health`; si el bot no responde, lo reinicia | Cada 5 minutos |

```
# Ver el estado
Get-ScheduledTask -TaskName RealtyOneBot,RealtyOneBotWatchdog
Start-ScheduledTask -TaskName RealtyOneBotWatchdog   # forzar revision
Get-Content bot-keepalive.log -Tail 20              # bitacora
```

Requisitos: la PC encendida y con internet (el bot usa la sesión de WhatsApp Web por
Baileys). Si la nube (Render / Space) queda activa, el **candado de instancia** hace
que solo una de las dos conecte y la otra quede en espera: no se pelean, y hay
failover automatico entre ambas.



| Pieza | Archivo | Qué hace |
|---|---|---|
| Candado de instancia única | `services/instanceLease.js` + `server.js` | WhatsApp solo admite una sesión multi-dispositivo por número. Con la PC y la nube conectadas a la vez, una expulsa a la otra (`440 conflict / "replaced"`) y **el bot deja de responder**. El lease (TTL 90 s + heartbeat) hace que solo una instancia conecte; la otra espera 30 s y reintenta. **Failover automático**: si apagas la PC, la nube toma el relevo en ≤ 90 s. Si enciendes la PC, la nube se aparta sola. |
| Pinger 24/7 | `.github/workflows/keepalive-render.yml` | Ping cada 10 min a `/api/health`. Sin él, Render duerme el servicio a los 15 min y el bot tarda ~1 min en volver. |
| Servicio | `render.yaml` | Nombre de servicio alineado con el que usa el sitio (`realty-one-bolivia`), `autoDeploy: true`, secretos declarados (`MONGODB_URI`, `GEMINI_API_KEY`). |

Estado local: el bot está **corriendo y conectado** en esta máquina (instancia con el candado).

---

## 1.6 Aviso al asesor por Telegram (paso 6 del flujo Facebook → WhatsApp → CRM)

El bot ya guarda el lead en el CRM (SiteGround) y lo asigna a un e-Realtor, pero
el aviso al equipo se activa con Telegram: en cuanto se capta un lead (o queda
listo para trabajar), el grupo recibe nombre, teléfono, correo, interés y el
enlace al panel.

**Configuración (una sola vez, gratis y sin tarjeta):**
1. En Telegram abre **@BotFather** → `/newbot` → ponle nombre (ej. *ONE Bot Realty*) → te da un **token** (`123456789:AAE...`).
2. Crea un grupo (o canal) para el equipo y **añade al bot** al grupo.
3. Escríbele algo al grupo y pide el **chat id**: abre `https://api.telegram.org/bot<TOKEN>/getUpdates` en el navegador y busca `"chat":{"id":-1001234567890}` (los grupos empiezan por `-100`).
4. Pega ambos valores en `.env` (las claves ya están preparadas):
   ```
   TELEGRAM_BOT_TOKEN=123456789:AAE...
   TELEGRAM_CHAT_ID=-1001234567890
   CRM_PANEL_URL=https://realyonegroupbolivia.e-techgroupbolivia.com/ingreso_leads.html?key=ONE2026
   ```
5. Reinicia el bot (tarea `RealtyOneBotWatchdog`) y listo.

Si faltan las dos variables el bot **no avisa** pero sigue funcionando normal
(nunca se cae por una alerta). Comprobación: `node backend/test_telegram_alert.js` (5/5) y en el log `[Telegram] Lead avisado al equipo`.

---

## 3. Qué tienes que hacer en Render (3 pasos, una sola vez)

1. Entra en <https://dashboard.render.com> → servicio **realty-one-bolivia**.
2. **Environment** → confirma que existen estas variables (si falta alguna, el bot arranca
   sin sesión de WhatsApp o sin cerebro de IA):

   | Variable | Origen | ¿Para qué? |
   |---|---|---|
   | `MONGODB_URI` | el valor de tu `.env` local | **Sesión de WhatsApp** (sin esto, el número se desvincula) |
   | `GEMINI_API_KEY` | tu clave de Google AI Studio | Respuestas del bot |
   | `ADMIN_KEY` | `ONE2026` | Acceso al panel |
   | `QR_USER` / `QR_PASS` | `admin` / `ONE2026` | Acceso al panel |
   | `RENDER_EXTERNAL_URL` | `https://realty-one-bolivia.onrender.com` | URLs públicas |
   | `TZ` | `America/La_Paz` | Horarios de saludo |
   | `PORT` | `10000` | Puerto interno de Render |

3. **Manual Deploy → Deploy latest commit** (ya subí el commit `dce505c`; si tu servicio
   tiene auto-deploy activo, se solo).

> El servicio está devolviendo **503** en todas sus rutas: es un deploy roto o suspendido.
> Con las variables de arriba y un redeploy, debería volver. Si al revisar el log de build
> falla, pásame el error y lo arreglo.

---

## 4. Cómo comprobar que está 24/7

```powershell
# Estado real del bot (conexión, número, último mensaje recibido y enviado)
Invoke-WebRequest https://realty-one-bolivia.onrender.com/api/health -UseBasicParsing | Select-Object -Expand Content
```

- `connection: "conectado"` → la sesión de WhatsApp está viva.
- `lastInbound` / `lastOutbound` → prueba de que entró un mensaje y que se respondió.
- Si `connection` no es `conectado`, mira el **Log** del servicio en Render.

En el panel del sitio (`realyonegroupbolivia.e-techgroupbolivia.com/qr_connect.html`) el estado
sale de un `qr_status.json`; ese archivo lo sube el despliegue, no se refresca solo. Para el
estado en vivo, usa el `/api/health` de arriba.

---

## 5. Reglas de operación

| Regla | Por qué |
|---|---|
| **Nunca pulses *Upgrade* / plan de pago en Render, MongoDB Atlas ni Google AI Studio** | Es lo único que puede generar un cobro. Todos los planes que usamos son `free`. |
| **Solo una instancia activa** | El candado lo garantiza, pero si forcezas dos a la vez vuelve el `440 conflict`. |
| **Si pruebas en local, apaga antes de levantar la nube** (o al revés) | Evita que peleen por la sesión. |
| El bot **ignora los mensajes del propio +591 60937050** (`fromMe`) y los grupos | Prueba siempre desde otro número. |
| La URL de `trycloudflare` cambia en cada arranque | Si usas la PC como respaldo, actualiza `TUNNEL_ACTUAL.txt` y la URL del panel. |

---

## 6. Riesgos conocidos (honestamente)

1. **Render free se duerme**: con el pinger cada 10 min no debería, pero si GitHub Actions
   falla o se suspende la cuenta, el bot se va y tarda ~1 min en volver. El lease de Mongo
   hace que la PC lo recoja si está encendida.
2. **Baileys es la API no oficial de WhatsApp**: es gratis, pero WhatsApp puede bloquear un
   número si detecta volumen anómalo o spam. Con un bot de calificación de leads y volumen
   bajo, el riesgo es bajo, pero no es cero. La API oficial evita ese riesgo a cambio de
   cobro por conversación (que hoy no puedes pagar).
3. **750 h/mes** de Render: 24/7 son ~720 h → queda margen estrecho. Si el mes tiene 31 días
   son 744 h. Justo, pero entra.
4. El número queda vinculado como dispositivo. Si alguien desvincula el dispositivo en
   WhatsApp, hay que escanear QR otra vez (la web lo permite).

---

## 7. Alternativa sin depender de Render (oficina)

Si Render no se estabiliza: un PC fijo en la oficina con el bot + **Cloudflare Tunnel con
subdominio propio** (gratis, sin tarjeta) da una URL **estable** (no cambia en cada
arranque) y el sitio apunta a ella. El costo también es 0.
