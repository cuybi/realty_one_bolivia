---
title: "Portal Inmobiliario Frontend"
type: topic
tags: [frontend, architecture, ui, javascript, css]
created: 2026-10-16
updated: 2026-10-16
aliases: ["Frontend ROG", "Web Portal", "Portal Inmobiliario"]
---

# Portal Inmobiliario Frontend

Arquitectura y estructura del portal web público de Realty ONE Group Bolivia.

## Superficies Principales

1. **Página Principal (`index.html`):**
   - **Hero Slider:** Carrusel dinámico con buscador de lujo flotante en Glassmorphism (paleta dorada #c7aa5e y negro #0a0a0a).
   - **Cultura 6Cs:** Coolure, Connect, Coaching, Community, Commission, Care.
   - **Catálogo Destacado & Proyectos:** Renderizado reactivo de inmuebles y desarrollos (ej. Urubó Green Park).
   - **Directorio de Agentes & Testimonios:** Tarjetas de e-Realtors con contacto WhatsApp en 1 clic.

2. **Buscador Especializado (`buscar.html`):**
   - Panel lateral de filtros: operación, categoría, ubicación/zona, habitaciones mínimas, baños mínimos, presupuesto máximo y ordenamiento por precio o fecha.
   - Barra superior de accesos rápidos (*Todos, Venta, Alquiler, Anticrético, Terrenos*).
   - Contador de resultados reactivo.

3. **Mapa Interactivo de Loteamientos (`mapa.html`):**
   - Renderizado cartográfico satelital con **Leaflet.js**.
   - Identificación de lotes por disponibilidad (*🟢 Disponible, 🟡 Reservado, 🔴 Vendido*).

4. **Landings Especializadas:**
   - `venta.html`, `alquiler.html`, `anticretico.html`, `terrenos.html`, `propiedad.html`.

5. **Panel CMS Administrativo:**
   - Modal administrativo con autenticación de clave maestra (`ONE2026`).
   - Gestión integral de slides, propiedades, proyectos, noticias, testimonios y agentes.
   - Persistencia dual: local (`realty_one_data.json`) y nube (`save_cms.php` en SiteGround).

## Relaciones
- Implementa los lineamientos de [[portal-web-modernization]].
- Representa el escaparate público de [[realty-one-group-bolivia]].
- Genera consultas hacia [[whatsapp-bot-arquitectura]] y [[ingreso-leads-crm]].
