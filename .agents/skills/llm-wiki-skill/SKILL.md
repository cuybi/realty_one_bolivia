---
name: llm-wiki-skill
description: "A CLI agent skill based on Andrej Karpathy's LLM Wiki concept — Create and maintain a persistent, interconnected Markdown knowledge base: ingesting sources, enabling queries over compiled knowledge, cross-referencing with wikilinks, and ensuring consistency through linting and auditing."
license: MIT
metadata:
  author: aaronoah
  version: 1.0.0
  homepage: https://github.com/aaronoah/llm-wiki-skill
  repository: https://github.com/aaronoah/llm-wiki-skill
  tags: [wiki, knowledge-base, notes, markdown, karpathy, second-brain, zettelkasten]
---

# LLM Wiki Skill

Continuously update, curate, and evolve a persistent knowledge base composed of interlinked Markdown files following the **LLM Wiki** methodology (popularized by Andrej Karpathy).

Rather than relying on stateless RAG that re-processes raw documents on every query, the LLM Wiki treats your knowledge base like an evolving codebase: synthesizing raw documents into atomic, cross-referenced entity/topic pages with `[[wikilinks]]`, maintained catalogs (`index.md`), audit logs (`log.md`), and schemas (`SCHEMA.md`).

---

## When to Activate This Skill

Activate this skill when the user requests to:
1. **Initialize a Wiki:** Create or scaffold a new LLM Wiki directory structure (`/wiki-init`, `init wiki`, `crear wiki`).
2. **Ingest Content:** Process, summarize, and cross-reference raw materials (articles, PDFs, notes, transcripts, URLs) into the wiki (`/ingest`, `ingestar`, `agregar documento`).
3. **Query the Wiki:** Synthesize answers using the compiled knowledge graph (`/query`, `consultar wiki`, `buscar en wiki`).
4. **Lint & Audit:** Verify wiki health, broken `[[wikilinks]]`, orphaned notes, contradictions, or schema drift (`/wiki-lint`, `audit wiki`, `revisar wiki`).

---

## Directory Architecture

```text
llm-wiki/                  # Root folder for the wiki / knowledge base
├── SCHEMA.md              # Domain rules, entity naming conventions, taxonomy & guidelines
├── index.md               # Master catalog: table of contents & one-line summaries
├── log.md                 # Append-only chronological activity log
├── raw/                   # Layer 1: Immutable original source materials
│   ├── documents/         # Articles, whitepapers, transcripts, notes, web clips
│   └── assets/            # Diagrams, images, attachments
└── generated/             # Layer 2: LLM-synthesized interlinked markdown knowledge
    ├── entities/          # Specific entities (people, companies, models, products)
    ├── topics/            # Conceptual topics (architectures, principles, theories)
    └── comparisons/       # Comparative analyses & tradeoff matrix documents
```

---

## Core Operational Workflows

### 1. Ingestion (`/ingest`)
When new raw material is provided (file, text, or URL):
1. **Save Raw:** Store the unedited source in `raw/documents/<slug>.md` with frontmatter metadata (`source`, `date`, `author`).
2. **Entity & Concept Extraction:** Identify key entities, concepts, and relationships mentioned.
3. **Atomic Synthesis:**
   - Create or update relevant pages in `generated/entities/` and `generated/topics/`.
   - Use strict YAML frontmatter:
     ```yaml
     ---
     title: "Entity / Concept Name"
     type: entity | topic | comparison
     tags: [tag1, tag2]
     created: YYYY-MM-DD
     updated: YYYY-MM-DD
     sources: ["raw/documents/<slug>.md"]
     ---
     ```
4. **Bidirectional Linking:** Add `[[wikilinks]]` to existing concepts (minimum 2 outbound links per page).
5. **Update Index:** Add or update the one-line summary in `index.md`.
6. **Append Log:** Record the action in `log.md` (`## [YYYY-MM-DDTHH:MM:SS] ingest | <subject> | <files>`).

---

### 2. Querying (`/query`)
When answering questions based on the wiki:
1. Consult `index.md` and `SCHEMA.md` to locate primary entity/topic pages.
2. Read the relevant compiled Markdown pages in `generated/`.
3. Follow `[[wikilinks]]` for deep context where necessary.
4. Cite the internal wiki pages and original raw sources in responses.

---

### 3. Linting & Maintenance (`/wiki-lint`)
Check and fix:
- **Dead Links:** Find `[[wikilinks]]` pointing to non-existent files.
- **Orphan Pages:** Identify notes with zero inbound or outbound links.
- **Contradictions:** Flag conflicting assertions between pages.
- **Index Sync:** Ensure every generated file appears in `index.md`.

---

## Templates

### `index.md` Template
```markdown
# Wiki Index

> Last Updated: [YYYY-MM-DDTHH:MM:SS] | Total Pages: [N]

## Entities
- [[entity-name]]: One-line concise summary of the entity.

## Topics
- [[topic-name]]: One-line concise summary of the topic.

## Comparisons
- [[comparison-name]]: Summary of comparative findings.
```

### `log.md` Template
```markdown
# Activity Log

> Format: `## [ISO-Timestamp] action | subject | files`

## [2026-08-14T15:00:00] init | Created wiki structure | SCHEMA.md, index.md, log.md
```

### `SCHEMA.md` Template
```markdown
# Wiki Schema & Guidelines

## Conventions
- **Naming:** Lowercase with hyphens (e.g., `transformer-attention.md`).
- **Linking:** Every note must contain at least 2 `[[wikilinks]]`.
- **Immutability:** Never edit files inside `raw/`.
- **Synthesis:** Merge new findings into existing topic pages rather than creating duplicates.
```
