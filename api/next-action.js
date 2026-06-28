import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@vercel/kv'

const kv = createClient({
  url: process.env.orbit_KV_REST_API_URL,
  token: process.env.orbit_KV_REST_API_TOKEN,
})

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function trackTokens(inputTokens, outputTokens) {
  const total = inputTokens + outputTokens
  kv.incrby('orbit:tokens:total:input', inputTokens).catch(() => {})
  kv.incrby('orbit:tokens:total:output', outputTokens).catch(() => {})
  kv.incrby('orbit:tokens:feature:next-action', total).catch(() => {})
  kv.incr('orbit:tokens:count:next-action').catch(() => {})
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { contact, stage, gravityProfile } = req.body ?? {}
  if (!contact || !stage) return res.status(200).json({ action: null })

  const contactInfo = [
    contact.email    ? `Email: ${contact.email}`       : null,
    contact.linkedin ? `LinkedIn: ${contact.linkedin}` : null,
    contact.website  ? `Website: ${contact.website}`   : null,
  ].filter(Boolean).join(', ') || 'none found'

  const userPrompt = `Contact: ${contact.name || '—'}, ${contact.role || '—'}
Why they're in my orbit: ${contact.why || '—'}
Their current stage: ${stage}
My mission: ${gravityProfile?.mission || '—'}
What I'm looking for: ${gravityProfile?.thinkingPartner || '—'}
Contact info: ${contactInfo}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: `You generate one specific, actionable next step for someone trying to build a real relationship with a person in their orbit.

Be specific to the reason they were connected.
Be concrete — what to say, where to say it, what to reference.

If the person has a LinkedIn, email, or website, reference that channel specifically.

Write 2-3 sentences max. No preamble.
No "you should" or "consider".
Just the action, direct and specific.

Return ONLY a JSON object:
{ "action": "the 2-3 sentence suggestion", "channel": "email | linkedin | website | substack | in_person | other" }`,
      messages: [{ role: 'user', content: userPrompt }],
    })

    if (response.usage) {
      trackTokens(response.usage.input_tokens || 0, response.usage.output_tokens || 0)
    }

    const raw = response.content.find(b => b.type === 'text')?.text || ''
    const start = raw.indexOf('{')
    const end   = raw.lastIndexOf('}')
    if (start === -1 || end === -1) return res.status(200).json({ action: null })
    const parsed = JSON.parse(raw.slice(start, end + 1))
    return res.status(200).json({ action: parsed.action || null, channel: parsed.channel || 'other' })
  } catch (err) {
    console.error('[next-action]', err)
    return res.status(200).json({ action: null })
  }
}
