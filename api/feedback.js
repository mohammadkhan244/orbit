import { createClient } from '@vercel/kv'
import { Resend } from 'resend'

const kv = createClient({
  url: process.env.orbit_KV_REST_API_URL,
  token: process.env.orbit_KV_REST_API_TOKEN,
})
const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { message, type, email } = req.body ?? {}
  if (!message || message.trim().length < 10) {
    return res.status(400).json({ error: 'Message must be at least 10 characters' })
  }

  const feedbackType = type === 'feature' ? 'Feature Request' : 'Feedback'
  const trimmedMessage = message.trim()
  const trimmedEmail = (email || '').trim()

  const key = `orbit:feedback:${Date.now()}`
  const entry = {
    type: feedbackType,
    message: trimmedMessage,
    email: trimmedEmail,
    date: new Date().toISOString(),
  }

  try {
    await Promise.all([
      kv.set(key, entry, { ex: 180 * 24 * 60 * 60 }),
      resend.emails.send({
        from: 'ORBIT <mohammadkhan@themohammadkhan.com>',
        to: 'mohammad@modernmyths.co',
        subject: `ORBIT ${feedbackType}`,
        text: `Type: ${feedbackType}\nMessage: ${trimmedMessage}\nEmail: ${trimmedEmail || 'not provided'}\nDate: ${entry.date}`,
      }),
    ])
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[feedback]', err)
    return res.status(500).json({ error: err.message })
  }
}
