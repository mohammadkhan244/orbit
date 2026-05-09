# ORBIT — Product Requirements Document

## Vision

ORBIT is a personal relationship cartography tool. It maps proximity, not activity.

The AI populates the system. It is not the system.

The core artifact is the orbit map itself — it exists and persists without any AI calls.

---

## The 5 Immutable Primitives

Everything in ORBIT derives from these. Nothing gets added without mapping to one of them.

```
Person
Stage
Orbit
Search
Conversation
```

---

## Product Stack (Modern Myths umbrella)

```
EWS (Early Warning System)
        ↓
Identity Pack (the handoff)
        ↓
ORBIT (discovery + mapping)
```

EWS story is not "context enhancement." It is the core abstraction layer.
The Identity Pack is the formal data structure of that story.

---

## Data Schemas

### Identity Pack (static-ish)
```json
{
  "name": "",
  "mission": "",
  "north_stars": [],
  "interests": [],
  "worldview": "",
  "ews_story": "",
  "voice": ""
}
```

### Contact Node (dynamic)
```json
{
  "name": "",
  "role": "",
  "why": "",
  "url": "",
  "platform": "",
  "status": "",
  "notes": "",
  "last_interaction": "",
  "date_added": "",
  "source": "",
  "search_hash": "",
  "created_at": ""
}
```

---

## Stages (the 4 rings)

```
Ring 4 (outermost) = Identified
Ring 3             = Reached Out
Ring 2             = Replied
Ring 1 (innermost) = Conversation
```

Movement is always inward. Getting someone closer to center is the goal.

---

## Success Criteria

- User reaches 100 conversations
- Orbit persists and feels spatially familiar across sessions
- AI results feel personally relevant, not generic
- The map exists without AI — AI is fuel, not foundation

---

## Constraints (non-negotiable)

- Color system: `#0a0a0a` bg, `#f0ece4` text, `#b87333` copper accent, rgba variants only
- No green, no purple
- Typography: Courier Prime (headers), DM Sans (body)
- Visualization is deterministic: ring = status, angle = stable hash of name/id
- Nodes do not reposition between sessions
- AI runs only on SEARCH and SUGGEST — nowhere else
- No auth in V1 — Google Sheets + email-gated or paste-in identity
- Do not prematurely add database complexity

---

## What ORBIT is NOT

- Not LinkedIn-lite
- Not a CRM
- Not an AI social dashboard
- Not dependent on AI to function

---

## Persistence Roadmap

- V1: Google Sheets via Apps Script webhook
- V2: SQLite/Turso/Supabase — only after real usage proves the need
