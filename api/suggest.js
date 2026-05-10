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

function hashStr(str) {
  return createHash('sha256').update(str).digest('hex').slice(0, 16)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { ewsStory = '', identityPack: clientIdentityPack, isGuest } = req.body ?? {}

  const search_hash = hashStr('suggest' + ewsStory)
  const now = Date.now()
  const last = recentHashes.get(search_hash)
  if (last && now - last < 60_000) {
    return res.status(429).json({ error: 'Already fetched suggestions. Wait 60 seconds.' })
  }
  recentHashes.set(search_hash, now)

  // identityPack from client takes precedence; hardcoded is fallback only
  const identityPack = {
    ...(clientIdentityPack || IDENTITY_PACK),
    ...(ewsStory ? { ews_story: ewsStory } : {}),
  }
  // Slim identity — only what Claude needs
  const slimIdentity = {
    name: identityPack.name,
    mission: identityPack.mission,
    worldview: identityPack.worldview,
    north_stars: identityPack.north_stars,
    ews_story: identityPack.ews_story || ''
  }

  const systemPrompt = SUGGEST_SYSTEM_PROMPT
    .replace('[USER_NAME]', slimIdentity.name || 'the user')
    .replace('[IDENTITY_PACK]', JSON.stringify(slimIdentity))
    .replace('[EWS_STORY]', slimIdentity.ews_story)

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: 'Return the JSON only. No prose.' }],
    })

    const raw = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('No JSON found in response')
    const parsed = JSON.parse(raw.slice(start, end + 1))

    kv.incr('stats:suggest:total').catch(() => {})
    if (isGuest) kv.incr('stats:guests:total').catch(() => {})
    return res.status(200).json({ ...parsed, search_hash })
  } catch (err) {
    console.error('[suggest]', err)
    return res.status(500).json({ error: 'Suggest failed', detail: err.message })
  }
}
