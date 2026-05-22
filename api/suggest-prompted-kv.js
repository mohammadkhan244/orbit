import { createClient } from '@vercel/kv'

const kv = createClient({
  url: process.env.orbit_KV_REST_API_URL,
  token: process.env.orbit_KV_REST_API_TOKEN,
})

const TTL = 90 * 24 * 60 * 60 // 90 days

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const { sessionId } = req.query
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' })
    try {
      const val = await kv.get(`orbit:suggest:prompted:${sessionId}`)
      return res.status(200).json({ prompted: !!val })
    } catch {
      return res.status(200).json({ prompted: false })
    }
  }

  if (req.method === 'POST') {
    const { sessionId } = req.body ?? {}
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' })
    try {
      await kv.set(`orbit:suggest:prompted:${sessionId}`, true, { ex: TTL })
      return res.status(200).json({ ok: true })
    } catch {
      return res.status(502).json({ error: 'KV unavailable' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
