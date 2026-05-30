import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@vercel/kv'

const kv = createClient({
  url: process.env.orbit_KV_REST_API_URL,
  token: process.env.orbit_KV_REST_API_TOKEN,
})

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: { 'anthropic-beta': 'web-search-2025-03-05' },
})

const SEARCH_CONSTRAINT = '\n\nUse web search sparingly. Maximum 3 searches total. Do not search more than necessary to verify a person is real.'

function trackTokens(sessionId, inputTokens, outputTokens) {
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { gravityProfile, existingContacts = [], sessionId } = req.body ?? {}
  if (!gravityProfile) return res.status(400).json({ error: 'gravityProfile required' })

  const now = Date.now()

  // KV cache — return cached suggest-orbit results if generated within 24 hours
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

  const systemPrompt = `You are helping someone build their orbit — a curated network of thinkers, practitioners, and connectors relevant to their work.

STEP 1 — EXTRACT DOMAIN TERMS:
Identify specific technical terms, problem spaces, and adjacent fields from the gravity profile below. Extract exact phrases as written in the mission — not generalized categories.

STEP 2 — SEARCH THOSE EXACT TERMS:
Use extracted domain terms as web search queries: "[domain term] author", "[domain term] researcher", "[domain term] thought leader". Search the exact phrases — do not generalize.

STEP 3 — FIND CONTACT INFO:
For each person, search for their public email, LinkedIn URL (full https://linkedin.com/in/... URL), personal website, and any books they've written (title + publisher + year).

Suggest 3 real, verifiable people based on the gravity profile. Use web search to confirm they exist and are active. Exclude anyone in the existing contacts list.

Return ONLY a valid JSON array. No markdown, no prose, no preamble:
[{
  "name": "...",
  "role": "...",
  "reason": "...",
  "url": "...",
  "email": "",
  "linkedin": "",
  "website": "",
  "books": [{"title": "", "publisher": "", "year": ""}],
  "contact_note": ""
}]

reason must be one sentence referencing something specific in the gravity profile.
email/linkedin/website/contact_note should be empty string if not found.
books should be empty array [] if no books found.

Gravity profile:
${JSON.stringify(gravityProfile)}${exclusionStr}${SEARCH_CONSTRAINT}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
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

    // Cache and track tokens (fire and forget)
    if (sessionId) {
      kv.set(`orbit:suggest-orbit:results:${sessionId}`, { data: parsed, _ts: now }, { ex: 86400 }).catch(() => {})
    }
    if (response.usage) {
      trackTokens(sessionId, response.usage.input_tokens || 0, response.usage.output_tokens || 0)
    }

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('[suggest-orbit]', err)
    return res.status(500).json({ error: 'Suggest failed', detail: err.message })
  }
}
