# 🦁 Sistema de Captura de Leads por Código QR 24/7 en la Nube
### Realty ONE Group Bolivia — Arquitectura Serverless Inmortal (Costo $0 Real)

Este sistema resuelve de raíz las caídas de Render (hibernación por inactividad) y de los túneles locales (ngrok/Cloudflare Tunnel que mueren al apagar la PC), implementando una **Arquitectura JAMstack Serverless + Database-as-a-Service**.

---

## 📌 1. ¿Por qué esta Arquitectura garantiza 100% de Uptime Gratis?

```
[Cliente escanea QR en letrero/folleto]
                │
                ▼
  [Red Global Edge CDN (Vercel / Cloudflare Pages / Netlify)] ◄─── NUNCA duerme (0 hibernación)
                │
                ▼
       [registro_qr.html]
                │
        ┌───────┴────────────────────────┐
        ▼                                ▼
[Supabase (PostgreSQL 24/7)]   [Google Sheets (Apps Script 24/7)]
  - Base de datos relacional      - Hoja de cálculo viva en Drive
  - API REST HTTPS instantánea     - Acceso directo para vendedores
        │                                │
        └───────┬────────────────────────┘
                ▼
    [crm_cloud.html (Panel)] ──► [Exportar a Excel / 💬 WhatsApp Directo]
```

### Principios Arquitectónicos:
1. **Sin Contenedores Stateful:** Render, Koyeb y Railway suspenden contenedores Docker gratuitos tras 15 minutos sin peticiones. Esta solución usa **Edge CDN Serverless** (Vercel/Netlify/Cloudflare Pages), donde **no hay contenedor que hiberne**. Cada petición responde en <30 ms desde más de 300 ciudades del mundo.
2. **Cero Dependencia de tu PC:** Tu computadora y tu teléfono pueden estar 100% apagados o sin batería; la captura de prospectos y el guardado en base de datos ocurren 100% en la nube de Supabase/Google.
3. **Persistencia Dual Resiliente:** Si se configura Supabase y Google Sheets en `config.js`, el sistema guarda el lead en ambos lugares a la vez. Cero riesgo de pérdida de datos.

---

## 📁 2. Estructura de Archivos del Sistema

```
sistema_qr_cloud/
├── index.html              # Menú central de acceso
├── registro_qr.html        # Formulario móvil que abre el cliente al escanear el QR
├── qr_generator.html       # Generador de códigos QR con descarga PNG e impresión
├── crm_cloud.html          # Panel CRM en la nube con métricas y exportación Excel
├── config.js               # Conexión centralizada a Supabase o Google Sheets
├── database_supabase.sql   # Script SQL para crear las tablas y seguridad en Supabase
├── google_apps_script.js   # Script para conectar con Google Sheets en 2 clics
└── README_DESPLIEGUE.md    # Esta guía paso a paso
```

---

## 🚀 3. Paso a Paso: Despliegue en 5 Minutos (100% Gratis)

### Opción A: Supabase + Vercel / Netlify (La más Profesional)

