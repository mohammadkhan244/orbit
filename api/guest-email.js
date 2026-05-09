import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email = '', orbitData = [] } = req.body ?? {}
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' })
  }

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
