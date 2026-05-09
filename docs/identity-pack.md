# ORBIT — Identity Pack

The Identity Pack is the core abstraction layer. It is what EWS produces and what ORBIT consumes.

## Schema

```json
{
  "name": "string",
  "mission": "string",
  "north_stars": ["string"],
  "interests": ["string"],
  "worldview": "string",
  "ews_story": "string",
  "voice": "string"
}
```

## V1 Implementation

Hardcoded in `/shared/schema.js` for Mohammad's single-user instance:

```js
export const IDENTITY_PACK = {
  name: "Mohammad Khan",
  mission: "Building the American Science Community Institute...",
  north_stars: ["Royal Institution Lecture", "Oscar for Best Original Screenplay"],
  interests: ["science communication", "systems thinking", "speculative fiction", "fictioneering"],
  worldview: "Uses fiction as a cognitive tool to surface hidden assumptions. Built everything independently. Wants thinking partners, not mentors above him.",
  voice: "Analytical observer. Names things.",
  ews_story: "" // populated at runtime from user paste
}
```

## V2 — Import/Export

Users upload their own identity pack JSON. No accounts. No auth. Portable.

This turns ORBIT into a portable cognition profile — not a social platform.

## EWS Handoff

EWS outputs a story. That story becomes `ews_story` in the Identity Pack.
The button in EWS: "See who's in your ORBIT" passes this value to ORBIT via URL param or clipboard.

Different worldviews produce different relational gravity. That is the long-term product insight.
