# ORBIT — Architecture

## Repo Structure

```
/orbit
  /frontend
    orbit-view.js       # Main visualization shell
    search-view.js      # Search input + results cards
    suggest-view.js     # Proactive suggestion results
    orbit-canvas.js     # The orbital ring rendering engine
    side-panel.js       # Contact detail panel (slides in on node click)

  /api
    search.js           # Anthropic SDK + web_search — runs on SEARCH only
    suggest.js          # Anthropic SDK + web_search — runs on SUGGEST only
    sheets.js           # Google Sheets read/write via Apps Script webhook

  /shared
    prompts.js          # All AI system prompts — versioned here, not inline
    schema.js           # Contact Node + Identity Pack schemas
    stages.js           # Stage definitions and ring mapping
    colors.js           # Color system constants

  /docs
    prd.md
    architecture.md
    design-system.md
    identity-pack.md
    ai-behavior.md

  /data
    mockContacts.json   # Dev/test data

  index.html            # Entry point
  vercel.json           # Route config
```

---

## Architecture Boundaries

### AI runs ONLY at the edges
- `api/search.js` — triggered by user pressing SEARCH
- `api/suggest.js` — triggered by user pressing SUGGEST

### AI does NOT touch
- Orbit rendering
- Stage movement
- Notes
- Visualization positioning
- Any runtime logic

### Everything else is deterministic
- Orbit rendering = local
- Stage movement = local
- Notes = local/Sheets
- Visualization = local, hash-based positioning

---

## Visualization Rules

- Ring assignment = contact's current `status` field
- Angular position = `stableHash(contact.name + contact.id)` — never changes
- Animation offset = deterministic seed from same hash
- Nodes do NOT reposition between sessions
- Users build spatial memory: "she's at 2 o'clock in Replied"

---

## Caching

Every search result stores:
- `search_hash` — hash of query + identity pack
- `created_at` — timestamp

On repeat search: check hash first, return cached if exists.
Prevents: API spam, duplicates, runaway costs.

---

## ENV Variables

```
ANTHROPIC_API_KEY
SHEETS_WEBHOOK_URL
```

---

## Build Sequence (in order)

1. Shared primitives + repo scaffolding
2. OrbitCanvas — visualization only
3. Search + Suggest intelligence layer
4. Sheets persistence wiring

Order is intentional: Orbit model becomes the invariant everything plugs into.
