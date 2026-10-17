---
title: "Ingreso Leads CRM & Analítica"
type: entity
tags: [crm, leads, dashboard, streamlit, chrome-extension]
created: 2026-10-16
updated: 2026-10-16
aliases: ["Ingreso Leads", "CRM e-Realtors", "Streamlit Dashboard"]
---

# Ingreso Leads CRM & Analítica

Ecosistema integral de seguimiento comercial y asignación inteligente de prospectos inmobiliarios para Realty ONE Group Bolivia.

## Componentes

1. **Dashboard Web en Vivo (`ingreso_leads.html`):**
   - Interfaz web multi-dispositivo accesible vía URL pública con token (`key=ONE2026`).
   - Sincronización continua de prospectos con Render y SiteGround.
   - Acceso en 1 clic a chat directo de WhatsApp (`wa.me`) con el prospecto.
   - Exportador nativo a Excel (.xlsx/.xls) y CSV con codificación UTF-8 limpia.

2. **Extensión de Chrome (Realty ONE • Ingreso Leads v1.2.1):**
   - Inserción de respuestas rápidas y plantillas directas en WhatsApp Web.
   - Monitoreo y captura instantánea de prospectos.

3. **Dashboard de Inteligencia Streamlit (`app.py`):**
   - Corriendo localmente en `http://localhost:8501`.
   - Métricas KPI en tiempo real: leads totales, leads potenciales (score ≥ 80), tasa de agendamiento y pipeline en USD/Bs.
   - Embudo comercial interactivo (*Nuevos ➔ Contactados ➔ Visita ➔ Negociación ➔ Cerrados*).
   - Leaderboard de e-Realtors (Carlos Rodríguez, Valeria Suárez, Andrés Montaño, Lucía Vaca, Robert Oliva).

## Relaciones
- Conectado a [[whatsapp-bot-arquitectura]] para recepción de prospectos calificados.
- Datos respaldados en [[siteground]] y [[render]].
- Pertenece a la plataforma [[realty-one-group-bolivia]].
