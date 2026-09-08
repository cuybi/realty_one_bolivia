# LLM Wiki Skill

Skill basada en el patrón de **LLM Wiki / Base de Conocimiento Interconectada** de Andrej Karpathy para agentes de Antigravity / Gemini / Claude.

## Ubicación
- Archivo de definición: [SKILL.md](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/.agents/skills/llm-wiki-skill/SKILL.md)

## Funcionalidades
1. **`/wiki-init`**: Inicializa la estructura de carpetas (`raw/`, `generated/`, `SCHEMA.md`, `index.md`, `log.md`).
2. **`/ingest`**: Procesa documentos originales y crea notas atómicas interconectadas con `[[wikilinks]]`.
3. **`/query`**: Responde consultas a partir de la base de conocimiento compilada.
4. **`/wiki-lint`**: Audita la salud de la wiki (enlaces rotos, notas huérfanas, contradicciones).
