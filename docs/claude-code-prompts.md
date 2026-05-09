# ORBIT — Claude Code Prompts
# Paste in order. Complete each before starting the next.

---

## PROMPT 1 — Scaffold + Shared Primitives

Read /docs/architecture.md and /docs/prd.md before writing any code.

Scaffold the full repo structure exactly as defined in architecture.md. Then implement the /shared layer:

**Files to create:**
- /shared/colors.js
- /shared/stages.js
- /shared/schema.js
- /shared/prompts.js
- /data/mockContacts.json
- vercel.json
- index.html (shell only — nav, view containers, no view logic yet)

**colors.js** must export:
```js
export const COLORS = {
  bg: '#0a0a0a',
  text: '#f0ece4',
  accent: '#b87333'
}
```

**stages.js** must export:
```js
export const STAGES = {
  IDENTIFIED: { label: 'Identified', ring: 4 },
  REACHED_OUT: { label: 'Reached Out', ring: 3 },
  REPLIED: { label: 'Replied', ring: 2 },
  CONVERSATION: { label: 'Conversation', ring: 1 }
}
```

**schema.js** must export IDENTITY_PACK (hardcoded, see /docs/identity-pack.md) and empty CONTACT_NODE template.

**prompts.js** must export SEARCH_SYSTEM_PROMPT and SUGGEST_SYSTEM_PROMPT as strings (see /docs/ai-behavior.md). Prompts use [IDENTITY_PACK] and [USER_QUERY] as interpolation placeholders.

**mockContacts.json** — 6 fake contacts distributed across all 4 stages.

**vercel.json** — routes /api/* to serverless functions.

**index.html** — shell with: top nav (ORBIT wordmark in Courier Prime, three nav links: ORBIT / SEARCH / SUGGEST), view containers (id="orbit-view", id="search-view", id="suggest-view"), Google Fonts import for Courier Prime + DM Sans, CSS variables from colors.js, base dark styles. No view logic yet.

Do not create any /api or /frontend files yet.
Do not write any AI call logic.
Acceptance: repo structure matches architecture.md exactly. Shared layer is complete and importable.

---

## PROMPT 2 — OrbitCanvas (Visualization Only)

Read /docs/design-system.md and /shared/stages.js and /shared/colors.js and /data/mockContacts.json before writing any code.

Files you may edit: /frontend/orbit-canvas.js, /frontend/orbit-view.js, /frontend/side-panel.js, index.html (view container only)
Files you may NOT edit: anything in /shared, /api, /docs, vercel.json

Build the orbital visualization using the mockContacts.json data.

**orbit-canvas.js** — SVG or Canvas renderer:
- Center circle: 40px, copper glow (#b87333), label "ORBIT" in Courier Prime
- 4 concentric rings, evenly spaced, labeled Conversation / Replied / Reached Out / Identified
- Ring assignment = contact's `status` field mapped via STAGES
- Angular position = stableHash(contact.name + contact.id) % 360 — deterministic, never changes
- Animation offset = (stableHash(contact.name) % 20) — subtle pulse variation
- Nodes: 32px circles, initials, default copper glow, hover brighter pulse
- On node click: dispatch custom event "orbit:node-selected" with contact data

**stableHash function** — simple deterministic string-to-integer. No external library.

**side-panel.js** — listens for "orbit:node-selected":
- Slides in from right (CSS transition, 300ms)
- Shows: name, role, why, link (as anchor), platform badge, notes textarea, stage selector (dropdown), date added
- On stage change: dispatches "orbit:stage-changed" with contact id and new stage
- On notes blur: dispatches "orbit:notes-updated"

**orbit-view.js** — assembles canvas + side panel:
- Progress bar top: "X / 100 conversations" — counts contacts with status CONVERSATION
- Renders OrbitCanvas with contact data
- Listens for stage-changed and notes-updated events, updates local state, re-renders canvas

Load mockContacts.json for dev. No API calls. No Sheets calls.

Do not modify /shared files.
Do not create search or suggest views.
Acceptance: visualization renders with mock data, nodes are stable on refresh, side panel opens on click, stage changes move node to correct ring.

---

## PROMPT 3 — Search + Suggest Intelligence Layer

Read /docs/ai-behavior.md and /shared/prompts.js and /shared/schema.js before writing any code.

Files you may edit: /api/search.js, /api/suggest.js, /frontend/search-view.js, /frontend/suggest-view.js, index.html (view containers only)
Files you may NOT edit: anything in /shared, /frontend/orbit-canvas.js, /frontend/orbit-view.js, /frontend/side-panel.js, /docs, vercel.json

**api/search.js** — Vercel serverless function:
- Receives POST body: { query, ewsStory }
- Builds system prompt from SEARCH_SYSTEM_PROMPT, interpolates IDENTITY_PACK + query + ewsStory if present
- Calls Anthropic SDK: model claude-sonnet-4-20250514, max_tokens 2000, web_search tool enabled
- Parses response per /docs/ai-behavior.md parsing block
- Returns { people: [...] }
- Compute search_hash = hash(query + ewsStory). Return 429 if identical hash called within 60 seconds.

**api/suggest.js** — same pattern, no query param, uses SUGGEST_SYSTEM_PROMPT.

**search-view.js**:
- Textarea: "Describe who you're looking for" (placeholder)
- Optional textarea: "Paste your EWS story for deeper results" (collapsed by default, toggle link)
- SEARCH button — POST to /api/search, show loading state
- Results: cards with name, role, why, link, platform badge, [+ Add to ORBIT] button
- On [+ Add to ORBIT]: dispatches "orbit:contact-added" with contact data

**suggest-view.js**:
- Single button: "Who should I reach out to?"
- Same card pattern as search-view
- POST to /api/suggest

Do not modify the visualization layer.
Do not add any AI logic outside /api files.
Acceptance: search returns real people, suggest returns proactive list, cards render correctly, add-to-orbit event fires with correct data shape matching CONTACT_NODE schema.

---

## PROMPT 4 — Sheets Persistence Wiring

Read /docs/architecture.md and /shared/schema.js before writing any code.

Files you may edit: /api/sheets.js, /frontend/orbit-view.js (load + event wiring only), index.html (initialization only)
Files you may NOT edit: /shared, /frontend/orbit-canvas.js, /frontend/side-panel.js, /frontend/search-view.js, /frontend/suggest-view.js, /api/search.js, /api/suggest.js, /docs, vercel.json

**api/sheets.js** — three operations via Apps Script webhook (env: SHEETS_WEBHOOK_URL):
- GET /api/sheets — fetch all contacts, return as array of CONTACT_NODE objects
- POST /api/sheets — add new contact row
- PATCH /api/sheets — update existing row by name (status or notes fields only)

Sheet columns (exact order): name, role, why, url, platform, status, notes, date_added, search_hash, created_at

**orbit-view.js additions** (do not rewrite, only add):
- On mount: GET /api/sheets, replace mockContacts with real data, re-render canvas
- Listen for "orbit:contact-added": POST to /api/sheets, add node to canvas
- Listen for "orbit:stage-changed": PATCH /api/sheets, update node ring
- Listen for "orbit:notes-updated": PATCH /api/sheets, update notes

Include in README:
- ENV var setup (ANTHROPIC_API_KEY, SHEETS_WEBHOOK_URL)
- Full Apps Script webhook code to paste into Google Sheets (handles GET/POST/PATCH by action param)
- Note: paste EWS story into search view for personalized discovery

Do not modify any AI logic.
Do not modify visualization rendering.
Acceptance: contacts persist across page refresh, new contacts appear on canvas after add, stage changes persist, notes persist.
