---
title: "Sesión: Restauración de Túnel Cloudflare y Captura de Leads WhatsApp (18 de Octubre, 2026)"
type: source
tags: [session, whatsapp-bot, cloudflare-tunnel, lead-classifier, ingreso-leads]
created: 2026-10-18
updated: 2026-10-18
aliases: ["Sesion 18 Octubre 2026", "Bot Tunnel and Lead Sync Session"]
---

# Sesión: Restauración de Túnel Cloudflare y Captura de Leads WhatsApp (18 de Octubre, 2026)

## Contexto y Solicitud
- **Problema 1 (Conectividad Externa):** El usuario reportó que el conector QR (`qr_connect.html`) y el panel de leads (`ingreso_leads.html`) estaban caídos ("No se puede acceder a este sitio web"), requiriendo acceso urgente en línea.
- **Problema 2 (Captura de Leads):** El usuario detectó que el panel `ingreso_leads.html` no estaba recogiendo ni visualizando adecuadamente los datos que los clientes proporcionaban al bot de WhatsApp.
- **Alcance de Archivos:**
  - Red y Túnel: `cloudflared.exe`, `TUNNEL_ACTUAL.txt`, `iniciar_bot_con_tunel.bat`, `iniciar_bot_con_tunel.ps1`, `reiniciar_bot.bat`.
  - Extracción y Clasificación: `services/leadClassifier.js`, `backend/services/leadClassifier.js`, `services/aiAgent.js`, `backend/services/aiAgent.js`.
  - Frontend: `ingreso_leads.html`.

## Diagnóstico y Causa Raíz
1. **Caída de Enlaces Cloudflare:**
   - Las URLs `*.trycloudflare.com` generadas por Quick Tunnels son de naturaleza efímera. Al detenerse el proceso anterior, el dominio expiró.
2. **Fallas en Extracción de Datos de Leads:**
   - La función `extractBudget` tomaba fragmentos numéricos de números de celular (+591...), marcas de tiempo o fechas (2026) confundiéndolos con montos de inversión.
   - No existía extractor específico para la ciudad del cliente (`extractCity`), causando que se colapsara o confundiera con nombres o zonas.
   - Las categorías de propiedad en `extractOperation` no distinguían adecuadamente `Casa`, `Departamento`, `Terreno / Lote` u `Oficina / Comercial`.
   - `ingreso_leads.html` requería mapeo consistente con los atributos que emite el clasificador (`cliente_nombre`, `numero_celular`, `ciudad`, `zona_interes`, `tipo_interes`, `presupuesto`, `score`).

## Soluciones Ejecutadas

1. **Restablecimiento del Túnel HTTPS:**
   - Nuevo túnel activo vinculado a `http://localhost:3000`: `https://highlights-cdna-comparisons-totals.trycloudflare.com`.
   - Documentado en `TUNNEL_ACTUAL.txt` y protegido con clave `?key=ONE2026`.
   - Creados scripts de lanzamiento en un clic: `iniciar_bot_con_tunel.bat` y `iniciar_bot_con_tunel.ps1`.

2. **Refactorización de `leadClassifier.js`:**
   - Creado `extractCity(text)` para detectar ciudades bolivianas e internacionales.
   - `extractBudget(text)` blindado con regex de limpieza previa para omitir teléfonos, emails y años antes de parsear presupuestos explícitos.
   - Clasificación precisa de tipo de inmueble (`Casa`, `Departamento`, `Terreno / Lote`, etc.).
   - Sincronización completa entre `services/` y `backend/services/`.

3. **Frontend `ingreso_leads.html`:**
   - Integración visual de todos los campos extraídos en la tabla en tiempo real.

## Validación Final
- Se validaron los endpoints locales y remotos.
- El usuario confirmó: *"quedo perfecto, gracias."*

## Páginas Relacionadas
- [[ingreso-leads-crm]]
- [[whatsapp-bot-arquitectura]]
- [[produccion-vs-local]]
- [[realty-one-group-bolivia]]
