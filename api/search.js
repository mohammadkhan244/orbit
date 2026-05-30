import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'crypto'
import { createClient } from '@vercel/kv'
import { IDENTITY_PACK } from '../shared/schema.js'
import { SEARCH_SYSTEM_PROMPT } from '../shared/prompts.js'

const kv = createClient({
  url: process.env.orbit_KV_REST_API_URL,
  token: process.env.orbit_KV_REST_API_TOKEN,
})

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: { 'anthropic-beta': 'web-search-2025-03-05' },
})

const recentHashes = new Map()

function hashStr(str) {
  return createHash('sha256').update(str).digest('hex').slice(0, 16)
}

const SEARCH_CONSTRAINT = '\n\nUse web search sparingly. Maximum 3 searches total. Do not search more than necessary to verify a person is real.'

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
  kv.incrby('orbit:tokens:feature:search', total).catch(() => {})
  kv.incr('orbit:tokens:count:search').catch(() => {})
  kv.get(`orbit:tokens:summary:${sid}`).then(s => {
    const summary = s || { sessionId: sid, totalInput: 0, totalOutput: 0, searches: 0, suggests: 0, suggestOrbits: 0 }
    summary.totalInput += inputTokens
    summary.totalOutput += outputTokens
    summary.searches = (summary.searches || 0) + 1
    return kv.set(`orbit:tokens:summary:${sid}`, summary)
  }).catch(() => {})
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { query = '', ewsStory = '', identityPack: clientIdentityPack, isGuest, sessionId } = req.body ?? {}
  if (!query.trim()) return res.status(400).json({ error: 'query is required' })

  const search_hash = hashStr(query + ewsStory)
  const now = Date.now()
  const last = recentHashes.get(search_hash)
  if (last && now - last < 60_000) {
    return res.status(429).json({ error: 'Duplicate query. Try again in 60 seconds.' })
  }
  recentHashes.set(search_hash, now)

  // KV cache — return cached result for this exact query+session within 24 hours
  const cacheKey = sessionId ? `orbit:search:results:${sessionId}:${search_hash}` : null
  if (cacheKey) {
    try {
      const cached = await kv.get(cacheKey)
      if (cached && cached._ts && now - cached._ts < 86_400_000) {
        console.log('[search] returning cached results for', sessionId, search_hash)
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

  const systemPrompt = (SEARCH_SYSTEM_PROMPT + SEARCH_CONSTRAINT)
    .replace('[USER_NAME]', slimIdentity.name || 'the user')
    .replace('[IDENTITY_PACK]', JSON.stringify(slimIdentity))
    .replace('[EWS_STORY]', slimIdentity.ews_story)
    .replace('[USER_QUERY]', query.trim())

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: 'Search and return results as instructed.' }],
    })

    const raw = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      const start = raw.indexOf('{')
      const end = raw.lastIndexOf('}')
      if (start === -1 || end === -1) throw new Error('No JSON found in response')
      parsed = JSON.parse(raw.slice(start, end + 1))
    }
    parsed.people?.forEach(p => { p.id = crypto.randomUUID() })

    // Cache and track tokens (fire and forget)
    if (cacheKey) {
      kv.set(cacheKey, { ...parsed, _ts: now }, { ex: 86400 }).catch(() => {})
    }
    if (response.usage) {
      trackTokens(sessionId, 'search', response.usage.input_tokens || 0, response.usage.output_tokens || 0)
    }

    kv.incr('stats:search:total').catch(() => {})
    if (isGuest) kv.incr('stats:guests:total').catch(() => {})
    return res.status(200).json({ ...parsed, search_hash })
  } catch (err) {
    console.error('[search]', err)
    return res.status(500).json({ error: 'Search failed', detail: err.message })
  }
}
