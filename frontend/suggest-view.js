const SUGGEST_MESSAGES = [
  'Reading your identity pack...',
  'Scanning across science communication, systems thinking, speculative fiction...',
  'Finding who you haven\'t considered...',
  'Checking reachability — Substack, LinkedIn, public contact forms...',
  'Surfacing your blind spots...',
  'Almost there...',
]

// ── Admin helpers ────────────────────────────────────────────────────────────

function adminLog(label, data) {
  if (!window.ORBIT_ADMIN) return
  const elapsed = typeof data._elapsed === 'number' ? ` (${data._elapsed}ms)` : ''
  console.group(`[ORBIT] ${label}${elapsed}`)
  const { _elapsed, ...rest } = data
  console.log(Object.keys(rest).length ? rest : data)
  console.groupEnd()
}

// ── Progress bar ─────────────────────────────────────────────────────────────

function startProgress(wrapEl, fillEl, msgEl, messages) {
  wrapEl.hidden = false
  fillEl.style.width = '0%'
  msgEl.textContent = messages[0]
  let step = 0
  let stopped = false

  const timer = setInterval(() => {
    if (stopped) return
    step++
    fillEl.style.width = `${Math.min(100, Math.round((step / messages.length) * 100))}%`
    if (step < messages.length) msgEl.textContent = messages[step]
    if (step >= messages.length) clearInterval(timer)
  }, 3000)

  return {
    finish() {
      stopped = true
      clearInterval(timer)
      fillEl.style.width = '100%'
    },
    hide() {
      stopped = true
      clearInterval(timer)
      wrapEl.hidden = true
    },
  }
}

// ── Styles ───────────────────────────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById('suggest-view-styles')) return
  const s = document.createElement('style')
  s.id = 'suggest-view-styles'
  s.textContent = `
    .orbit-suggest-wrap {
      height: 100%;
      overflow-y: auto;
      padding: 56px 64px 80px;
    }
    @media (max-width: 700px) {
      .orbit-suggest-wrap { padding: 40px 24px 80px; }
    }
    .orbit-suggest-inner { max-width: 680px; margin: 0 auto; }

    .suggest-eyebrow {
      font-family: 'Courier Prime', monospace;
      font-size: 11px; letter-spacing: 0.2em;
      color: rgba(240,236,228,0.3);
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    .suggest-headline {
      font-family: 'Courier Prime', monospace;
      font-size: 22px; font-weight: 400;
      color: rgba(240,236,228,0.72);
      line-height: 1.4;
      margin-bottom: 36px;
      max-width: 480px;
    }

    .suggest-btn {
      background: none;
      border: 1px solid rgba(184,115,51,0.4);
      color: #b87333;
      font-family: 'Courier Prime', monospace;
      font-size: 12px; letter-spacing: 0.18em;
      padding: 12px 32px; cursor: pointer;
      text-transform: uppercase;
      transition: all 0.15s ease;
      display: inline-block;
    }
    .suggest-btn:hover:not(:disabled) {
      background: rgba(184,115,51,0.08);
      border-color: #b87333; color: #f0ece4;
    }
    .suggest-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    /* ── Progress bar ── */
    .suggest-progress { margin-top: 28px; }
    .suggest-progress-track {
      width: 100%; height: 1px;
      background: rgba(184,115,51,0.15);
    }
    .suggest-progress-fill {
      height: 100%; background: #b87333;
      width: 0%; transition: width 0.6s ease;
    }
    .suggest-progress-msg {
      font-family: 'Courier Prime', monospace;
      font-size: 11px; letter-spacing: 0.1em;
      color: rgba(240,236,228,0.32);
      margin-top: 10px; min-height: 1.4em;
    }

    .suggest-error {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px; color: rgba(184,115,51,0.65);
      margin-top: 20px; line-height: 1.5;
    }

    .suggest-results { margin-top: 52px; }
    .suggest-results-label {
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.18em;
      color: rgba(240,236,228,0.25);
      text-transform: uppercase;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(184,115,51,0.1);
    }

    @keyframes suggest-card-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .suggest-card {
      padding: 28px 0;
      border-bottom: 1px solid rgba(184,115,51,0.07);
      animation: suggest-card-in 0.3s ease forwards;
      opacity: 0;
    }
    .suggest-card .card-header {
      display: flex; align-items: flex-start;
      justify-content: space-between; gap: 12px;
      margin-bottom: 5px;
    }
    .suggest-card .card-name {
      font-family: 'Courier Prime', monospace;
      font-size: 16px; font-weight: 700; color: #f0ece4;
    }
    .suggest-card .card-platform {
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.1em;
      color: rgba(184,115,51,0.7);
      background: rgba(184,115,51,0.08);
      border: 1px solid rgba(184,115,51,0.14);
      border-radius: 2px; padding: 2px 8px;
      text-transform: uppercase; flex-shrink: 0;
    }
    .suggest-card .card-role {
      font-family: 'DM Sans', sans-serif;
      font-size: 12px; color: rgba(240,236,228,0.4);
      margin-bottom: 12px;
    }
    .suggest-card .card-why {
      font-family: 'DM Sans', sans-serif;
      font-size: 14px; color: rgba(240,236,228,0.7);
      line-height: 1.62; margin-bottom: 16px;
    }
    .suggest-card .card-footer {
      display: flex; align-items: center;
      justify-content: space-between; gap: 16px;
    }
    .suggest-card .card-link {
      font-family: 'DM Sans', sans-serif;
      font-size: 12px; color: rgba(184,115,51,0.7);
      text-decoration: none; word-break: break-all;
      flex: 1; min-width: 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .suggest-card .card-link:hover { color: #b87333; }
    .suggest-card .card-add-btn {
      background: none;
      border: 1px solid rgba(184,115,51,0.28);
      color: rgba(184,115,51,0.75);
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.12em;
      padding: 6px 14px; cursor: pointer;
      text-transform: uppercase; flex-shrink: 0;
      transition: all 0.15s ease;
    }
    .suggest-card .card-add-btn:hover:not([disabled]) {
      background: rgba(184,115,51,0.08);
      border-color: #b87333; color: #f0ece4;
    }
    .suggest-card .card-add-btn.added {
      border-color: rgba(240,236,228,0.12);
      color: rgba(240,236,228,0.3);
      cursor: default;
    }

    /* ── Admin raw panel ── */
    .suggest-admin-raw-panel {
      margin-top: 40px;
      border: 1px solid rgba(184,115,51,0.2);
      border-radius: 2px;
    }
    .suggest-admin-raw-panel summary {
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.15em;
      color: rgba(184,115,51,0.55);
      padding: 10px 14px; cursor: pointer;
      text-transform: uppercase; user-select: none;
      list-style: none;
    }
    .suggest-admin-raw-panel summary::before { content: '▸  '; }
    .suggest-admin-raw-panel[open] summary::before { content: '▾  '; }
    .suggest-admin-raw-panel pre {
      font-family: 'Courier Prime', monospace;
      font-size: 11px; line-height: 1.55;
      color: rgba(240,236,228,0.45);
      padding: 14px; overflow-x: auto;
      border-top: 1px solid rgba(184,115,51,0.12);
      white-space: pre-wrap; word-break: break-all;
    }
  `
  document.head.appendChild(s)
}

