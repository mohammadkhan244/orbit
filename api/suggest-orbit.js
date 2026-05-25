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
${JSON.stringify(gravityProfile)}${exclusionStr}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
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
