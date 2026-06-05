import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'crypto'
import { createClient } from '@vercel/kv'
import { IDENTITY_PACK } from '../shared/schema.js'
import { SUGGEST_SYSTEM_PROMPT } from '../shared/prompts.js'

const kv = createClient({
  url: process.env.orbit_KV_REST_API_URL,
  token: process.env.orbit_KV_REST_API_TOKEN,
})

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: { 'anthropic-beta': 'web-search-2025-03-05' },
})

const recentHashes = new Map()

function trackOrbitTokens(sessionId, inputTokens, outputTokens) {
  const sid = sessionId || 'guest'
  const total = inputTokens + outputTokens
  kv.set(`orbit:tokens:${sid}:suggest-orbit:${Date.now()}`, {
    input_tokens: inputTokens, output_tokens: outputTokens,
    total_tokens: total, feature: 'suggest-orbit', sessionId: sid,
    date: new Date().toISOString(),
  }, { ex: 7776000 }).catch(() => {})
  kv.incrby('orbit:tokens:total:input', inputTokens).catch(() => {})
  kv.incrby('orbit:tokens:total:output', outputTokens).catch(() => {})
  kv.incrby('orbit:tokens:feature:suggest-orbit', total).catch(() => {})
  kv.incr('orbit:tokens:count:suggest-orbit').catch(() => {})
  kv.get(`orbit:tokens:summary:${sid}`).then(s => {
    const summary = s || { sessionId: sid, totalInput: 0, totalOutput: 0, searches: 0, suggests: 0, suggestOrbits: 0 }
    summary.totalInput += inputTokens
    summary.totalOutput += outputTokens
    summary.suggestOrbits = (summary.suggestOrbits || 0) + 1
    return kv.set(`orbit:tokens:summary:${sid}`, summary)
  }).catch(() => {})
}

function hashStr(str) {
  return createHash('sha256').update(str).digest('hex').slice(0, 16)
}

const SEARCH_CONSTRAINT = '\n\nUse web search sparingly. Maximum 3 searches total. Do not search more than necessary to verify a person is real.'

async function extractSynonyms(profileText) {
  try {
    const r = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: 'You are a vocabulary expander. Given a profile, extract 4-5 alternative terms or phrases that describe the same domain. Return ONLY a JSON array of strings. No markdown, no preamble. Example: ["narrative prototyping", "futures literacy", "scenario fiction", "speculative strategy"]',
      messages: [{ role: 'user', content: profileText }],
    })
    const text = r.content.find(b => b.type === 'text')?.text || ''
    const start = text.indexOf('[')
    const end = text.lastIndexOf(']')
    if (start === -1 || end === -1) return []
    const arr = JSON.parse(text.slice(start, end + 1))
    return Array.isArray(arr) ? arr.filter(s => typeof s === 'string') : []
  } catch {
    return []
  }
}

