import { createClient } from '@vercel/kv'
import { Resend } from 'resend'

const kv = createClient({
  url: process.env.orbit_KV_REST_API_URL,
  token: process.env.orbit_KV_REST_API_TOKEN,
})
const resend = new Resend(process.env.RESEND_API_KEY)

const TTL = 90 * 24 * 60 * 60 // 90 days in seconds

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const { sessionId, action, email, checkCap } = req.query

    if (checkCap === 'true') {
      try {
        const keys = await kv.keys('orbit:identity:*')
        const identities = await Promise.all(keys.map(k => kv.get(k)))
        const realCount = identities.filter(id => {
          if (!id) return false
          const name = (id.name || '').toLowerCase()
          return !name.includes('test') && !name.includes('mohammad')
        }).length
        return res.status(200).json({ mode: realCount >= 10 ? 'spectator' : 'active', count: realCount })
      } catch (err) {
        console.error('[identity] checkCap failed', err)
        return res.status(200).json({ mode: 'active' })
      }
    }

    if (action === 'lookup') {
      if (!email) return res.status(400).json({ error: 'email required' })
      try {
        const normalized = email.toLowerCase().trim()
        const foundSessionId = await kv.get(`orbit:email:${normalized}`)
        if (!foundSessionId) return res.status(404).json({ error: 'No orbit found for that email' })
        const identity = await kv.get(`orbit:identity:${foundSessionId}`)
        if (!identity) return res.status(404).json({ error: 'No orbit found for that email' })
        return res.status(200).json({ sessionId: foundSessionId, identity })
      } catch (err) {
        console.error('[identity] lookup failed', err)
        return res.status(502).json({ error: 'KV unavailable', detail: err.message })
      }
    }

    if (!sessionId) return res.status(400).json({ error: 'sessionId required' })
    try {
      const identity = await kv.get(`orbit:identity:${sessionId}`)
      if (!identity) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json(identity)
    } catch (err) {
      console.error('[identity] GET failed', err)
      return res.status(502).json({ error: 'KV unavailable', detail: err.message })
    }
  }

  if (req.method === 'POST') {
    const { sessionId, identity, sendWelcome, sendUpdate } = req.body ?? {}
    if (!sessionId || !identity) return res.status(400).json({ error: 'sessionId and identity required' })
    try {
      await kv.set(`orbit:identity:${sessionId}`, identity, { ex: TTL })

      if (identity.email && identity.email.includes('@')) {
        await kv.set(
          `orbit:email:${identity.email.toLowerCase().trim()}`,
          sessionId,
          { ex: TTL }
        )
      }

      if (sendWelcome) kv.incr('stats:orbits:built').catch(() => {})

      console.log('[identity] POST body flags:', { sendWelcome, sendUpdate, hasEmail: !!identity?.email, email: identity?.email })

      if (sendWelcome && identity.email && identity.email.includes('@')) {
        const name = identity.name || 'there'
        console.log('[identity] attempting confirmation email to:', identity.email)
        try {
          const r1 = await resend.emails.send({
            from: 'ORBIT <mohammadkhan@themohammadkhan.com>',
            to: identity.email,
            subject: 'Your orbit is saved.',
            text: `Hi ${name},\n\nYour orbit is saved. When ORBIT launches, you will pick up exactly where you left off.\n\n- ORBIT`,
          })
          console.log('[identity] confirmation email result:', JSON.stringify(r1))
        } catch (err) {
          console.error('[identity] confirmation email error:', err.message, err.statusCode)
        }
        try {
          const r2 = await resend.emails.send({
            from: 'ORBIT <mohammadkhan@themohammadkhan.com>',
            to: 'mohammad@modernmyths.co',
            subject: `New gravity profile: ${name}`,
            text: `Name: ${name}\nEmail: ${identity.email}\nMission: ${identity.mission || '-'}\nSession: ${sessionId}`,
          })
          console.log('[identity] notification email result:', JSON.stringify(r2))
        } catch (err) {
          console.error('[identity] notification email error:', err.message, err.statusCode)
        }
      }

      if (sendUpdate && identity.email && identity.email.includes('@')) {
        const name = identity.name || 'there'
        try {
          await resend.emails.send({
            from: 'ORBIT <mohammadkhan@themohammadkhan.com>',
            to: identity.email,
            subject: 'Your gravity profile has been updated.',
            text: `Hi ${name},\n\nYour gravity profile has been updated.\n\nName: ${name}\nMission: ${identity.mission || '-'}\nThinking partner: ${identity.worldview || '-'}\n\n- ORBIT`,
          })
          console.log('[identity] update email sent to', identity.email)
        } catch (err) {
          console.error('[identity] update email (user) failed', err)
        }
        try {
          await resend.emails.send({
            from: 'ORBIT <mohammadkhan@themohammadkhan.com>',
            to: 'mohammad@modernmyths.co',
            subject: `Profile updated: ${name} - ${identity.email}`,
            text: `Name: ${name}\nEmail: ${identity.email}\nMission: ${identity.mission || '-'}\nSession: ${sessionId}`,
          })
          console.log('[identity] update notification sent to mohammad@modernmyths.co')
        } catch (err) {
          console.error('[identity] update email (notify) failed', err)
        }
      }

      return res.status(200).json({ ok: true })
    } catch (err) {
      console.error('[identity] POST failed', err)
      return res.status(502).json({ error: 'KV unavailable', detail: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
