import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'crypto'
import { IDENTITY_PACK } from '../shared/schema.js'
import { SUGGEST_SYSTEM_PROMPT } from '../shared/prompts.js'

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

  const { ewsStory = '' } = req.body ?? {}

  const search_hash = hashStr('suggest' + ewsStory)
  const now = Date.now()
  const last = recentHashes.get(search_hash)
  if (last && now - last < 60_000) {
    return res.status(429).json({ error: 'Already fetched suggestions. Wait 60 seconds.' })
  }
  recentHashes.set(search_hash, now)

  const identityPack = { ...IDENTITY_PACK, ews_story: ewsStory || IDENTITY_PACK.ews_story }
  const systemPrompt = SUGGEST_SYSTEM_PROMPT
    .replace('[IDENTITY_PACK]', JSON.stringify(identityPack, null, 2))

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: 'Find proactive suggestions as instructed.' }],
    })

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return res.status(200).json({ ...parsed, search_hash })
  } catch (err) {
    console.error('[suggest]', err)
    return res.status(500).json({ error: 'Suggest failed', detail: err.message })
  }
}
