# 🦁 Guía Definitiva de Despliegue 24/7 en Serv00.com
### Bot de WhatsApp Baileys + Mini-CRM MySQL (Sin Docker, Ultra-Ligero)

Esta guía explica paso a paso cómo desplegar y dejar corriendo **24/7 de forma permanente** el bot de WhatsApp y el CRM en la capa gratuita de **Serv00.com**, sorteando todas las particularidades del sistema operativo FreeBSD y sus límites de memoria.

---

## 📌 Requisitos Previos en Serv00
- Cuenta activa en [Serv00.com](https://www.serv00.com/).
- Cliente SSH instalado en tu PC (PowerShell, CMD, PuTTY o Termius).
- Datos de tu panel Serv00 (Usuario, Contraseña y Servidor, ej: `s1.serv00.com`).

---

## 🚀 PASO 1: Habilitar Procesos en Segundo Plano (CRÍTICO)

Por defecto, Serv00 **mata cualquier proceso** tan pronto cierras la sesión SSH si no tienes activada la opción de ejecutar tus propios ejecutables (*binexec*).

1. Abre tu terminal en tu PC y conéctate por SSH a Serv00:
   ```bash
   ssh tu_usuario@sX.serv00.com
   ```
2. Ejecuta el siguiente comando para habilitar procesos en segundo plano:
   ```bash
   devil binexec on
   ```
   *(Verás el mensaje: `Binary execution has been enabled`)*.

---

## 🗄️ PASO 2: Crear la Base de Datos MySQL en Serv00

1. Entra a tu panel web de Serv00 (**DevilWeb**): `https://panelX.serv00.com/`.
2. En el menú lateral ve a **MySQL**:
   - Haz clic en **Add database**.
   - Nombre de la base de datos: ej. `crm` (se creará con prefijo: `tuusuario_crm`).
   - Contraseña: Asigna una contraseña segura para tu base de datos.
3. Haz clic en **phpMyAdmin** desde el mismo panel de Serv00 o entra mediante la terminal:
   ```bash
   mysql -h mysqlX.serv00.com -u tuusuario_crm -p tuusuario_crm
   ```
4. En phpMyAdmin (o en la consola MySQL), entra a la base de datos creada, ve a la pestaña **SQL**, pega y ejecuta el archivo `schema.sql`:
   ```sql
   CREATE TABLE IF NOT EXISTS `leads` (
       `id` INT AUTO_INCREMENT PRIMARY KEY,
       `nombre` VARCHAR(150) NOT NULL,
       `telefono` VARCHAR(30) NOT NULL,
       `correo` VARCHAR(150) NOT NULL,
       `servicio` VARCHAR(255) NOT NULL,
       `origen` VARCHAR(50) DEFAULT 'Facebook Ads',
       `estado` ENUM('NUEVO', 'CONTACTADO', 'EN_NEGOCIACION', 'CERRADO', 'DESCARTADO') DEFAULT 'NUEVO',
       `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       INDEX `idx_telefono` (`telefono`),
       INDEX `idx_fecha` (`fecha_creacion`),
       INDEX `idx_estado` (`estado`)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
   ```

---

## 📦 PASO 3: Subir los Archivos del Proyecto a Serv00

En tu terminal SSH de Serv00:

1. Crea la carpeta de tu bot dentro de tu directorio home:
   ```bash
   mkdir -p ~/whatsapp-crm
   cd ~/whatsapp-crm
   ```
2. Puedes subir los archivos desde tu computadora usando **SCP / SFTP** (con FileZilla o WinSCP) conectándote al puerto `22` con tus credenciales de Serv00, apuntando a `/home/tu_usuario/whatsapp-crm/`.

Los archivos requeridos en la carpeta son:
- `index.js`
- `package.json`
- `ecosystem.config.js`
- `.env`

---

## ⚙️ PASO 4: Configurar el Archivo `.env`

Crea o edita tu archivo `.env` dentro de `~/whatsapp-crm`:
```bash
nano .env
```

Pega tus credenciales de Serv00:
```ini
DB_HOST=mysqlX.serv00.com
DB_USER=tuusuario_crm
DB_PASS=tu_password_mysql
DB_NAME=tuusuario_crm
DB_PORT=3306

# Número de WhatsApp que recibirá la alerta cuando entre un prospecto
SALES_PHONE=59160937050

# Mensaje exacto de tus anuncios de Facebook
TRIGGER_MESSAGE=Hola, vi tu anuncio de Facebook
```
*(Guarda con `Ctrl + O`, presiona `Enter` y sal con `Ctrl + X`)*.

---

## 📥 PASO 5: Verificar Node.js e Instalar Dependencias

1. Serv00 tiene Node.js disponible en `/usr/local/bin/node`. Verifica la versión:
   ```bash
   node -v
   npm -v
   ```
   *(Si necesitas Node 20 o 22, Serv00 suele tener `node20` o `node22` disponibles en el sistema)*.
2. Instala las dependencias del proyecto:
   ```bash
   npm install --omit=dev
   ```

---

## 📲 PASO 6: Primera Ejecución y Escaneo del Código QR

Para vincular WhatsApp por primera vez, ejecutamos el script directamente en la consola interactiva:

```bash
node index.js
```

1. Verás que en unos segundos la consola SSH dibuja un **código QR en caracteres ASCII**.
2. Abre WhatsApp en tu celular:
   - Ve a **Dispositivos vinculados** > **Vincular un dispositivo**.
   - Apunta la cámara de tu celular al código QR de la pantalla de tu terminal.
3. En la consola verás:
   ```text
   ✅ ¡WHATSAPP CONECTADO EXITOSAMENTE!
   📱 Número de línea: +591...
   🚀 Listo para recibir prospectos de Facebook Ads.
   ```
4. La sesión se guardará automáticamente en la carpeta local `auth_info_baileys`.
5. Presiona `Ctrl + C` para detener el proceso interactivo. **No te preocupes: como la sesión ya quedó guardada en el disco, ya nunca más te volverá a pedir escanear el QR**.

---

## 🔄 PASO 7: Dejar Corriendo 24/7 con PM2

1. Si no tienes PM2 instalado en tu usuario, instálalo globalmente en tu home:
   ```bash
   npm install -g pm2
   ```
   *(Asegúrate de que `~/.npm-global/bin` o el path de npm esté en tu PATH)*. Si prefieres no instalar PM2 global, puedes usar `npx pm2`:
2. Inicia el bot con la configuración optimizada para Serv00:
   ```bash
   npx pm2 start ecosystem.config.js
   ```
3. Verifica que el bot esté en estado `online`:
   ```bash
   npx pm2 list
   ```
4. Para ver los logs en vivo:
   ```bash
   npx pm2 logs whatsapp-crm-bot
   ```

---

## 🛡️ PASO 8: Supervivencia ante Reinicios del Servidor (Cron `@reboot`)

Serv00 reinicia periódicamente sus nodos para mantenimiento. Para que tu bot arranque automáticamente sin que tengas que entrar a iniciar sesión:

1. Abre el editor de tareas cron de Serv00:
   ```bash
   crontab -e
   ```
2. Agrega la siguiente línea al final del archivo:
   ```cron
   @reboot cd /home/tu_usuario/whatsapp-crm && /usr/local/bin/node index.js >> /home/tu_usuario/whatsapp-crm/bot.log 2>&1 &
   ```
   *(O si usas PM2: `@reboot cd /home/tu_usuario/whatsapp-crm && npx pm2 resurrect`)*.
3. Guarda y sal.

---

## 🧪 PASO 9: Prueba del Flujo Completo

1. Envía desde otro celular al número del bot el mensaje:
   > `"Hola, vi tu anuncio de Facebook"`
2. El bot responderá de inmediato:
   > *"¡Hola! 👋 Muchas gracias por tu interés en nuestro anuncio de Facebook... ¿Cuál es tu nombre y apellido?"*
3. Responde tu nombre:
   > *"Juan Pérez"*
4. El bot te pedirá tu correo:
   > *"juan@gmail.com"*
5. El bot te preguntará el servicio de interés:
   > *"Me interesa comprar un lote en Mar Adentro"*
6. El bot confirmará:
   > *"¡Perfecto, Juan Pérez! 🎉 Hemos registrado tus datos con éxito..."*
7. **Verificación doble:**
   - En MySQL: Se habrá creado un nuevo registro en la tabla `leads` con ID, Nombre, Teléfono, Correo, Servicio y Fecha.
   - En el WhatsApp de Ventas (`SALES_PHONE`): Llegará la alerta roja con el enlace directo `wa.me/` para continuar el trato en 1 clic.
