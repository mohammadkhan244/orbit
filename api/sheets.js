// Sheet columns in exact order — must stay in sync with Apps Script
const COLUMNS = [
  'id', 'name', 'role', 'why', 'url', 'platform',
  'status', 'notes', 'interaction_log',
  'date_added', 'search_hash', 'created_at',
]

function rowToContact(row) {
  const c = {}
  COLUMNS.forEach((col, i) => {
    if (col === 'interaction_log') {
      try { c[col] = JSON.parse(row[i] || '[]') } catch { c[col] = [] }
    } else {
      c[col] = row[i] ?? ''
    }
  })
  return c
}

function contactToRow(contact) {
  return COLUMNS.map(col =>
    col === 'interaction_log'
      ? JSON.stringify(contact[col] || [])
      : String(contact[col] ?? '')
  )
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const WEBHOOK = process.env.SHEETS_WEBHOOK_URL
  if (!WEBHOOK) return res.status(503).json({ error: 'SHEETS_WEBHOOK_URL not configured' })

  try {
    // ── GET: fetch all contacts ──────────────────────────────────────
    if (req.method === 'GET') {
      const r = await fetch(`${WEBHOOK}?action=getAll`)
      if (!r.ok) throw new Error(`webhook ${r.status}`)
      const data = await r.json()
      const contacts = (data.rows || []).map(rowToContact)
      return res.status(200).json(contacts)
    }

    // ── POST: add new contact row ────────────────────────────────────
    if (req.method === 'POST') {
      const contact = req.body
      const row = contactToRow(contact)
      const r = await fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', row }),
      })
      if (!r.ok) throw new Error(`webhook ${r.status}`)
      return res.status(200).json({ ok: true })
    }

    // ── PATCH: update status or notes by id ─────────────────────────
    if (req.method === 'PATCH') {
      const { id, fields } = req.body ?? {}
      if (!id) return res.status(400).json({ error: 'id is required' })
      const r = await fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id, fields }),
      })
      if (!r.ok) throw new Error(`webhook ${r.status}`)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[sheets]', err)
    return res.status(502).json({ error: 'Sheets unavailable', detail: err.message })
  }
}
