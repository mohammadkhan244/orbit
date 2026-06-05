import { createClient } from '@vercel/kv'
import { Resend } from 'resend'

const kv = createClient({
  url: process.env.orbit_KV_REST_API_URL,
  token: process.env.orbit_KV_REST_API_TOKEN,
})
const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // GET → vote counts
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
    const { type, vote, feedback, name, email } = req.body ?? {}

    // POST { type: 'vote', vote: 'up'|'down' }
    if (type === 'vote') {
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

    // POST { type: 'feedback', feedback, name?, email? }
    if (type === 'feedback') {
      if (!feedback) return res.status(400).json({ error: 'No feedback provided' })
      try {
        await resend.emails.send({
          from: 'ORBIT <mohammadkhan@themohammadkhan.com>',
          to: 'mohammadkhan@themohammadkhan.com',
          subject: 'APERTURE feedback',
          text: `Feedback: ${feedback}\n\nFrom: ${name || 'Anonymous'} ${email ? '— ' + email : ''}`,
        })
        return res.status(200).json({ ok: true })
      } catch (err) {
        console.error('[aperture]', err)
        return res.status(500).json({ error: err.message })
      }
    }

    return res.status(400).json({ error: 'type must be "vote" or "feedback"' })
  }

  return res.status(405).end()
}