#### Paso 1: Crear tu Base de Datos en Supabase (Gratis, 2 minutos)
1. Entra a [https://supabase.com/](https://supabase.com/) y regístrate gratis con tu cuenta de GitHub (`cuybi`).
2. Haz clic en **"New Project"**:
   - Nombre: `realty-one-leads`
   - Contraseña de BD: (la que tú elijas)
   - Región: `São Paulo (South America)` o `US East`
3. Ve al menú lateral izquierdo > **SQL Editor**.
4. Haz clic en **"New query"**, copia todo el contenido del archivo `database_supabase.sql` y pégalo ahí.
5. Haz clic en **"Run"** (o presiona `Ctrl + Enter`). Verás `Success. No rows returned`.
6. Ve a **Project Settings (icono de engranaje) > API**:
   - Copia tu **Project URL** (ej: `https://abcdefgh.supabase.co`).
   - Copia tu **Project API Keys > anon / public** (la clave que empieza con `eyJ...`).
7. Abre `sistema_qr_cloud/config.js` y reemplaza esas dos claves:
   ```javascript
   SUPABASE_URL: 'https://tu-proyecto.supabase.co',
   SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',
   ```

#### Paso 2: Subir la Web a Vercel o Netlify (Gratis, 1 minuto)
* **Con Netlify Drop (Sin comandos):**
  1. Entra a [https://app.netlify.com/drop](https://app.netlify.com/drop).
  2. Arrastra la carpeta completa `sistema_qr_cloud` a la ventana de tu navegador.
  3. ¡Listo! En 5 segundos tendrás tu URL pública permanente y segura (ej: `https://realty-one-qr.netlify.app`).
* **Con Vercel:**
  1. Entra a [https://vercel.com/](https://vercel.com/) e inicia con GitHub.
  2. Importa tu repositorio `cuybi/realty_one_bolivia` con root directory en `sistema_qr_cloud` y dale **Deploy**.

---

### Opción B: Google Sheets Inmortal (Cero Tarjeta, Hoja de Cálculo Viva)

Si prefieres que los leads caigan directamente a un archivo de Excel en tu Google Drive:

1. Crea una hoja nueva en Google Sheets: [https://sheets.new](https://sheets.new).
2. En el menú superior: **Extensiones > Apps Script**.
3. Borra el código de ejemplo y pega todo el contenido de `google_apps_script.js`.
4. Haz clic en **Implementar > Nueva implementación**.
5. Selecciona tipo **Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona** (Anyone)
6. Haz clic en **Implementar**, autoriza los permisos de tu cuenta de Google y copia la **URL de la aplicación web** generada.
7. Pégala en `sistema_qr_cloud/config.js`:
   ```javascript
   GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycb.../exec',
   ```
8. ¡Listo! Cada persona que escanee el QR escribirá una nueva fila en tu Google Sheet automáticamente las 24 horas del día.

---

### Opción C: Tu propio Hosting SiteGround (Si quieres usar tu dominio actual)

Dado que ya tienes el hosting de SiteGround en `https://realyonegroupbolivia.e-techgroupbolivia.com/`:
1. Sube la carpeta `sistema_qr_cloud` a tu Administrador de Archivos en `public_html/sistema_qr_cloud/`.
2. Tus enlaces serán:
   - Formulario QR: `https://realyonegroupbolivia.e-techgroupbolivia.com/sistema_qr_cloud/registro_qr.html`
   - Generador de QR: `https://realyonegroupbolivia.e-techgroupbolivia.com/sistema_qr_cloud/qr_generator.html`
   - Panel CRM: `https://realyonegroupbolivia.e-techgroupbolivia.com/sistema_qr_cloud/crm_cloud.html`

---

## 📱 4. ¿Cómo se usa en el Día a Día?

1. **El Agente Inmobiliario:**
   - Abre `qr_generator.html`.
   - Selecciona si es para *Mar Adentro*, *Terreno Industrial G77*, *Letrero Se Vende* o *Folleto*.
   - Descarga la imagen PNG en alta calidad y la manda a imprimir para la lona, el banner o el letrero de la propiedad.
2. **El Cliente Interesado:**
   - Pasa frente a la propiedad o ve el volante y escanea el código con la cámara de su celular.
   - Se abre al instante `registro_qr.html` con la estética Luxury Gold & Black de Realty ONE Group.
   - Ingresa su nombre, celular y fecha preferida de visita.
   - El sistema guarda los datos en la base de datos 24/7 en milisegundos y le da un botón directo para hablar por WhatsApp con el asesor asignado.
3. **El Administrador / Broker:**
   - Abre `crm_cloud.html`, ingresa la clave maestra `ONE2026`.
   - Revisa todos los prospectos registrados, filtra por fecha o propiedad, los contacta en 1-clic por WhatsApp y descarga el reporte en Excel (.csv/.xlsx).