// ── Card builder ─────────────────────────────────────────────────────────────

function buildCard(person, searchHash) {
  const card = document.createElement('div')
  card.className = 'suggest-card'

  const header = document.createElement('div')
  header.className = 'card-header'

  const name = document.createElement('div')
  name.className = 'card-name'
  name.textContent = person.name

  const badge = document.createElement('span')
  badge.className = 'card-platform'
  badge.textContent = person.platform

  header.appendChild(name)
  header.appendChild(badge)

  const role = document.createElement('div')
  role.className = 'card-role'
  role.textContent = person.role

  const why = document.createElement('div')
  why.className = 'card-why'
  why.textContent = person.why

  const footer = document.createElement('div')
  footer.className = 'card-footer'

  const link = document.createElement('a')
  link.className = 'card-link'
  link.href = person.url
  link.textContent = person.url
  link.target = '_blank'
  link.rel = 'noopener noreferrer'

  const addBtn = document.createElement('button')
  addBtn.className = 'card-add-btn'
  addBtn.textContent = '+ Add to ORBIT'

  addBtn.addEventListener('click', () => {
    const now = new Date()
    const contact = {
      name: person.name,
      role: person.role,
      why: person.why,
      url: person.url,
      platform: person.platform,
      status: 'IDENTIFIED',
      notes: '',
      last_interaction: '',
      date_added: now.toISOString().split('T')[0],
      source: 'suggest',
      search_hash: searchHash,
      created_at: now.toISOString(),
    }
    adminLog('Event dispatch', { event: 'orbit:contact-added', contact })
    document.dispatchEvent(new CustomEvent('orbit:contact-added', { detail: contact }))
    addBtn.textContent = 'Added'
    addBtn.classList.add('added')
    addBtn.disabled = true
  })

  footer.appendChild(link)
  footer.appendChild(addBtn)

  card.appendChild(header)
  card.appendChild(role)
  card.appendChild(why)
  card.appendChild(footer)

  return card
}

