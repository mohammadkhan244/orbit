import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: { 'anthropic-beta': 'web-search-2025-03-05' },
})

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { gravityProfile, existingContacts = [] } = req.body ?? {}
  if (!gravityProfile) return res.status(400).json({ error: 'gravityProfile required' })

  const exclusionStr = existingContacts.length > 0
    ? `\n\nExclude these people already in the user's orbit: ${existingContacts.join(', ')}.`
    : ''

  const systemPrompt = `You are helping someone build their orbit — a network of thinkers, practitioners, and connectors relevant to their work and worldview. Using the gravity profile below, suggest 3 real people this person should know. They must be real, findable people. Use web search to verify they exist and are active. Exclude anyone in the existing contacts list. Return ONLY valid JSON array, no markdown, no preamble:
[{ "name": "...", "role": "...", "reason": "...", "url": "..." }]
reason must be one sentence referencing something specific in the gravity profile.

Gravity profile:
${JSON.stringify(gravityProfile)}${exclusionStr}`

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

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('[suggest-orbit]', err)
    return res.status(500).json({ error: 'Suggest failed', detail: err.message })
  }
}
