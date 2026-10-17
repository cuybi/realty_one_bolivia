---
title: "Máquina de Estados de Atención al Cliente (5 Estados / 6 Reglas)"
type: concept
tags: [ia, chatbot, customer-service, state-machine, aiagent]
created: 2026-10-16
updated: 2026-10-16
aliases: ["Flujo de Atención al Cliente", "5 Estados 6 Reglas", "Customer Service Bot"]
---

# Máquina de Estados de Atención al Cliente (5 Estados / 6 Reglas)

Arquitectura conversacional humanizada de atención al cliente implementada en `backend/services/aiAgent.js` y `services/aiAgent.js` para canal orgánico de WhatsApp.

## Principios de Diseño
- **Sin AI Slop:** Cero menús robóticos ni viñetas numéricas en el chat orgánico.
- **Tono Humanizado:** Respuestas empáticas, adaptadas al huso horario de Bolivia (UTC-4).
- **Enrutamiento Híbrido:** Si el mensaje proviene de anuncio Click-to-WhatsApp o tarjeta `externalAdReply`, prioriza ficha técnica y fotos; si es orgánico, activa el ciclo de 5 estados.

## Los 5 Estados

1. **ESTADO 1 (Saludo Inicial):**
   - Saludo cordial personalizado con el nombre del remitente (si existe).
   - Pregunta abierta de asistencia: *"¿En qué puedo ayudarte?"*.

2. **ESTADO 2 (Captura de Datos):**
   - Solicitud amable de nombre completo, teléfono/WhatsApp, correo electrónico y ciudad.
   - Validación amigable en caso de datos faltantes; explicación de seguridad y alternativa telefónica si el usuario se rehúsa.

3. **ESTADO 3 (Agendamiento de Visitas):**
   - Validación estricta de día de la semana, fecha y hora (ej: *"Lunes 15 de marzo a las 10:00 AM"*).
   - Manejo cortés si el cliente aún no desea agendar.

4. **ESTADO 4 (Recordatorio):**
   - Ofrecimiento condicional de recordatorio 24 horas antes de la visita coordinada.

5. **ESTADO 5 (Despedida Oficial Obligatoria):**
   - Agradecimiento formal personalizado y cierre con la frase corporativa obligatoria:
     > *"Cualquier duda o inquietud no dude en llamar."*
   - Supresión de respuestas duplicadas o residuales tras el cierre.

## Validación y Testing
- Suite oficial: `backend/test_customer_service_flow.js` (5/5 escenarios aprobados al 100%).

## Relaciones
- Implementado dentro de [[whatsapp-bot-arquitectura]].
- Alimenta con prospectos calificados a [[ingreso-leads-crm]].
- Componente de [[realty-one-group-bolivia]].
