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

  const { name = '', email = '' } = req.body ?? {}
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'valid email required' })

  const entry = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    date: new Date().toISOString(),
  }

  const key = `orbit:waitlist:${email.trim().toLowerCase()}`
  try {
    await kv.set(key, entry, { ex: 180 * 24 * 60 * 60 })
    kv.incr('stats:waitlist:total').catch(() => {})
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[waitlist] POST failed', err)
    return res.status(502).json({ error: 'KV unavailable', detail: err.message })
  }
}
