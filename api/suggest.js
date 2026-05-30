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

const SEARCH_CONSTRAINT = '\n\nUse web search sparingly — maximum 3 searches total. Search once for the domain, once to verify each person is real. Do not search more than necessary.'

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

  const systemPrompt = (SUGGEST_SYSTEM_PROMPT + SEARCH_CONSTRAINT)
    .replace('[USER_NAME]', slimIdentity.name || 'the user')
    .replace('[IDENTITY_PACK]', JSON.stringify(slimIdentity))
    .replace('[EWS_STORY]', slimIdentity.ews_story)

  try {
    const messages = [{ role: 'user', content: 'Return the JSON only. No prose.' }]
    let finalText = null
    let iterations = 0
    let lastStopReason = null
    const MAX_ITERATIONS = 5

    while (iterations < MAX_ITERATIONS) {
      iterations++

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: systemPrompt,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages,
      })

      const { stop_reason, content } = response
      lastStopReason = stop_reason
      const blockTypes = content.map(b => b.type).join(', ')
      console.log(`[suggest] iter=${iterations} stop_reason=${stop_reason} blocks=[${blockTypes}]`)

      // Append assistant turn
      messages.push({ role: 'assistant', content })

      // Check for text block first
      const textBlock = content.find(b => b.type === 'text')
      if (textBlock) {
        finalText = textBlock.text
        break
      }

      // pause_turn / tool_use — tool calls were made, feed results back and continue
      if (stop_reason === 'pause_turn' || stop_reason === 'tool_use') {
        const toolResults = content.filter(b =>
          b.type === 'web_search_tool_result' || b.type === 'server_tool_use'
        )
        if (toolResults.length === 0) break
        continue
      }

      // Any other stop_reason (end_turn with no text, max_tokens, etc.) — stop
      break
    }

    if (!finalText) {
      throw new Error(
        `No text block after ${iterations} iterations. last stop_reason=${lastStopReason}`
      )
    }

    console.log('[suggest] finalText length:', finalText.length, 'preview:', finalText.slice(0, 200))

    const start = finalText.indexOf('{')
    const end = finalText.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('No JSON object found in response. Raw: ' + finalText.slice(0, 300))
    const parsed = JSON.parse(finalText.slice(start, end + 1))
    parsed.people?.forEach(p => { if (!p.id) p.id = crypto.randomUUID() })

    kv.incr('stats:suggest:total').catch(() => {})
    if (isGuest) kv.incr('stats:guests:total').catch(() => {})
    return res.status(200).json({ ...parsed, search_hash })
  } catch (err) {
    console.error('[suggest]', err)
    return res.status(500).json({ error: 'Suggest failed', detail: err.message })
  }
}
