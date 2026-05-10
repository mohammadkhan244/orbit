import { createClient } from '@vercel/kv'

const kv = createClient({
  url: process.env.orbit_KV_REST_API_URL,
  token: process.env.orbit_KV_REST_API_TOKEN,
})

const TTL = 90 * 24 * 60 * 60 // 90 days in seconds

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const { sessionId } = req.query
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' })
    try {
      const contacts = await kv.get(`orbit:contacts:${sessionId}`)
      return res.status(200).json(contacts || [])
    } catch (err) {
      console.error('[contacts-kv] GET failed', err)
      return res.status(502).json({ error: 'KV unavailable', detail: err.message })
    }
  }

  if (req.method === 'POST') {
    const { sessionId, contacts } = req.body ?? {}
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' })
    try {
      await kv.set(`orbit:contacts:${sessionId}`, contacts ?? [], { ex: TTL })
      return res.status(200).json({ ok: true })
    } catch (err) {
      console.error('[contacts-kv] POST failed', err)
      return res.status(502).json({ error: 'KV unavailable', detail: err.message })
    }
  }

  if (req.method === 'PATCH') {
    const { sessionId, contactId, updates } = req.body ?? {}
    if (!sessionId || !contactId) return res.status(400).json({ error: 'sessionId and contactId required' })
    try {
      const contacts = await kv.get(`orbit:contacts:${sessionId}`) || []
      const idx = contacts.findIndex(c => c.id === contactId)
      if (idx === -1) return res.status(404).json({ error: 'Contact not found' })
      contacts[idx] = { ...contacts[idx], ...updates }
      await kv.set(`orbit:contacts:${sessionId}`, contacts, { ex: TTL })
      return res.status(200).json({ ok: true })
    } catch (err) {
      console.error('[contacts-kv] PATCH failed', err)
      return res.status(502).json({ error: 'KV unavailable', detail: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
