# ORBIT — System Contract

This document defines the invariant structure of ORBIT.
It is the highest-level specification in the system.
It is the first document every Claude Code session must read.

All implementation, prompts, UI decisions, and data models must conform to this contract.

If a proposed change cannot be mapped to one of the five primitives, it does not belong in ORBIT.

---

# 1. WHAT ORBIT IS

ORBIT is a **spatial identity-driven relationship system**.

It allows a user to:
- Define a personal intellectual identity (via narrative + intent)
- Discover people aligned with that identity using AI-assisted retrieval
- Map those people in a spatial orbit of relational proximity
- Track relationship depth over time (from awareness → conversation)
- Preserve relational trajectory as a persistent cognitive artifact

ORBIT is fundamentally about:

> How a worldview shapes who you should be in conversation with.

It is not a tool for managing people.
It is a tool for shaping intellectual proximity.

---

# 2. WHAT ORBIT IS NOT

ORBIT is explicitly NOT:

- A CRM
- A sales pipeline system
- A social media platform
- A networking automation tool
- A messaging or inbox system
- A follower graph or popularity tracker
- A productivity or task management tool
- A recommendation feed optimized for engagement
- A growth hacking or outreach automation engine

ORBIT does NOT optimize for:
- Virality
- Engagement metrics
- Conversion rates
- Follower counts
- Social validation loops

ORBIT does NOT attempt to:
- Replace human judgment
- Automate relationships
- Rank people globally

---

# 3. THE FIVE IMMUTABLE PRIMITIVES

The entire system is built on five primitives.
These must never be removed or redefined.

## Primitive 1 — Identity
A structured representation of a user's worldview.

Includes:
- name
- mission
- current work
- desired reputation
- thinking partner preference
- EWS narrative (Early Warning System story)

Identity defines the lens through which all discovery occurs.
No system output is valid without referencing Identity.

---

## Primitive 2 — Contact
A single discovered individual in the system.

Includes:
- name
- role
- why they matter (specific contextual relevance to Identity — never generic)
- contact link + platform
- reachability metadata (contact_method, contact_url, reachability_notes)
- stage
- notes
- interaction_log

Contacts are not leads. They are potential thinking partners.

---

## Primitive 3 — Stage
The relational depth of a Contact relative to the user.

Stages (in fixed order):
1. Identified
2. Reached Out
3. Replied
4. Conversation

Stage represents proximity, not status.
Movement is always inward. This order is irreversible in meaning.
Goal: 100 Conversations.

---

## Primitive 4 — Orbit
The spatial representation of all Contacts relative to Identity.

Defined as:
- Concentric rings mapped to Stage (Ring 4 = Identified, Ring 1 = Conversation)
- Deterministic node positioning: angle = stableHash(name + id) % 360
- Stable spatial memory across sessions — nodes never reposition
- Centered on Identity

Orbit is the core visualization. It encodes relational proximity spatially.
No alternative visual paradigms (lists, feeds, grids) may replace it.

---

## Primitive 5 — Interaction
Any meaningful engagement with a Contact.

Includes:
- Outreach sent
- Reply received
- Conversation held
- Notes updated
- Stage changed

Interactions form the historical trajectory of relationships.
All interactions must be user-initiated. ORBIT never acts automatically.

---

# 4. THE 3E RETRIEVAL FRAMEWORK

All AI-powered suggestion (SUGGEST) returns exactly 9 contacts: 3 per category.

## PRACTITIONER
Someone actively doing what the user is trying to build — right now.
Execution experience. Direct knowledge of what breaks.

## THEORIST
Someone who has studied the underlying mechanics deeply.
Academic, research, or analytical depth relevant to the user's domain.

## CONNECTOR
Someone who bridges the user's work to a bigger cultural moment.
Journalists, public intellectuals, writers who contextualize why the work matters now.

This framework applies to SUGGEST only. SEARCH returns 6 results without category constraint.

All returned contacts must:
- Verifiably exist (confirmed via web search)
- Have a specific "why" tied to the user's Identity or EWS story — never generic
- Include reachability metadata

---

# 5. WHAT CAN NEVER CHANGE

## 5.1 Spatial Model Invariance
The orbital model must remain concentric, stage-based, deterministic, and centered on Identity.

## 5.2 Identity-Centric Discovery
All discovery is conditioned on Identity. No global or identity-free search is allowed.

## 5.3 Proximity Over Ranking
No leaderboards, scoring systems, or popularity metrics. Ever.

## 5.4 Stage Hierarchy Stability
Identified → Reached Out → Replied → Conversation. This order is permanent.

## 5.5 Non-Automation Principle
ORBIT must not auto-send messages, auto-follow-up, or simulate relationships.
All interactions are user-initiated.

## 5.6 Identity as Root State
Identity is the root of all computation. No valid output exists without it.

## 5.7 AI at the Edges Only
AI runs only when the user triggers SEARCH or SUGGEST.
Orbit rendering, stage movement, notes, and visualization are always deterministic.

---

# 6. ORBIT_STATE — CANONICAL STATE OBJECT

All system state must be derivable from ORBIT_STATE.

```js
ORBIT_STATE = {
  sessionId,      // anonymous UUID, persisted in localStorage + KV
  identityPack,   // active user worldview — root of all computation
  contacts[],     // all Contact objects with full schema
  uiState,        // ephemeral: activeView, selectedContactId, modal states, admin flags
  interactionLog  // chronological log of stage changes, notes, outreach — trajectory record
}
```

### identityPack schema
```js
{
  name: '',
  mission: '',
  currentWork: '',
  desiredReputation: '',
  thinkingPartnerProfile: '',
  ewsStory: ''
}
```

### Contact schema
```js
{
  id: '',                  // crypto.randomUUID()
  name: '',
  role: '',
  why: '',                 // specific to Identity — never generic
  url: '',
  platform: '',            // 'substack' | 'linkedin' | 'twitter' | 'website'
  contact_method: '',      // 'linkedin_dm' | 'substack_comment' | 'email' | 'contact_form' | 'twitter'
  contact_url: '',
  reachability_notes: '',
  status: '',              // must match a STAGES key
  notes: '',
  interaction_log: [],     // reserved — future trajectory use
  category: '',            // 'PRACTITIONER' | 'THEORIST' | 'CONNECTOR' | null
  date_added: '',
  search_hash: '',
  created_at: ''
}
```

---

# 7. PERSISTENCE LAYERS

```
localStorage     — session continuity, offline fallback
Vercel KV        — cross-device identity + orbit persistence
                   Keys: orbit:identity:{sessionId}, orbit:contacts:{sessionId}
                   TTL: 90 days
Google Sheets    — contact graph (V1 persistence layer)
```

No authentication. Session ID is identity.
KV is source of truth. localStorage is fallback.

---

# 8. THE CLOSED LOOP

ORBIT guarantees this feedback loop is never broken:

> Identity → Discovery → Orbit → Interaction → Identity

Identity shapes discovery.
Discovery shapes orbit.
Orbit shapes interaction memory.
Interaction memory refines identity over time.

---

# 9. FINAL PRINCIPLE

ORBIT is not a tool for managing people.

ORBIT is a tool for shaping the space around a mind.

All design, implementation, and evolution must preserve that distinction.