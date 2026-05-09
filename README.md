# ORBIT

ORBIT is a spatial, identity-driven relationship system. You define a personal worldview — your mission, current work, thinking partner preference, and intellectual narrative — and ORBIT uses that identity to surface real, verifiable people you should be in conversation with. Those people are mapped as a persistent orbit around you, moving inward as relationships deepen from awareness to actual conversation. The goal is 100 conversations.

## What it does

You start by writing your identity: what you're building, what you believe, and who you'd want to think alongside. That identity drives two AI-powered discovery modes — Search (you name the domain) and Suggest (ORBIT surfaces who you haven't considered). Every person returned is placed in your orbit at the outermost ring and can be moved inward as you reach out and get responses. The orbit persists across sessions via KV and localStorage, so the spatial record of your relationship-building stays intact.

## What it is not

Not a CRM. Not a sales pipeline. Not a networking automation tool. Not a recommendation feed. Not a messaging or inbox system. ORBIT does not rank people globally, optimize for engagement, or automate any outreach. All interactions are user-initiated.

## The five primitives

**Identity** — A structured representation of the user's worldview. The root of all computation. No system output is valid without it.

**Contact** — A single discovered individual: name, role, a specific why tied to the user's identity, contact link, reachability metadata, stage, and notes.

**Stage** — Relational depth in fixed order: Identified → Reached Out → Replied → Conversation. Movement is always inward and irreversible in meaning.

**Orbit** — The spatial visualization: four concentric rings mapped to Stage, deterministic node positioning via stable hash, centered on Identity. No alternative visual paradigms.

**Interaction** — Any meaningful engagement with a contact: outreach sent, reply received, conversation held, notes updated, stage changed. Always user-initiated.

## The 3E retrieval framework

**Practitioner** — Someone actively doing what you're trying to build, right now. They have direct execution experience and know what breaks. Returned by Suggest when you need ground-level knowledge from someone inside the work.

**Theorist** — Someone who has studied the underlying mechanics at depth: researchers, analysts, people with the conceptual map of your domain. Returned when you need to understand why something works the way it does, not just that it does.

**Connector** — Someone who bridges your work to a larger cultural moment: journalists, public intellectuals, writers who can situate what you're doing inside a broader conversation. Returned when you need to understand where your work fits and who is already framing that territory publicly.

This framework applies to Suggest only. Search returns 6 results without category constraint.

## Tech stack

- Frontend: vanilla HTML/CSS/JS, no framework, no bundler
- API: Vercel serverless functions (Node.js ESM)
- AI: Anthropic Claude (`claude-sonnet-4-20250514`) with web search
- Persistence: Vercel KV (identity + contacts, 90-day TTL), Google Sheets (contact graph, V1)
- Email: Resend

## Principles

The spatial model is fixed — concentric, stage-based, deterministic, centered on Identity.

All discovery is conditioned on Identity. No global or identity-free search.

No leaderboards, scoring systems, or popularity metrics.

Stage order is permanent: Identified → Reached Out → Replied → Conversation.

ORBIT never auto-sends, auto-follows-up, or simulates relationships.

## Status

V1 — single user, invite only. No installation instructions yet. No contribution guide yet.
