# WIKI_SCHEMA.md — Taxonomía y Convenciones de Memoria

> **Proyecto:** Realty ONE Group Bolivia  
> **Sistema:** LLM Wiki & Persistent Memory (Karpathy Pattern)  
> **Versión:** 1.0.0

---

## 1. Estructura de Capas
- `raw/`: Fuentes crudas originales e inmutables (documentos, extractos, configuraciones).
- `wiki/sources/`: Extracciones estructuradas y resúmenes de cada fuente cruda o sesión.
- `wiki/entities/`: Entidades concretas (plataformas, servicios, herramientas, organizaciones).
- `wiki/concepts/`: Conceptos, patrones, arquitecturas y decisiones estratégicas.
- `wiki/topics/`: Síntesis de alto nivel y guías temáticas comprehensivas.
- `index.md`: Catálogo maestro de páginas y descripciones en 1 línea.
- `log.md`: Bitácora cronológica inmutable de operaciones en la memoria.

## 2. Esquema de Frontmatter
Todas las notas en `wiki/` deben incluir frontmatter YAML:
```yaml
---
title: "Título de la Nota"
type: entity | concept | topic | source
tags: [inmobiliaria, whatsapp, render, ai]
created: YYYY-MM-DD
updated: YYYY-MM-DD
aliases: ["Nombre Alternativo"]
---
```

## 3. Reglas de Enlace
- Emplear `[[wikilinks]]` bidireccionales en todas las notas generadas.
- Cada nota debe tener al menos 2 enlaces salientes.
