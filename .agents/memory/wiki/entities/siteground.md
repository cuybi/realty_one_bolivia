---
title: "SiteGround Hosting"
type: entity
tags: [hosting, php, webhooks, cpanel]
created: 2026-09-04
updated: 2026-09-04
aliases: ["SiteGround"]
---

# SiteGround Hosting

Servidor web en producción que aloja el portal principal y los scripts PHP de sincronización para [[realty-one-group-bolivia]].

## Dominio y Archivos Clave
- **Dominio:** `realyonegroupbolivia.e-techgroupbolivia.com`
- `webhook.php`: Recibe los eventos de [[meta-cloud-api]], guarda copia local de leads y retransmite a [[render]].
- `save_leads_sync.php`: Sincronización bidireccional de prospectos.
- `export_leads.php`: Exportación directa a Excel y CSV.
- `activar.php`: Script de registro WABA para Meta Webhooks.

## Enlaces Relacionados
- [[whatsapp-bot-arquitectura]]
- [[produccion-vs-local]]
