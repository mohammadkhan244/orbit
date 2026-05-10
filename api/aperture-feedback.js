import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { feedback, name, email } = req.body ?? {}
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
    console.error('[aperture-feedback]', err)
    return res.status(500).json({ error: err.message })
  }
}
