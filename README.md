# Pipeline - Data Sovereignty Layer

A personal data operating system built with Tauri, React, and TypeScript.

## Vision

Pipeline is a data sovereignty layer that sits between a user's canonical research system and any external AI/application. It solves the fundamental problem of the current AI landscape: **no one has built the layer that lets users own their data while still leveraging external tools.**

## The 4-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 4: SURFACE (Markdown)                                    │
│  • What the user sees and types                                 │
│  • Plain text, portable, canonical                              │
│  • Obsidian-compatible                                          │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3: STRUCTURE (Navigation)                                │
│  • Pages within pages                                           │
│  • Embeds, backlinks, bidirectional references                  │
│  • Database views (Notion-style)                                │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: LOGIC (Computation)                                   │
│  • SQL queries, aggregations, metrics                           │
│  • Workflow automation                                          │
│  • Template logic                                               │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 1: AI (Intelligence)                                     │
│  • Ambient AI assistance                                        │
│  • The Curator: Persistent semantic memory                      │
│  • Spell check, link suggestions, contradiction detection       │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Desktop App:** Tauri (Rust backend, web frontend)
- **Frontend:** React 19 + TypeScript + Tailwind CSS v4
- **Local Storage:** SQLite for structured data, flat markdown files for content
- **File Format:** Markdown with YAML frontmatter (Obsidian-compatible)

## Features (Phase 1)

- [x] Tauri desktop application scaffold
- [x] File system access layer
- [x] YAML frontmatter parsing (Obsidian-compatible)
- [x] File browser sidebar
- [x] Markdown editor with basic formatting
- [x] 4-layer navigation ribbon
- [x] Wiki-style `[[links]]` support
- [x] Dark theme (black and gold)

## Getting Started

### Prerequisites

- Node.js 18+
- Rust (for Tauri)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run in development mode (web only)
npm run dev

# Run Tauri desktop app (requires Rust)
npm run tauri:dev

# Build for production
npm run tauri:build
```

## File Format

Pipeline uses Obsidian-compatible markdown files with YAML frontmatter:

```markdown
---
uuid: a217dd34-e3df-4787-b077-21387a5057c1
type: note
title: My Note
created: 2026-01-14T10:30:00Z
modified: 2026-01-14T15:45:00Z
version: 1.0.0
status: draft
public: false
access_tier: owner
relationships:
  depends_on:
    - uuid-123
    - uuid-456
---

# Your Markdown Content Here

Regular markdown. [[Wiki links]] work. UUIDs in frontmatter.
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Editor/         # Markdown editor
│   ├── Layout/         # Main layout
│   ├── Ribbon/         # Layer navigation
│   └── Sidebar/        # File browser
├── hooks/              # Custom React hooks
├── lib/                # Core utilities
│   ├── filesystem.ts   # File system operations
│   └── frontmatter.ts  # YAML parsing
├── store/              # State management
│   └── AppContext.tsx  # Global app state
└── types/              # TypeScript types
    ├── node.ts         # Core node types
    └── index.ts        # Type exports

src-tauri/              # Rust backend
├── src/
│   ├── lib.rs          # Plugin initialization
│   └── main.rs         # Entry point
└── Cargo.toml          # Rust dependencies
```

## Core Principles

1. **Local-first:** Files live on disk. Cloud is optional.
2. **Obsidian-compatible:** Standard markdown + YAML.
3. **UUID-anchored:** Everything has identity.
4. **Sovereignty:** User owns data. External apps are guests.
5. **AI-native:** AI is the substrate, not a feature.

## Roadmap

### Phase 1: Core Editor (Current)
- Basic markdown editor with YAML frontmatter
- File browser and navigation
- 4-layer architecture foundation

### Phase 2: Block System
- Database blocks (Notion-style)
- Formula blocks (Excel-style)
- Block type switching

### Phase 3: Logic Layer
- Visual trigger/action builder
- Condition editor
- Automation pipelines

### Phase 4: AI Integration
- API connection panel (Claude/OpenAI/Gemini)
- AI-assisted writing
- The Curator background process

### Phase 5: Pipeline Exchange
- External connection manager
- OAuth flows
- Export translators (Notion, Replit, Canva)
- Intake quarantine UI

## License

MIT

## Author

David Lowe + Claude
