import { createClient } from '@vercel/kv'

const kv = createClient({
  url: process.env.orbit_KV_REST_API_URL,
  token: process.env.orbit_KV_REST_API_TOKEN,
})

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    try {
      const [up, down] = await Promise.all([
        kv.get('stats:aperture:up'),
        kv.get('stats:aperture:down'),
      ])
      return res.status(200).json({ up: up || 0, down: down || 0 })
    } catch (err) {
      return res.status(502).json({ error: 'KV unavailable', detail: err.message })
    }
  }

  if (req.method === 'POST') {
    const { vote } = req.body ?? {}
    try {
      if (vote === 'up') await kv.incr('stats:aperture:up')
      if (vote === 'down') await kv.incr('stats:aperture:down')
      const [up, down] = await Promise.all([
        kv.get('stats:aperture:up'),
        kv.get('stats:aperture:down'),
      ])
      return res.status(200).json({ ok: true, up: up || 0, down: down || 0 })
    } catch (err) {
      return res.status(502).json({ error: 'KV unavailable', detail: err.message })
    }
  }

  return res.status(405).end()
}
