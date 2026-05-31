import { createClient } from '@vercel/kv'

const kv = createClient({
  url: process.env.orbit_KV_REST_API_URL,
  token: process.env.orbit_KV_REST_API_TOKEN,
})

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action, id } = req.body ?? {}

  if (action === 'visit') {
    kv.incr('orbit:spectator:visits').catch(() => {})
    return res.status(200).json({ ok: true })
  }

  if (action === 'view' && id) {
    kv.incr(`orbit:demo:views:${id}`).catch(() => {})
    return res.status(200).json({ ok: true })
  }

  return res.status(400).json({ error: 'action required: visit | view' })
}
