---
title: "Modernización y Blindaje del Portal Web"
type: concept
tags: [frontend, audit, doubt-driven-development, ux, glassmorphism]
created: 2026-10-16
updated: 2026-10-16
aliases: ["Web Portal Modernization", "Auditoría Adversarial Frontend"]
---

# Modernización y Blindaje del Portal Web

Proceso de refactorización y resolución de defectos arquitectónicos en el portal web público (`index.html`, `buscar.html`, `script.js`, `styles.css`) desarrollado bajo metodología `/doubt-driven-development`.

## Premisas de Blindaje
- **Aislamiento Total del Chatbot:** No se altera la lógica conversacional, flujos CTWA ni conectores de mensajería (`aiAgent.js`, `whatsapp_baileys.js`, `server.js`).
- **Retrocompatibilidad:** Soporte continuo tanto para el esquema legado de propiedades como para las nuevas categorías normalizadas.

## Defectos Corregidos

1. **Desacople Operación vs Categoría:**
   - Anteriormente, el buscador comparaba `categoria` ("Casa", "Departamento", "Comercial") contra `p.tipo` ("Venta", "Alquiler"), produciendo 0 resultados.
   - Solución: Introducción de `getPropCategory(p)` para inferir la tipología del inmueble independientemente de su tipo de transacción.

2. **Sincronización Bidireccional de Parámetros URL:**
   - La barra de búsqueda de `index.html` ahora redirige a `buscar.html` enviando `operacion`, `categoria`, `ubicacion` y `precio_max`.
   - `buscar.html` parsea robustamente tanto los parámetros legados (`tab`, `type`, `loc`, `price`) como los estándar, inicializando los selects y botones en pantalla.

3. **Filtro Visible de Presupuesto:**
   - Adición de un control numérico visible `Presupuesto Máx. ($US)` en el panel lateral de `buscar.html`.

4. **Navegación Dinámica con ScrollSpy:**
   - Eliminación de la clase `active` fija en el menú.
   - Monitoreo de secciones mediante `IntersectionObserver` en `script.js` para resaltar automáticamente la sección visible.

5. **Eliminación de Jank Visual en Topbar y Drawer Móvil:**
   - Transiciones sincronizadas en `header` y `.topbar`.
   - Capa `z-index: 1005` para `.header-btns` asegurando interacción limpia del menú hamburguesa.

## Relaciones
- Define la experiencia de usuario del [[portal-inmobiliario-frontend]].
- Respalda la imagen de marca de [[realty-one-group-bolivia]].
