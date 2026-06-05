const SUGGEST_MESSAGES = [
  'Reading your gravity profile...',
  'Finding who you should learn from...',
  'Finding thinking partners at your level...',
  'Finding who would benefit from your perspective...',
  'Checking reachability...',
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

function startProgress(wrapEl, fillEl, msgEl, messages, pctEl) {
  wrapEl.hidden = false
  fillEl.style.width = '0%'
  if (pctEl) pctEl.textContent = '0%'
  msgEl.textContent = messages[0]
  let step = 0
  let stopped = false

  const timer = setInterval(() => {
    if (stopped) return
    step++
    const pct = Math.min(100, Math.round((step / messages.length) * 100))
    fillEl.style.width = `${pct}%`
    if (pctEl) pctEl.textContent = `${pct}%`
    if (step < messages.length) msgEl.textContent = messages[step]
    if (step >= messages.length) clearInterval(timer)
  }, 3000)

  return {
    finish() {
      stopped = true
      clearInterval(timer)
      fillEl.style.width = '100%'
      if (pctEl) pctEl.textContent = '100%'
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
    .suggest-progress-header {
      display: flex; justify-content: flex-end;
      margin-bottom: 6px;
    }
    .suggest-progress-pct {
      font-family: 'Courier Prime', monospace;
      font-size: 11px; letter-spacing: 0.1em;
      color: #b87333;
    }
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

    .suggest-results-timestamp {
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.1em;
      color: rgba(240,236,228,0.2);
      margin-top: 6px;
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

    .suggest-tier-header {
      display: flex; align-items: center; gap: 12px;
      padding: 32px 0 12px;
    }
    .suggest-tier-header-text {
      font-family: 'Courier Prime', monospace;
      font-size: 11px; letter-spacing: 0.2em;
      color: #b87333; text-transform: uppercase;
      white-space: nowrap; flex-shrink: 0;
    }
    .suggest-tier-header-line {
      flex: 1; height: 1px;
      background: rgba(184,115,51,0.18);
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

    .suggest-card .card-contact {
      margin-top: 14px; padding-top: 14px;
      border-top: 1px solid rgba(184,115,51,0.07);
    }
    .suggest-card .card-contact-label {
      font-family: 'Courier Prime', monospace;
      font-size: 9px; letter-spacing: 0.16em;
      color: rgba(240,236,228,0.2);
      text-transform: uppercase; margin-bottom: 7px;
    }
    .suggest-card .card-contact-row {
      font-family: 'DM Sans', sans-serif;
      font-size: 12px; color: rgba(240,236,228,0.48);
      margin-bottom: 3px; line-height: 1.4;
    }
    .suggest-card .card-contact-link {
      color: rgba(184,115,51,0.65); text-decoration: none;
    }
    .suggest-card .card-contact-link:hover { color: #b87333; text-decoration: underline; }
    .suggest-card .card-contact-none {
      font-family: 'DM Sans', sans-serif;
      font-size: 12px; color: rgba(240,236,228,0.2);
      font-style: italic;
    }
    .suggest-card .card-contact-note {
      font-family: 'DM Sans', sans-serif;
      font-size: 11px; color: rgba(240,236,228,0.27);
      font-style: italic; margin-top: 4px;
    }

    /* ── Synonym chips ── */
    .synonym-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin: 14px 0 0;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(184,115,51,0.07);
    }
    .synonym-label {
      font-family: 'Courier Prime', monospace;
      font-size: 9px; letter-spacing: 0.2em;
      color: rgba(240,236,228,0.2);
      text-transform: uppercase;
      flex-shrink: 0;
    }
    .synonym-chip {
      font-family: 'Courier Prime', monospace;
      font-size: 9px; letter-spacing: 0.1em;
      color: rgba(184,115,51,0.65);
      border: 1px solid rgba(184,115,51,0.25);
      padding: 3px 8px;
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

// ── Synonym bar ──────────────────────────────────────────────────────────────

function renderSynonyms(synonyms, container) {
  if (!synonyms || synonyms.length === 0) return
  const bar = document.createElement('div')
  bar.className = 'synonym-bar'
  const label = document.createElement('span')
  label.className = 'synonym-label'
  label.textContent = 'Searched using'
  bar.appendChild(label)
  synonyms.forEach(term => {
    const chip = document.createElement('span')
    chip.className = 'synonym-chip'
    chip.textContent = term
    bar.appendChild(chip)
  })
  container.appendChild(bar)
}

// ── Contact info section ─────────────────────────────────────────────────────

function buildContactInfo(person) {
  const section = document.createElement('div')
  section.className = 'card-contact'

  const label = document.createElement('div')
  label.className = 'card-contact-label'
  label.textContent = 'Contact Info'
  section.appendChild(label)

  const hasEmail    = person.email    && person.email.trim()
  const hasLinkedIn = person.linkedin && person.linkedin.trim()
  const hasWebsite  = person.website  && person.website.trim()
  const hasBooks    = Array.isArray(person.books) && person.books.length > 0
  const note        = (person.contact_note || person.reachability_notes || '').trim()

  if (!hasEmail && !hasLinkedIn && !hasWebsite && !hasBooks && !note) {
    const none = document.createElement('div')
    none.className = 'card-contact-none'
    none.textContent = 'No public contact info found'
    section.appendChild(none)
    return section
  }

  if (hasEmail) {
    const row = document.createElement('div')
    row.className = 'card-contact-row'
    const a = document.createElement('a')
    a.className = 'card-contact-link'
    a.href = 'mailto:' + person.email.trim()
    a.textContent = person.email.trim()
    a.target = '_blank'; a.rel = 'noopener noreferrer'
    row.appendChild(document.createTextNode('Email: '))
    row.appendChild(a)
    section.appendChild(row)
  }

  if (hasLinkedIn) {
    const row = document.createElement('div')
    row.className = 'card-contact-row'
    const a = document.createElement('a')
    a.className = 'card-contact-link'
    a.href = person.linkedin.trim()
    a.textContent = 'LinkedIn'
    a.target = '_blank'; a.rel = 'noopener noreferrer'
    row.appendChild(document.createTextNode('LinkedIn: '))
    row.appendChild(a)
    section.appendChild(row)
  }

  if (hasWebsite) {
    const row = document.createElement('div')
    row.className = 'card-contact-row'
    const a = document.createElement('a')
    a.className = 'card-contact-link'
    a.href = person.website.trim()
    a.textContent = person.website.trim()
    a.target = '_blank'; a.rel = 'noopener noreferrer'
    row.appendChild(document.createTextNode('Website: '))
    row.appendChild(a)
    section.appendChild(row)
  }

  if (hasBooks) {
    person.books.forEach(book => {
      if (!book.title) return
      const row = document.createElement('div')
      row.className = 'card-contact-row'
      const parts = [book.title]
      if (book.publisher) parts.push(book.publisher)
      if (book.year) parts.push(book.year)
      row.textContent = 'Book: ' + parts.join(' — ')
      section.appendChild(row)
    })
  }

  if (note) {
    const n = document.createElement('div')
    n.className = 'card-contact-note'
    n.textContent = note
    section.appendChild(n)
  }

  return section
}

// ── Tier header builder ──────────────────────────────────────────────────────

function buildTierHeader(symbol, label) {
  const header = document.createElement('div')
  header.className = 'suggest-tier-header'
  const text = document.createElement('span')
  text.className = 'suggest-tier-header-text'
  text.textContent = symbol + ' ' + label
  const line = document.createElement('div')
  line.className = 'suggest-tier-header-line'
  header.appendChild(text)
  header.appendChild(line)
  return header
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
      id: person.id || crypto.randomUUID(),
      name: person.name,
      role: person.role,
      why: person.why,
      url: person.url,
      platform: person.platform,
      email: person.email || '',
      linkedin: person.linkedin || '',
      website: person.website || '',
      books: person.books || [],
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
  card.appendChild(buildContactInfo(person))
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

  const progressWrap = document.createElement('div')
  progressWrap.className = 'suggest-progress'
  progressWrap.hidden = true

  const progressHeader = document.createElement('div')
  progressHeader.className = 'suggest-progress-header'
  const progressPct = document.createElement('span')
  progressPct.className = 'suggest-progress-pct'
  progressHeader.appendChild(progressPct)

  const progressTrack = document.createElement('div')
  progressTrack.className = 'suggest-progress-track'
  const progressFill = document.createElement('div')
  progressFill.className = 'suggest-progress-fill'
  progressTrack.appendChild(progressFill)

  const progressMsg = document.createElement('div')
  progressMsg.className = 'suggest-progress-msg'

  progressWrap.appendChild(progressHeader)
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
  const resultsTs = document.createElement('div')
  resultsTs.className = 'suggest-results-timestamp'
  resultsEl.appendChild(resultsLabel)
  resultsEl.appendChild(resultsTs)

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

  // ── Helpers ──────────────────────────────────────────────────────────────────

  let sessionId = null

  function formatTime(ts) {
    const d = new Date(ts)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
      ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function updateBtn(timestamp) {
    const DAY = 24 * 60 * 60 * 1000
    if (timestamp && Date.now() - timestamp < DAY) {
      suggestBtn.disabled = true
      suggestBtn.textContent = 'Available again at ' +
        new Date(timestamp + DAY).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      suggestBtn.disabled = false
      suggestBtn.textContent = resultsEl.hidden ? 'Who should I reach out to?' : 'Suggest Again'
    }
  }

  function renderData(data, meta) {
    const people = data.people ?? []
    if (people.length === 0) {
      errorEl.textContent = 'No suggestions returned. Try again shortly.'
      errorEl.hidden = false
      return
    }

    // Clear old results only when we have new ones (Bug 3)
    while (resultsEl.children.length > 2) resultsEl.removeChild(resultsEl.lastChild)
    adminPanel.hidden = true

    resultsLabel.textContent = `${people.length} suggestion${people.length === 1 ? '' : 's'}`
    resultsTs.textContent = meta?.timestamp ? 'Generated ' + formatTime(meta.timestamp) : ''

    renderSynonyms(data.synonyms || [], resultsEl)

    const TIERS = [
      { key: 'learn', symbol: '+', label: 'LEARN FROM' },
      { key: 'think', symbol: '=', label: 'THINK WITH' },
      { key: 'share', symbol: '-', label: 'SHARE WITH' },
    ]
    const grouped = { learn: [], think: [], share: [] }
    people.forEach((p, i) => {
      const tier = (p.tier || '').toLowerCase()
      const fallback = TIERS[i]?.key || 'learn'
      const key = grouped[tier] !== undefined ? tier : fallback
      grouped[key].push(p)
    })

    let cardIndex = 0
    TIERS.forEach(({ key, symbol, label }) => {
      if (grouped[key].length === 0) return
      resultsEl.appendChild(buildTierHeader(symbol, label))
      grouped[key].forEach(p => {
        const card = buildCard(p, data.search_hash)
        card.style.animationDelay = `${cardIndex * 60}ms`
        cardIndex++
        resultsEl.appendChild(card)
      })
    })

    resultsEl.hidden = false

    if (window.ORBIT_ADMIN) {
      adminPre.textContent = JSON.stringify(data, null, 2)
      adminPanel.hidden = false
    }
  }

  // ── Load saved results on init ────────────────────────────────────────────────

  ;(async () => {
    try {
      const session = await window.ORBIT_SESSION_PROMISE
      sessionId = session.sessionId
      const r = await fetch(`/api/results-kv?sessionId=${encodeURIComponent(sessionId)}&type=suggest`)
      if (r.ok) {
        const saved = await r.json()
        if (saved && saved.results && Array.isArray(saved.results.people) && saved.results.people.length > 0) {
          renderData(saved.results, saved)
          updateBtn(saved.timestamp)
        }
      }
    } catch {}
  })()

  // ── Click handler ─────────────────────────────────────────────────────────────

  suggestBtn.addEventListener('click', async () => {
    suggestBtn.disabled = true
    errorEl.hidden = true
    // Bug 3: do NOT hide resultsEl or clear results here — keep existing results visible

    if (window.ORBIT_GUEST) {
      const now = Date.now()
      const WEEK = 7 * 24 * 60 * 60 * 1000
      const lastSuggest = parseInt(localStorage.getItem('guest_suggest_timestamp') || '0')
      if (now - lastSuggest < WEEK) {
        suggestBtn.disabled = false
        window.showGuestModal?.()
        return
      }
    }

    const identity = window.ORBIT_IDENTITY || {}
    if (!identity.name || !identity.mission) {
      suggestBtn.disabled = false
      errorEl.innerHTML = ''
      errorEl.appendChild(document.createTextNode("Your Gravity Profile needs a name and mission before ORBIT can find your people. Click 'Gravity Profile' in the nav to complete it."))
      errorEl.hidden = false
      return
    }

    const prog = startProgress(progressWrap, progressFill, progressMsg, SUGGEST_MESSAGES, progressPct)
    adminLog('Suggest request', { url: '/api/suggest', method: 'POST' })
    const t0 = performance.now()
    let responseStatus = null

    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ewsStory: window.ORBIT_IDENTITY?.ews_story || '',
          identityPack: window.ORBIT_IDENTITY || {},
          isGuest: !!window.ORBIT_GUEST,
        }),
      })
      responseStatus = res.status

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
      // Bug 1: log full response before parsing
      console.log('[suggest] response:', JSON.stringify(data).slice(0, 500))
      adminLog('Suggest response', { status: res.status, people: data.people?.length ?? 0, _elapsed: elapsed })

      // Bug 1: validate structure before rendering
      if (!data || !Array.isArray(data.people)) {
        throw new Error('Unexpected response format — no people array returned')
      }

      prog.finish()
      await new Promise(r => setTimeout(r, 220))
      prog.hide()

      const now = Date.now()
      renderData(data, { timestamp: now })
      updateBtn(now)

      if (sessionId) {
        fetch('/api/results-kv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, type: 'suggest', results: data, timestamp: now, date: new Date().toISOString() }),
        }).catch(() => {})
      }

      if (window.ORBIT_GUEST) localStorage.setItem('guest_suggest_timestamp', String(Date.now()))

    } catch (err) {
      prog.hide()
      adminLog('Suggest error', { message: err.message, _elapsed: Math.round(performance.now() - t0) })
      const errorMessages = {
        429: "You've already fetched suggestions recently. Wait 60 seconds and try again.",
        500: "Something went wrong on our end. Try again in a moment. If it keeps failing, email mohammadkhan@themohammadkhan.com with the word 'Suggest'.",
        503: "ORBIT is temporarily unavailable. Try again in a few minutes.",
        default: "Couldn't generate suggestions — tap to try again.",
      }
      const msg = errorMessages[responseStatus] || errorMessages.default
      errorEl.innerHTML = ''
      errorEl.appendChild(document.createTextNode(msg))
      const copyLink = document.createElement('a')
      copyLink.textContent = 'Copy details to report this'
      copyLink.style.cssText = 'display:block; margin-top:8px; font-family:Courier Prime,monospace; font-size:10px; color:#b87333; cursor:pointer; letter-spacing:0.1em;'
      copyLink.addEventListener('click', () => {
        navigator.clipboard.writeText('Suggest failed — Status: ' + responseStatus + ' — Time: ' + new Date().toISOString() + ' — Profile: ' + (window.ORBIT_IDENTITY?.name || 'unknown'))
      })
      errorEl.appendChild(copyLink)
      errorEl.hidden = false
      // Re-enable for immediate retry (results stay visible if they existed)
      suggestBtn.disabled = false
      suggestBtn.textContent = resultsEl.hidden ? 'Who should I reach out to?' : 'Suggest Again'
    }
  })
}

init()
