> **Última Actualización:** 04 de Septiembre, 2026  
> **Plataforma:** Realty ONE Group Bolivia - Portal Web Inmobiliario, Chatbot IA & CRM de e-Realtors  
> **Enfoque de Mercado:** Santa Cruz de la Sierra, Urubó, Equipetrol, Sirari, Las Palmas, Zona Norte, Parque Industrial G77 (Bolivia)  
> **Identidad de Marca:** Estética Gold & Black Luxury (Dorado #D4AF37 y Fondo Oscuro #0d0d0d)  
> **Integración Facebook Ads:** Campañas Click-to-WhatsApp activas de *Terreno Industrial G77 (7.000 m²)* y *Lote Condominio Mar Adentro (450 m²)*.
> **Motor de IA Conversacional:** Google Gemini 2.0 Flash Lite (`aiAgent.js`).

---

## 1. Resumen Ejecutivo del Proyecto

Se ha implementado el embudo comercial integral de punta a punta:
```
One Comsys / Facebook Ads ➔ Publicación ➔ Click-to-WhatsApp ➔ Prospectos ➔ Solicitar Información
                                                                     │
                                                                 Chatbot IA
                                                                     │
                                                      Respuesta Exclusiva por Campaña
                                                                     │
                                                             Formulario de Datos
                                                                     │
                                                            Prospectos Potenciales
                                                                     │
                                                             Asignaciones CRM IA
                                                                     │
                                                            Atención de e-Realtors
```

1. **One Comsys & Catálogo Central:** Base de propiedades, proyectos y loteamientos con precios en USD y Bs.
2. **Campañas de Facebook Ads e Instagram (Click-to-WhatsApp):** Mapeo y respuesta exclusiva por publicación para *Terreno Industrial G77* y *Lote Mar Adentro*.
3. **Extracción Integral de Metadatos de Facebook (`externalAdReply`):** Extracción de título, descripción, fotos y enlaces de publicaciones compartidas en WhatsApp Baileys y Webhook PHP.
4. **Chatbot IA & Formulario de Datos:** Respuesta inmediata con fichas técnicas y captura guiada de datos de contacto sin desviaciones al menú general.
5. **Calificación & Lead Scoring:** Clasificación automática de prospectos (🔥 Potencial, ⚡ Indeciso, ❄️ Pasivo, 💼 Propietario).
6. **Asignaciones CRM IA a e-Realtors:** Asignación inteligente según especialidad y zona (Carlos Rodríguez, Valeria Suárez, Andrés Montaño, Lucía Vaca, Robert Oliva).
7. **Panel CRM de e-Realtors (`crm_leads.html`):** Visualización en tiempo real con botón directo de WhatsApp para atención inmediata en 1 clic y exportador a Excel (.xlsx) y CSV.

---

## 2. Pila Tecnológica y Arquitectura

| Componente | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend Base** | HTML5 Semántico + JavaScript ES6+ | Estructura modular y scripts cliente asíncronos (`script.js`). |
| **Diseño y Estilos** | CSS3 Nativo (`styles.css`) | Variables CSS, Glassmorphism, paleta dorada/oscura, grid y flexbox. |
| **Animaciones & Iconos** | AOS (Animate on Scroll) + FontAwesome 6 | Transiciones suaves, micro-interacciones y tipografía Outfit/Montserrat. |
| **Cartografía** | Leaflet.js 1.9.4 | Mapas interactivos para urbanizaciones y loteamientos con marcadores dinámicos. |
| **Backend** | Node.js + Express.js (`backend/server.js`) | API RESTful con CORS, body parser de 50MB y servidor de archivos estáticos. |
| **Persistencia de Datos** | `backend/database.js` & `backend/realty_one_data.json` | Driver modular con operaciones preparadas (`prepare`, `run`, `all`, `get`). |
| **Autenticación CMS** | Header `x-admin-key` | Token de acceso administrativo (`ONE2026` por defecto o variable `ADMIN_KEY`). |

---

## 3. Estructura Completa del Repositorio

```
realty_one_bolivia/
├── index.html                  # Landing principal (Hero slider, catálogo, 6Cs, agentes, contacto)
├── buscar.html                 # Buscador avanzado con filtros laterales y ordenamiento
├── mapa.html                   # Mapa interactivo satelital para loteamientos y urbanizaciones
├── propiedad.html              # Ficha individual de propiedad con galería y WhatsApp
├── venta.html                  # Catálogo especializado: Propiedades en Venta
├── alquiler.html              # Catálogo especializado: Propiedades en Alquiler
├── anticretico.html           # Catálogo especializado: Inmuebles en Anticrético
├── terrenos.html              # Catálogo especializado: Lotes y Terrenos
├── crm_leads.html              # Panel CRM de gestión de leads, KPIs y exportación a Excel
├── publicidades.html           # Gestor de campañas de Facebook Ads y simulador
├── qr_connect.html             # Conector WhatsApp Web por código QR (Multi-Device)
├── whatsapp_test.html          # Simulador de WhatsApp Business en vivo
├── webhook.php                 # Webhook oficial para Meta Cloud API con captura de leads
├── export_leads.php            # Exportador directo PHP a Excel (.xlsx/.xls) y CSV
├── leads.json / leads.csv      # Base de datos de prospectos y reporte exportable
├── styles.css                 # Sistema de diseño global, tokens, glassmorphism y responsive
├── script.js                  # Lógica del cliente, renderizado dinámico, llamadas a API y CMS
├── package.json               # Dependencias raíz (Express, Cors)
├── MEMORY.md                  # Memoria técnica y bitácora del proyecto
├── build_zip.ps1              # Script de empaquetado de producción
├── copy_assets.js             # Utilidad de sincronización de recursos
├── copy_images.js             # Utilidad de copia de imágenes
├── refactor.js / refactor.py  # Scripts de migración a consumo API asíncrono
├── backend/
│   ├── server.js              # Servidor Express, middlewares, rutas y autenticación
│   ├── whatsapp_baileys.js    # Servidor WhatsApp Web WebSocket con Baileys
│   ├── database.js            # Capa de datos en memoria/disco con auto-seeding
│   ├── leads.json             # Base de datos JSON de prospectos perfilados
│   ├── campaigns.json         # Base de datos de campañas publicitarias
│   ├── realty_one_data.json   # Base de datos JSON de propiedades y CMS
│   ├── routes/
│   │   └── whatsappRoutes.js  # Endpoints de webhook, simulación, leads y exportación Excel/CSV
│   └── services/
│       ├── aiAgent.js         # Cerebro IA inmobiliario y asesor de Bolivia
│       ├── leadClassifier.js  # Motor de clasificación por prioridad y desglose temporal
│       ├── excelService.js    # Generador de reportes Excel (.xlsx/.xml) y CSV con UTF-8 BOM
│       ├── campaignService.js # Servicio de campañas de Facebook Ads
│       └── whatsappService.js # Cliente de envío Meta Cloud API
│   └── package.json           # Dependencias backend
├── assets/                    # Identidad corporativa, logos, retratos de agentes y texturas
└── .agents/
    ├── MEMORY.md              # Resumen técnico conciso para agentes y subagentes
    └── skills/
        └── llm-wiki-skill/    # Skill de gestión de base de conocimiento Markdown
```

---

## 4. Módulos y Funcionalidades Clave

### 4.1. Portal Principal (`index.html`)
- **Header & Topbar:** Enlaces a redes sociales, teléfono directo, acceso rápido y menú desplegable por categorías.
- **Hero Slider:** Carrusel con transiciones suaves, títulos de impacto y buscador rápido integrado.
- **Cultura de los 6 Cs:** Módulo que expone los valores de Realty ONE Group (Coolure, Connect, Coaching, Community, Commission, Care).
- **Catálogo Destacado:** Tarjetas interactivas con badges (Venta, Alquiler, Anticrético, Terreno), precio, m², dormitorios y baños.
- **Proyectos Exclusivos:** Ficha destacada para desarrollos como *Urubó Green Park* con lista de amenidades y cotización por m².
- **Directorio de Agentes:** Tarjetas profesionales con avatar, datos de contacto, especialidad y enlace a WhatsApp.
- **Noticias & Testimonios:** Sección de blog inmobiliario y reseñas con calificación de 5 estrellas.
- **Footer Corporativo:** Suscripción al newsletter, enlaces rápidos y copyright.

### 4.2. Motor de Búsqueda (`buscar.html`)
- Filtros laterales en tiempo real:
  - **Tipo de Operación:** Venta, Alquiler, Anticrético, Terreno.
  - **Ubicación:** Santa Cruz, Urubó, Equipetrol, Sirari, Las Palmas, Zona Norte, Centro.
  - **Rango de Precio:** Filtro de presupuesto mínimo y máximo.
  - **Distribución:** Filtros por número de dormitorios (1+, 2+, 3+, 4+) y baños.
- Ordenamiento dinámico: Por menor precio, mayor precio o más recientes.
- Contador reactivo de inmuebles encontrados.

### 4.3. Mapa Interactivo de Loteamientos (`mapa.html`)
- Renderizado sobre **Leaflet.js** con capas satelitales y de calles.
- Sidebar retráctil con buscador de lotes por código o manzana.
- Filtros de estado por colores:
  - 🟢 **Disponible** (Verde / Dorado)
  - 🟡 **Reservado** (Amarillo)
  - 🔴 **Vendido** (Rojo / Oscuro)
- Popup flotante con detalles de superficie, precio y botón de cotización por WhatsApp.

### 4.4. Ficha de Propiedad (`propiedad.html`)
- Galería fotográfica con selector dinámico.
- Badge de operación y precio en USD.
- Métricas destacadas: Metraje ($m^2$), dormitorios, baños, parqueos.
- Descripción extendida del inmueble y lista de características.
- Botones de acción directa: Llamada telefónica y mensaje de WhatsApp con mensaje personalizado.

### 4.5. Sistema CMS Integrado (Panel de Control)
- Acceso seguro mediante botón discreto o atajo de teclado solicitando clave maestra.
- Gestión completa (Crear, Editar, Eliminar, Activar/Desactivar):
  - **Slides del Hero**
  - **Categorías de Inmuebles**
  - **Propiedades** (Título, precio, ubicación, m², dormitorios, baños, múltiples imágenes JSON, destacado)
  - **Proyectos y Loteamientos**
  - **Noticias y Blog**
  - **Testimonios de Clientes**
  - **Agentes Inmobiliarios**
  - **Configuraciones Globales** (Teléfonos, correos, dirección de oficina, textos institucionales)

---

## 5. Especificación de la API REST

| Método | Ruta | Seguridad | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Público | Estado de la API, versión y conteo de propiedades activas |
| `GET` | `/api/slides` | Público | Lista ordenada de diapositivas del carrusel |
| `POST` | `/api/slides` | `x-admin-key` | Crear nueva diapositiva |
| `PUT` | `/api/slides/:id` | `x-admin-key` | Actualizar diapositiva existente |
| `DELETE` | `/api/slides/:id` | `x-admin-key` | Eliminar diapositiva |
| `GET` | `/api/categorias` | Público | Lista de categorías de propiedades |
| `PUT` | `/api/categorias/:id` | `x-admin-key` | Modificar datos de categoría |
| `GET` | `/api/propiedades` | Público | Búsqueda y filtrado (`operacion`, `ubicacion`, `habitaciones`, `banos`, `destacado`, `search`, `order`) |
| `GET` | `/api/propiedades/:id` | Público | Obtener detalle de una propiedad específica |
| `POST` | `/api/propiedades` | `x-admin-key` | Registrar nueva propiedad |
| `PUT` | `/api/propiedades/:id` | `x-admin-key` | Actualizar datos de una propiedad |
| `DELETE` | `/api/propiedades/:id` | `x-admin-key` | Desactivar / eliminar propiedad |
| `GET` | `/api/proyectos` | Público | Lista de proyectos inmobiliarios activos |
| `POST` | `/api/proyectos` | `x-admin-key` | Registrar nuevo proyecto |
| `PUT` | `/api/proyectos/:id` | `x-admin-key` | Modificar proyecto existente |
| `DELETE` | `/api/proyectos/:id` | `x-admin-key` | Desactivar / eliminar proyecto |
| `GET` | `/api/noticias` | Público | Lista de artículos de noticias y blog |
| `POST` | `/api/noticias` | `x-admin-key` | Publicar nuevo artículo |
| `PUT` | `/api/noticias/:id` | `x-admin-key` | Modificar artículo |
| `DELETE` | `/api/noticias/:id` | `x-admin-key` | Desactivar / eliminar artículo |
| `GET` | `/api/testimonios` | Público | Lista de testimonios aprobados |
| `POST` | `/api/testimonios` | `x-admin-key` | Crear testimonio |
| `PUT` | `/api/testimonios/:id` | `x-admin-key` | Modificar testimonio |
| `DELETE` | `/api/testimonios/:id` | `x-admin-key` | Eliminar testimonio |
| `GET` | `/api/agentes` | Público | Directorio de agentes inmobiliarios |
| `POST` | `/api/agentes` | `x-admin-key` | Registrar nuevo asesor inmobiliario |
| `PUT` | `/api/agentes/:id` | `x-admin-key` | Actualizar datos de asesor |
| `DELETE` | `/api/agentes/:id` | `x-admin-key` | Desactivar asesor |
| `GET` | `/api/config` | Público | Obtener configuración institucional y de contacto |
| `POST` | `/api/config` | `x-admin-key` | Actualizar configuración institucional y de contacto |

---

## 6. Guía de Uso y Operación

### 6.1. Ejecución Local
```bash
# Instalar dependencias
npm install

# Iniciar servidor backend y frontend integrado
npm start
# o
node backend/server.js
```
El portal estará disponible en `http://localhost:3000`.

### 6.2. Credenciales y Acceso Administrativo
- **Clave Admin:** `ONE2026` (configurable mediante la variable de entorno `ADMIN_KEY`).
- **Encabezado HTTP:** `x-admin-key: ONE2026`.
- **Persistencia:** Toda modificación realizada a través del CMS se guarda automáticamente en `backend/realty_one_data.json`.

---

## 7. Módulo de Campañas Facebook Ads & Automatización de WhatsApp

### 7.1. Publicaciones Vigentes Configuradas
1. **Terreno Industrial en Parque Industrial (Salida Av. G77):**
   - Superficie: 7.000 m² (185 m frente × 150 m fondo).
   - Precio: Bs 16.800.000.
   - Servicios: Factibilidad inmediata de Trifásica y Agua Industrial.
   - Asesor asignado: Asesor Realty ONE Itaguazú (+591 77930116 / +591 60937050).
2. **Lote en Condominio Mar Adentro (Urubó):**
   - Superficie: 450 m² (15 m frente × 30 m fondo).
   - Precio: $112,500 USD.
   - Amenidades: A 300 m de la laguna cristalina Crystal Lagoons, Club House, playa de arena blanca, canchas.
   - Asesor asignado: Asesor Realty ONE Itaguazú (+591 79878853).

### 7.2. Mecanismo de Extracción y Respuesta Exclusiva
- **Extracción de `externalAdReply`:** El conector de WhatsApp Baileys (`whatsapp_baileys.js`) y `webhook.php` extraen el título, descripción, imagen y URL `fb.me` de la tarjeta del post de Facebook.
- **Mapeo Semántico:** Consultas directas como *"sobre el terreno"*, *"el terreno"*, *"sobre la publicacion"*, *"la publicacion"*, *"el post"* o menciones de precios/dimensiones activan de inmediato la ficha técnica de la publicación sin mostrar el menú genérico.
- **Persistencia de Campaña:** La sesión del usuario permanece anclada a la propiedad consultada para responder dudas sobre precios, servicios, papeles y visitas.

---

## 8. Arquitectura de Despliegue: Producción en la Nube vs Entorno Local

### 8.1. Decisión Estratégica de Producción
Se definió explícitamente que la operación del chatbot en producción **NO** debe ser local ni depender del conector Baileys (código QR), debido a que:
1. **Discos Efímeros en Render Free:** Cada reinicio o despliegue en Render destruye el sistema de archivos local (`baileys_auth`), revocando la sesión de WhatsApp Web y exigiendo re-escanear el QR manualmente.
2. **Estabilidad Corporativa:** En producción, se utiliza la **Meta Cloud API Oficial** gestionada a través de SiteGround y Render.

### 8.2. Flujo Integral en Producción (Render + SiteGround)
```
[Cliente WhatsApp]
       │
       ▼
[Meta Cloud API (Graph API)]
       │
       ▼
[SiteGround (PHP)] ──► webhook.php (Recepción inicial & guardado de leads local)
       │
       ▼ (POST /api/whatsapp/webhook)
[Render Web Service] ──► backend/server.js (Node.js Express en puerto 10000)
       │
       ├─► aiAgent.js (Google Gemini 2.0 Flash Lite + Procesamiento de Campañas)
       │
       └─► whatsappService.js ──► Meta Cloud API ──► [Respuesta al Cliente]
```

### 8.3. Entorno Local (Desarrollo y Testing QR)
- **Servidor Principal (REST API + CMS):** `node backend/server.js` ➔ Puerto `3000`.
- **Bot Baileys (Multi-Device QR):** `node backend/whatsapp_baileys.js` ➔ Puerto `3001` (`BAILEYS_PORT`).
- **Simulador / Vinculación:** `http://localhost:3001/qr_connect.html`.

---

## 9. Registro de Mantenimiento & Fixes Críticos (04 de Septiembre, 2026)

| N° | Archivo | Modificación | Propósito / Beneficio |
|:---|:---|:---|:---|
| **1** | [`backend/whatsapp_baileys.js`](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/backend/whatsapp_baileys.js) | `const PORT = process.env.BAILEYS_PORT \|\| process.env.PORT \|\| 3001;` | Evita colisión de puerto (`EADDRINUSE`) al correr simultáneamente con `server.js` (puerto 3000). |
| **2** | [`backend/server.js`](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/backend/server.js) | Eliminación de `app.use('/api/whatsapp', whatsappRoutes);` duplicado en línea 357. | Remueve montaje redundante de rutas ya declaradas en la línea 76. |
| **3** | [`backend/services/aiAgent.js`](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/backend/services/aiAgent.js) | Migración a `gemini-2.0-flash-lite` en `callGeminiAI` y `callGeminiCampaignAI`. | Reemplaza el modelo obsoleto/deprecado `gemini-1.5-flash` garantizando continuidad del motor de IA. |
| **4** | [`backend/services/aiAgent.js`](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/backend/services/aiAgent.js) | Eliminación de ~200 líneas de `generateLocalSemanticResponse` y saneamiento de `module.exports`. | Elimina código muerto nunca invocado por `processUserMessage`; exporta solo funciones activas. |
| **5** | [`render.yaml`](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/render.yaml) | `startCommand: node backend/server.js` y `healthCheckPath: /api/health`. | Corrige el comando de inicio en la nube: Render ahora corre la API oficial y receptor de webhook en vez de Baileys. |

---

## 10. Variables de Entorno Requeridas en Render

Para el correcto funcionamiento del servicio web en Render (`realty-one-whatsapp-bot`):
```ini
NODE_ENV=production
ADMIN_KEY=ONE2026
VERIFY_TOKEN=realty_one_webhook_secret_2026
WHATSAPP_PHONE_NUMBER_ID=567554903115433
WHATSAPP_TOKEN=<TOKEN_PERMANENTE_META_CLOUD_API>
GEMINI_API_KEY=<API_KEY_GOOGLE_AI_STUDIO>
BAILEYS_PORT=3001
```