function trackTokens(sessionId, feature, inputTokens, outputTokens) {
  const sid = sessionId || 'guest'
  const total = inputTokens + outputTokens
  kv.set(`orbit:tokens:${sid}:${feature}:${Date.now()}`, {
    input_tokens: inputTokens, output_tokens: outputTokens,
    total_tokens: total, feature, sessionId: sid,
    date: new Date().toISOString(),
  }, { ex: 7776000 }).catch(() => {})
  kv.incrby('orbit:tokens:total:input', inputTokens).catch(() => {})
  kv.incrby('orbit:tokens:total:output', outputTokens).catch(() => {})
  kv.incrby('orbit:tokens:feature:suggest', total).catch(() => {})
  kv.incr('orbit:tokens:count:suggest').catch(() => {})
  kv.get(`orbit:tokens:summary:${sid}`).then(s => {
    const summary = s || { sessionId: sid, totalInput: 0, totalOutput: 0, searches: 0, suggests: 0, suggestOrbits: 0 }
    summary.totalInput += inputTokens
    summary.totalOutput += outputTokens
    summary.suggests = (summary.suggests || 0) + 1
    return kv.set(`orbit:tokens:summary:${sid}`, summary)
  }).catch(() => {})
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // ── orbit mode (was suggest-orbit.js) ────────────────────────────────────
  if ((req.body ?? {}).mode === 'orbit') {
    const { gravityProfile, existingContacts = [], sessionId } = req.body ?? {}
    if (!gravityProfile) return res.status(400).json({ error: 'gravityProfile required' })

    const now = Date.now()

    if (sessionId) {
      try {
        const cached = await kv.get(`orbit:suggest-orbit:results:${sessionId}`)
        if (cached && cached._ts && now - cached._ts < 86_400_000) {
          console.log('[suggest-orbit] returning cached results for', sessionId)
          return res.status(200).json(cached.data)
        }
      } catch {}
    }

    const exclusionStr = existingContacts.length > 0
      ? `\n\nExclude these people already in the user's orbit: ${existingContacts.join(', ')}.`
      : ''

    const orbitSystemPrompt = `You are helping someone build their orbit — a curated network of thinkers, practitioners, and connectors relevant to their work.

STEP 1 — EXTRACT DOMAIN TERMS:
Identify specific technical terms, problem spaces, and adjacent fields from the gravity profile below. Extract exact phrases as written in the mission — not generalized categories.

STEP 2 — SEARCH THOSE EXACT TERMS:
Use extracted domain terms as web search queries: "[domain term] author", "[domain term] researcher", "[domain term] thought leader". Search the exact phrases — do not generalize.

STEP 3 — FIND CONTACT INFO:
For each person, search for their public email, LinkedIn URL (full https://linkedin.com/in/... URL), personal website, and any books they've written (title + publisher + year).

Suggest exactly 3 real, verifiable people — one per tier:
1. LEARN FROM (tier: "learn"): Established, published, further along. Worth following even if hard to reach directly.
2. THINK WITH (tier: "think"): Active, reachable, at a similar stage. A peer working on adjacent problems right now.
3. SHARE WITH (tier: "share"): Earlier in the journey. Emerging, would benefit from this perspective.

Use web search to confirm they exist and are active. Exclude anyone in the existing contacts list.
Return in order: learn first, think second, share third.

Return ONLY a valid JSON array. No markdown, no prose, no preamble:
[{
  "name": "...",
  "role": "...",
  "reason": "...",
  "tier": "learn | think | share",
  "url": "...",
  "email": "",
  "linkedin": "",
  "website": "",
  "books": [{"title": "", "publisher": "", "year": ""}],
  "contact_note": ""
}]

reason must be one sentence referencing something specific in the gravity profile.
tier must be exactly "learn", "think", or "share".
email/linkedin/website/contact_note should be empty string if not found.
books should be empty array [] if no books found.

Gravity profile:
${JSON.stringify(gravityProfile)}${exclusionStr}${SEARCH_CONSTRAINT}`

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: orbitSystemPrompt,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: 'Return the JSON array only. No prose.' }],
      })

      const raw = response.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('')

      const start = raw.indexOf('[')
      const end = raw.lastIndexOf(']')
      if (start === -1 || end === -1) throw new Error('No JSON array in response')
      const parsed = JSON.parse(raw.slice(start, end + 1))

      if (sessionId) {
        kv.set(`orbit:suggest-orbit:results:${sessionId}`, { data: parsed, _ts: now }, { ex: 86400 }).catch(() => {})
      }
      if (response.usage) {
        trackOrbitTokens(sessionId, response.usage.input_tokens || 0, response.usage.output_tokens || 0)
      }

      return res.status(200).json(parsed)
    } catch (err) {
      console.error('[suggest-orbit]', err)
      return res.status(500).json({ error: 'Suggest failed', detail: err.message })
    }
  }
  // ── end orbit mode ────────────────────────────────────────────────────────

  const { ewsStory = '', identityPack: clientIdentityPack, isGuest, sessionId } = req.body ?? {}

  const search_hash = hashStr('suggest' + ewsStory)
  const now = Date.now()
  const last = recentHashes.get(search_hash)
  if (last && now - last < 60_000) {
    return res.status(429).json({ error: 'Already fetched suggestions. Wait 60 seconds.' })
  }
  recentHashes.set(search_hash, now)

  // KV cache — return cached suggest results if generated within 24 hours
  if (sessionId) {
    try {
      const cached = await kv.get(`orbit:suggest:results:${sessionId}`)
      if (cached && cached._ts && now - cached._ts < 86_400_000) {
        console.log('[suggest] returning cached results for', sessionId)
        return res.status(200).json({ ...cached, search_hash, _cached: true })
      }
    } catch {}
  }

  const identityPack = {
    ...(clientIdentityPack || IDENTITY_PACK),
    ...(ewsStory ? { ews_story: ewsStory } : {}),
  }
  const slimIdentity = {
    name: identityPack.name,
    mission: identityPack.mission,
    worldview: identityPack.worldview,
    north_stars: identityPack.north_stars,
    ews_story: identityPack.ews_story || '',
  }

  const profileText = [slimIdentity.mission, slimIdentity.worldview, slimIdentity.ews_story].filter(Boolean).join(' ')
  const synonyms = await extractSynonyms(profileText)
  const synonymInjection = synonyms.length > 0
    ? `\n\nSearch using ALL of the following terms, not just the literal profile text: ${synonyms.join(', ')}. The user may not know these terms themselves — that is why you must search them.`
    : ''

  const systemPrompt = (SUGGEST_SYSTEM_PROMPT + SEARCH_CONSTRAINT + synonymInjection)
    .replace('[USER_NAME]', slimIdentity.name || 'the user')
    .replace('[IDENTITY_PACK]', JSON.stringify(slimIdentity))
    .replace('[EWS_STORY]', slimIdentity.ews_story)

  try {
    const messages = [{ role: 'user', content: 'Return the JSON only. No prose.' }]
    let finalText = null
    let iterations = 0
    let lastStopReason = null
    let totalInputTokens = 0
    let totalOutputTokens = 0
    const MAX_ITERATIONS = 3

    while (iterations < MAX_ITERATIONS) {
      iterations++

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages,
      })

      const { stop_reason, content, usage } = response
      lastStopReason = stop_reason
      if (usage) {
        totalInputTokens += usage.input_tokens || 0
        totalOutputTokens += usage.output_tokens || 0
      }
      const blockTypes = content.map(b => b.type).join(', ')
      console.log(`[suggest] iter=${iterations} stop_reason=${stop_reason} blocks=[${blockTypes}] tokens=${JSON.stringify(usage)}`)

      messages.push({ role: 'assistant', content })

      const textBlock = content.find(b => b.type === 'text')
      if (textBlock) {
        finalText = textBlock.text
        break
      }

      if (stop_reason === 'pause_turn' || stop_reason === 'tool_use') {
        const toolResults = content.filter(b =>
          b.type === 'web_search_tool_result' || b.type === 'server_tool_use'
        )
        if (toolResults.length === 0) break
        continue
      }

      break
    }

    if (!finalText) {
      throw new Error(`No text block after ${iterations} iterations. last stop_reason=${lastStopReason}`)
    }

    console.log('[suggest] finalText length:', finalText.length, 'preview:', finalText.slice(0, 200))

    const start = finalText.indexOf('{')
    const end = finalText.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('No JSON object found in response. Raw: ' + finalText.slice(0, 300))
    const parsed = JSON.parse(finalText.slice(start, end + 1))
    parsed.people?.forEach(p => { if (!p.id) p.id = crypto.randomUUID() })

    // Cache results and track tokens (fire and forget)
    if (sessionId) {
      kv.set(`orbit:suggest:results:${sessionId}`, { ...parsed, synonyms, _ts: now }).catch(() => {})
    }
    trackTokens(sessionId, 'suggest', totalInputTokens, totalOutputTokens)

    kv.incr('stats:suggest:total').catch(() => {})
    if (isGuest) kv.incr('stats:guests:total').catch(() => {})
    return res.status(200).json({ ...parsed, search_hash, synonyms })
  } catch (err) {
    console.error('[suggest]', err)
    return res.status(500).json({ error: 'Suggest failed', detail: err.message })
  }
}
