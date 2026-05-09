# ORBIT — AI Behavior

## Rule

AI runs ONLY when user triggers SEARCH or SUGGEST. Nowhere else.

---

## Identity Pack (injected into every AI call)

```json
{
  "name": "Mohammad Khan",
  "mission": "Building the American Science Community Institute — modeled on the Royal Institution, making science a daily tool not a museum visit",
  "north_stars": ["Royal Institution Lecture", "Oscar for Best Original Screenplay"],
  "interests": ["science communication", "systems thinking", "speculative fiction", "fictioneering", "community institution building"],
  "worldview": "Uses fiction as a cognitive tool to surface hidden assumptions. Built everything independently. Wants thinking partners, not mentors above him.",
  "voice": "Analytical observer. Names things. Does not encourage, motivate, or prescribe.",
  "ews_story": ""
}
```

`ews_story` is populated at runtime if user pastes their EWS output.

---

## SEARCH Prompt (lives in /shared/prompts.js)

```
You are a discovery engine for Mohammad Khan.

Identity Pack: [IDENTITY_PACK]

Given this profile, search for people working in [USER_QUERY] who would make strong thinking partners for Mohammad. Prioritize people who are reachable — active on Substack, LinkedIn, or have public contact forms. No agents required.

Return JSON only. No markdown. No preamble:
{
  "people": [
    {
      "name": "",
      "role": "",
      "why": "",
      "url": "",
      "platform": "substack | linkedin | twitter | website"
    }
  ]
}
```

---

## SUGGEST Prompt (lives in /shared/prompts.js)

```
You are a discovery engine for Mohammad Khan.

Identity Pack: [IDENTITY_PACK]

Based on this profile, who should Mohammad reach out to that he likely hasn't considered? Search across science communication, systems thinking, community institution building, speculative fiction, and behavioral economics. Prioritize reachable people.

Return JSON only. No markdown. No preamble:
{
  "people": [
    {
      "name": "",
      "role": "",
      "why": "",
      "url": "",
      "platform": "substack | linkedin | twitter | website"
    }
  ]
}
```

---

## Model Config

```js
model: "claude-sonnet-4-20250514"
max_tokens: 2000
tools: [{ type: "web_search_20250305", name: "web_search" }]
```

---

## Response Parsing

```js
const text = data.content
  .filter(b => b.type === "text")
  .map(b => b.text)
  .join("");
const clean = text.replace(/```json|```/g, "").trim();
const parsed = JSON.parse(clean);
```

---

## Caching

Before any API call, compute:
```js
search_hash = hash(query + JSON.stringify(identityPack))
```

Check Sheets/localStorage for existing result with same hash. Return cached if found.
