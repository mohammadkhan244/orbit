import { Resend } from 'resend'
import { createClient } from '@vercel/kv'

const resend = new Resend(process.env.RESEND_API_KEY)
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

  const { email = '', orbitData = [], waitlist = false, name = '' } = req.body ?? {}
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' })
  }

  // Waitlist signup (spectator mode)
  if (waitlist) {
    const entry = { name: name.trim(), email: email.trim().toLowerCase(), date: new Date().toISOString() }
    try {
      await kv.set(`orbit:waitlist:${email.trim().toLowerCase()}`, entry, { ex: 180 * 24 * 60 * 60 })
      kv.incr('stats:waitlist:total').catch(() => {})
      return res.status(200).json({ ok: true })
    } catch (err) {
      console.error('[guest-email] waitlist KV failed', err)
      return res.status(502).json({ error: 'KV unavailable', detail: err.message })
    }
  }

  // Guest email notification (existing flow)
  try {
    await resend.emails.send({
      from: 'orbit@modernmyths.co',
      to: 'mohammad@modernmyths.co',
      subject: `New ORBIT waitlist: ${email}`,
      html: `<p>Email: ${email}</p><p>Orbit snapshot:</p><pre>${JSON.stringify(orbitData, null, 2)}</pre>`,
    })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[guest-email]', err)
    return res.status(500).json({ error: 'Failed to send', detail: err.message })
  }
}
