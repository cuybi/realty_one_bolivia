---
title: "Estrategia de Despliegue: Producción en la Nube vs Entorno Local"
type: concept
tags: [arquitectura, render, baileys, meta, nube]
created: 2026-09-04
updated: 2026-09-04
aliases: ["Producción vs Local"]
---

# Estrategia de Despliegue: Producción vs Local

Define la separación operativa entre el entorno de desarrollo local y la ejecución en la nube.

## Decisión del Usuario
El bot no debe operar de forma local para la atención comercial diaria de [[realty-one-group-bolivia]], sino en infraestructura cloud estable y autónoma.

## Comparativa Técnica

| Característica | Producción (Nube) | Local (Desarrollo) |
| :--- | :--- | :--- |
| **Pila** | [[render]] + [[siteground]] | Node.js local (Windows) |
| **Conector WhatsApp** | [[meta-cloud-api]] Oficial | Baileys (`whatsapp_baileys.js`) |
| **Autenticación WhatsApp** | Token permanente WABA | Escaneo QR (`qr_connect.html`) |
| **Persistencia de Sesión** | Permanente y gestionada por Meta | Local en carpeta `baileys_auth` |
| **Comportamiento en Reinicio** | Instantáneo y transparente | Inviable en Render Free (disco efímero pierde el QR) |
| **Puerto de Escucha** | Puerto `10000` (Render) | `3000` (`server.js`) y `3001` (`baileys`) |

## Enlaces Relacionados
- [[whatsapp-bot-arquitectura]]
- [[render]]
- [[meta-cloud-api]]
