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
    const { code, action, sessionId } = req.query
    if (code !== process.env.ORBIT_ADMIN_CODE) return res.status(401).json({ error: 'Unauthorized' })

    if (action === 'contacts') {
      if (!sessionId) return res.status(400).json({ error: 'sessionId required' })
      try {
        const contacts = await kv.get(`orbit:contacts:${sessionId}`)
        return res.status(200).json(contacts || [])
      } catch (err) {
        console.error('[admin-auth] contacts GET failed', err)
        return res.status(502).json({ error: 'KV unavailable', detail: err.message })
      }
    }

    if (action === 'stats') {
      try {
        const [searches, suggests, orbitsBuilt, contactsAdded, guests, apertureUp, apertureDown] = await Promise.all([
          kv.get('stats:search:total'),
          kv.get('stats:suggest:total'),
          kv.get('stats:orbits:built'),
          kv.get('stats:contacts:added'),
          kv.get('stats:guests:total'),
          kv.get('stats:aperture:up'),
          kv.get('stats:aperture:down'),
        ])
        return res.status(200).json({
          searches: searches || 0,
          suggests: suggests || 0,
          orbitsBuilt: orbitsBuilt || 0,
          contactsAdded: contactsAdded || 0,
          guests: guests || 0,
          apertureUpvotes: apertureUp || 0,
          apertureDownvotes: apertureDown || 0,
        })
      } catch (err) {
        console.error('[admin-auth] stats GET failed', err)
        return res.status(502).json({ error: 'KV unavailable', detail: err.message })
      }
    }

    // action=list (default)
    try {
      const keys = await kv.keys('orbit:identity:*')
      const profiles = await Promise.all(
        keys.map(async key => {
          const identity = await kv.get(key)
          if (!identity) return null
          const sid = key.replace('orbit:identity:', '')
          return {
            sessionId:  sid,
            name:       identity.name       || '',
            email:      identity.email      || '',
            mission:    identity.mission    || '',
            created_at: identity.created_at || null,
          }
        })
      )
      const sorted = profiles
        .filter(Boolean)
        .sort((a, b) => {
          if (!a.created_at && !b.created_at) return 0
          if (!a.created_at) return 1
          if (!b.created_at) return -1
          return new Date(b.created_at) - new Date(a.created_at)
        })
      return res.status(200).json({ profiles: sorted })
    } catch (err) {
      console.error('[admin-auth] GET failed', err)
      return res.status(502).json({ error: 'KV unavailable', detail: err.message })
    }
  }

  if (req.method === 'POST') {
    const { code } = req.body ?? {}
    if (code === process.env.ORBIT_ADMIN_CODE) {
      return res.status(200).json({ ok: true })
    }
    return res.status(401).json({ ok: false })
  }

  return res.status(405).end()
}
