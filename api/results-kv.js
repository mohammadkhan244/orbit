import { createClient } from '@vercel/kv'

const kv = createClient({
  url: process.env.orbit_KV_REST_API_URL,
  token: process.env.orbit_KV_REST_API_TOKEN,
})

const TTL = 30 * 24 * 60 * 60 // 30 days

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const { sessionId, type } = req.query
    if (!sessionId || !type) return res.status(400).json({ error: 'sessionId and type required' })
    try {
      const data = await kv.get(`orbit:${type}:results:${sessionId}`)
      return res.status(200).json(data || null)
    } catch (err) {
      console.error('[results-kv] GET failed', err)
      return res.status(502).json({ error: 'KV unavailable' })
    }
  }

  if (req.method === 'POST') {
    const { sessionId, type, results, query, timestamp, date } = req.body ?? {}
    if (!sessionId || !type) return res.status(400).json({ error: 'sessionId and type required' })
    const payload = { results, timestamp, date }
    if (type === 'search') payload.query = query
    try {
      await kv.set(`orbit:${type}:results:${sessionId}`, payload, { ex: TTL })
      return res.status(200).json({ ok: true })
    } catch (err) {
      console.error('[results-kv] POST failed', err)
      return res.status(502).json({ error: 'KV unavailable' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