// ── Init ─────────────────────────────────────────────────────────────────────

function init() {
  const container = document.getElementById('suggest-view')
  if (!container) return

  injectStyles()

  const wrap = document.createElement('div')
  wrap.className = 'orbit-suggest-wrap'
  const inner = document.createElement('div')
  inner.className = 'orbit-suggest-inner'

  const eyebrow = document.createElement('div')
  eyebrow.className = 'suggest-eyebrow'
  eyebrow.textContent = 'Suggest'

  const headline = document.createElement('div')
  headline.className = 'suggest-headline'
  headline.textContent = 'Map the field. Find who you\'re missing.'

  const suggestBtn = document.createElement('button')
  suggestBtn.className = 'suggest-btn'
  suggestBtn.textContent = 'Who should I reach out to?'

  // progress bar
  const progressWrap = document.createElement('div')
  progressWrap.className = 'suggest-progress'
  progressWrap.hidden = true

  const progressTrack = document.createElement('div')
  progressTrack.className = 'suggest-progress-track'
  const progressFill = document.createElement('div')
  progressFill.className = 'suggest-progress-fill'
  progressTrack.appendChild(progressFill)

  const progressMsg = document.createElement('div')
  progressMsg.className = 'suggest-progress-msg'

  progressWrap.appendChild(progressTrack)
  progressWrap.appendChild(progressMsg)

  const errorEl = document.createElement('div')
  errorEl.className = 'suggest-error'
  errorEl.hidden = true

  const resultsEl = document.createElement('div')
  resultsEl.className = 'suggest-results'
  resultsEl.hidden = true

  const resultsLabel = document.createElement('div')
  resultsLabel.className = 'suggest-results-label'
  resultsEl.appendChild(resultsLabel)

  // admin raw panel
  const adminPanel = document.createElement('details')
  adminPanel.className = 'suggest-admin-raw-panel'
  adminPanel.hidden = true
  const adminSummary = document.createElement('summary')
  adminSummary.textContent = 'Raw API Response'
  const adminPre = document.createElement('pre')
  adminPanel.appendChild(adminSummary)
  adminPanel.appendChild(adminPre)

  inner.appendChild(eyebrow)
  inner.appendChild(headline)
  inner.appendChild(suggestBtn)
  inner.appendChild(progressWrap)
  inner.appendChild(errorEl)
  inner.appendChild(resultsEl)
  inner.appendChild(adminPanel)
  wrap.appendChild(inner)
  container.appendChild(wrap)

  suggestBtn.addEventListener('click', async () => {
    suggestBtn.disabled = true
    errorEl.hidden = true
    resultsEl.hidden = true
    adminPanel.hidden = true
    while (resultsEl.children.length > 1) resultsEl.removeChild(resultsEl.lastChild)

    const prog = startProgress(progressWrap, progressFill, progressMsg, SUGGEST_MESSAGES)
    adminLog('Suggest request', { url: '/api/suggest', method: 'POST' })
    const t0 = performance.now()

    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const elapsed = Math.round(performance.now() - t0)

      if (res.status === 429) {
        const d = await res.json()
        throw new Error(d.error)
      }
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || `Error ${res.status}`)
      }

      const data = await res.json()
      adminLog('Suggest response', { status: res.status, people: data.people?.length ?? 0, _elapsed: elapsed })

      prog.finish()
      await new Promise(r => setTimeout(r, 220))
      prog.hide()

      const people = data.people ?? []

      if (people.length === 0) {
        errorEl.textContent = 'No suggestions returned. Try again shortly.'
        errorEl.hidden = false
      } else {
        resultsLabel.textContent = `${people.length} suggestion${people.length === 1 ? '' : 's'}`
        people.forEach((p, i) => {
          const card = buildCard(p, data.search_hash)
          card.style.animationDelay = `${i * 60}ms`
          resultsEl.appendChild(card)
        })
        resultsEl.hidden = false
      }

      if (window.ORBIT_ADMIN) {
        adminPre.textContent = JSON.stringify(data, null, 2)
        adminPanel.hidden = false
      }
    } catch (err) {
      prog.hide()
      adminLog('Suggest error', { message: err.message, _elapsed: Math.round(performance.now() - t0) })
      errorEl.textContent = err.message
      errorEl.hidden = false
    } finally {
      suggestBtn.disabled = false
    }
  })
}

init()
