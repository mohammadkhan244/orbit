const SEARCH_MESSAGES = [
  'Reading your gravity profile...',
  'Searching for people who match your query...',
  'Cross-referencing with your identity...',
  'Checking reachability...',
  'Building your results...',
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
  if (document.getElementById('search-view-styles')) return
  const s = document.createElement('style')
  s.id = 'search-view-styles'
  s.textContent = `
    .orbit-search-wrap {
      height: 100%;
      overflow-y: auto;
      padding: 56px 64px 80px;
    }
    @media (max-width: 700px) {
      .orbit-search-wrap { padding: 40px 24px 80px; }
    }
    .orbit-search-inner { max-width: 680px; margin: 0 auto; }

    .search-eyebrow {
      font-family: 'Courier Prime', monospace;
      font-size: 11px; letter-spacing: 0.2em;
      color: rgba(240,236,228,0.3);
      text-transform: uppercase;
      margin-bottom: 28px;
    }

    .search-query {
      width: 100%;
      background: transparent; border: none;
      border-bottom: 1px solid rgba(184,115,51,0.22);
      color: #f0ece4;
      font-family: 'DM Sans', sans-serif;
      font-size: 20px; font-weight: 300;
      padding: 0 0 16px;
      resize: none; min-height: 56px;
      outline: none; line-height: 1.45;
      transition: border-color 0.2s ease;
    }
    .search-query::placeholder { color: rgba(240,236,228,0.2); }
    .search-query:focus { border-bottom-color: rgba(184,115,51,0.5); }

    .ews-toggle-btn { display: none; }

    .ews-label {
      display: block;
      font-family: 'Courier Prime', monospace;
      font-size: 11px; letter-spacing: 0.18em;
      color: rgba(184,115,51,0.7);
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .ews-expand { margin-top: 28px; }
    .ews-textarea {
      width: 100%;
      background: rgba(184,115,51,0.04);
      border: 1px solid rgba(184,115,51,0.45);
      border-radius: 2px;
      color: rgba(240,236,228,0.85);
      font-family: 'DM Sans', sans-serif;
      font-size: 14px; padding: 14px 16px;
      resize: vertical; min-height: 100px;
      outline: none; line-height: 1.6;
      transition: border-color 0.15s ease;
    }
    .ews-textarea::placeholder { color: rgba(240,236,228,0.25); }
    .ews-textarea:focus { border-color: #b87333; box-shadow: 0 0 0 1px rgba(184,115,51,0.2); }

    .search-actions { margin-top: 28px; display: flex; align-items: center; gap: 20px; }

    .search-btn {
      background: none;
      border: 1px solid rgba(184,115,51,0.4);
      color: #b87333;
      font-family: 'Courier Prime', monospace;
      font-size: 12px; letter-spacing: 0.18em;
      padding: 10px 28px; cursor: pointer;
      text-transform: uppercase;
      transition: all 0.15s ease;
    }
    .search-btn:hover:not(:disabled) {
      background: rgba(184,115,51,0.08);
      border-color: #b87333; color: #f0ece4;
    }
    .search-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    /* ── Progress bar ── */
    .search-progress { margin-top: 28px; }
    .search-progress-header {
      display: flex; justify-content: flex-end;
      margin-bottom: 6px;
    }
    .search-progress-pct {
      font-family: 'Courier Prime', monospace;
      font-size: 11px; letter-spacing: 0.1em;
      color: #b87333;
    }
    .search-progress-track {
      width: 100%; height: 1px;
      background: rgba(184,115,51,0.15);
    }
    .search-progress-fill {
      height: 100%; background: #b87333;
      width: 0%; transition: width 0.6s ease;
    }
    .search-progress-msg {
      font-family: 'Courier Prime', monospace;
      font-size: 11px; letter-spacing: 0.1em;
      color: rgba(240,236,228,0.32);
      margin-top: 10px; min-height: 1.4em;
    }

    .search-error {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px; color: rgba(184,115,51,0.65);
      margin-top: 20px; line-height: 1.5;
    }

    .search-results { margin-top: 52px; }
    .results-label {
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.18em;
      color: rgba(240,236,228,0.25);
      text-transform: uppercase;
      margin-bottom: 0;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(184,115,51,0.1);
    }

    @keyframes card-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .result-card {
      padding: 28px 0;
      border-bottom: 1px solid rgba(184,115,51,0.07);
      animation: card-in 0.3s ease forwards;
      opacity: 0;
    }
    .card-header {
      display: flex; align-items: flex-start;
      justify-content: space-between; gap: 12px;
      margin-bottom: 5px;
    }
    .card-name {
      font-family: 'Courier Prime', monospace;
      font-size: 16px; font-weight: 700; color: #f0ece4;
    }
    .card-platform {
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.1em;
      color: rgba(184,115,51,0.7);
      background: rgba(184,115,51,0.08);
      border: 1px solid rgba(184,115,51,0.14);
      border-radius: 2px; padding: 2px 8px;
      text-transform: uppercase; flex-shrink: 0;
    }
    .card-role {
      font-family: 'DM Sans', sans-serif;
      font-size: 12px; color: rgba(240,236,228,0.4);
      margin-bottom: 12px;
    }
    .card-why {
      font-family: 'DM Sans', sans-serif;
      font-size: 14px; color: rgba(240,236,228,0.7);
      line-height: 1.62; margin-bottom: 16px;
    }
    .card-footer {
      display: flex; align-items: center;
      justify-content: space-between; gap: 16px;
    }
    .card-link {
      font-family: 'DM Sans', sans-serif;
      font-size: 12px; color: rgba(184,115,51,0.7);
      text-decoration: none; word-break: break-all;
      flex: 1; min-width: 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .card-link:hover { color: #b87333; }
    .card-add-btn {
      background: none;
      border: 1px solid rgba(184,115,51,0.28);
      color: rgba(184,115,51,0.75);
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.12em;
      padding: 6px 14px; cursor: pointer;
      text-transform: uppercase; flex-shrink: 0;
      transition: all 0.15s ease;
    }
    .card-add-btn:hover:not([disabled]) {
      background: rgba(184,115,51,0.08);
      border-color: #b87333; color: #f0ece4;
    }
    .card-add-btn.added {
      border-color: rgba(240,236,228,0.12);
      color: rgba(240,236,228,0.3);
      cursor: default;
    }

    /* ── Admin raw panel ── */
    .admin-raw-panel {
      margin-top: 40px;
      border: 1px solid rgba(184,115,51,0.2);
      border-radius: 2px;
    }
    .admin-raw-panel summary {
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.15em;
      color: rgba(184,115,51,0.55);
      padding: 10px 14px; cursor: pointer;
      text-transform: uppercase; user-select: none;
      list-style: none;
    }
    .admin-raw-panel summary::before { content: '▸  '; }
    .admin-raw-panel[open] summary::before { content: '▾  '; }
    .admin-raw-panel pre {
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

function buildCard(person, searchHash, source) {
  const card = document.createElement('div')
  card.className = 'result-card'

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
      source,
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
  const container = document.getElementById('search-view')
  if (!container) return

  injectStyles()

  const wrap = document.createElement('div')
  wrap.className = 'orbit-search-wrap'
  const inner = document.createElement('div')
  inner.className = 'orbit-search-inner'

  // eyebrow
  const eyebrow = document.createElement('div')
  eyebrow.className = 'search-eyebrow'
  eyebrow.textContent = 'Search'

  // query textarea
  const queryEl = document.createElement('textarea')
  queryEl.className = 'search-query'
  queryEl.placeholder = 'Describe who you\'re looking for…'
  queryEl.rows = 2

  // EWS story toggle
  const ewsBtn = document.createElement('button')
  ewsBtn.className = 'ews-toggle-btn'
  ewsBtn.textContent = '+ Include EWS context'

  const ewsExpand = document.createElement('div')
  ewsExpand.className = 'ews-expand'

  const ewsLabel = document.createElement('span')
  ewsLabel.className = 'ews-label'
  ewsLabel.textContent = 'Your EWS Story'

  const ewsArea = document.createElement('textarea')
  ewsArea.className = 'ews-textarea'
  ewsArea.placeholder = 'Paste your Early Warning System story here for deeper, more personal results.'
  ewsArea.rows = 5
  ewsExpand.appendChild(ewsLabel)
  ewsExpand.appendChild(ewsArea)

  ewsBtn.addEventListener('click', () => {
    ewsExpand.hidden = !ewsExpand.hidden
    ewsBtn.textContent = ewsExpand.hidden ? '+ Include EWS context' : '− Hide EWS context'
  })

  // actions
  const actions = document.createElement('div')
  actions.className = 'search-actions'

  const searchBtn = document.createElement('button')
  searchBtn.className = 'search-btn'
  searchBtn.textContent = 'Search'

  actions.appendChild(searchBtn)

  // progress bar
  const progressWrap = document.createElement('div')
  progressWrap.className = 'search-progress'
  progressWrap.hidden = true

  const progressHeader = document.createElement('div')
  progressHeader.className = 'search-progress-header'
  const progressPct = document.createElement('span')
  progressPct.className = 'search-progress-pct'
  progressHeader.appendChild(progressPct)

  const progressTrack = document.createElement('div')
  progressTrack.className = 'search-progress-track'
  const progressFill = document.createElement('div')
  progressFill.className = 'search-progress-fill'
  progressTrack.appendChild(progressFill)

  const progressMsg = document.createElement('div')
  progressMsg.className = 'search-progress-msg'

  progressWrap.appendChild(progressHeader)
  progressWrap.appendChild(progressTrack)
  progressWrap.appendChild(progressMsg)

  // error
  const errorEl = document.createElement('div')
  errorEl.className = 'search-error'
  errorEl.hidden = true

  // results
  const resultsEl = document.createElement('div')
  resultsEl.className = 'search-results'
  resultsEl.hidden = true

  const resultsLabel = document.createElement('div')
  resultsLabel.className = 'results-label'
  resultsEl.appendChild(resultsLabel)

  // admin raw panel
  const adminPanel = document.createElement('details')
  adminPanel.className = 'admin-raw-panel'
  adminPanel.hidden = true
  const adminSummary = document.createElement('summary')
  adminSummary.textContent = 'Raw API Response'
  const adminPre = document.createElement('pre')
  adminPanel.appendChild(adminSummary)
  adminPanel.appendChild(adminPre)

  // assemble
  inner.appendChild(eyebrow)
  inner.appendChild(queryEl)
  inner.appendChild(ewsBtn)
  inner.appendChild(ewsExpand)
  inner.appendChild(actions)
  inner.appendChild(progressWrap)
  inner.appendChild(errorEl)
  inner.appendChild(resultsEl)
  inner.appendChild(adminPanel)
  wrap.appendChild(inner)
  container.appendChild(wrap)

  // search handler
  searchBtn.addEventListener('click', async () => {
    const query = queryEl.value.trim()
    if (!query) { queryEl.focus(); return }

    searchBtn.disabled = true
    errorEl.hidden = true
    resultsEl.hidden = true
    adminPanel.hidden = true
    while (resultsEl.children.length > 1) resultsEl.removeChild(resultsEl.lastChild)

    if (window.ORBIT_GUEST) {
      const now = Date.now()
      const WEEK = 7 * 24 * 60 * 60 * 1000
      const lastSearch = parseInt(localStorage.getItem('guest_search_timestamp') || '0')
      if (now - lastSearch < WEEK) {
        searchBtn.disabled = false
        window.showGuestModal?.()
        return
      }
    }

    const identity = window.ORBIT_IDENTITY || {}
    if (!identity.name || !identity.mission) {
      searchBtn.disabled = false
      errorEl.innerHTML = ''
      errorEl.appendChild(document.createTextNode("Your Gravity Profile needs a name and mission before ORBIT can find your people. Click 'Gravity Profile' in the nav to complete it."))
      errorEl.hidden = false
      return
    }

    const prog = startProgress(progressWrap, progressFill, progressMsg, SEARCH_MESSAGES, progressPct)
    const body = { query, ewsStory: window.ORBIT_IDENTITY?.ews_story || '', identityPack: window.ORBIT_IDENTITY || {}, isGuest: !!window.ORBIT_GUEST }
    adminLog('Search request', { url: '/api/search', method: 'POST', body })
    const t0 = performance.now()
    let responseStatus = null

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      adminLog('Search response', { status: res.status, people: data.people?.length ?? 0, _elapsed: elapsed })

      prog.finish()
      await new Promise(r => setTimeout(r, 220))
      prog.hide()

      const people = data.people ?? []

      if (people.length === 0) {
        errorEl.textContent = 'No results returned. Try a different query.'
        errorEl.hidden = false
      } else {
        resultsLabel.textContent = `${people.length} result${people.length === 1 ? '' : 's'}`
        people.forEach((p, i) => {
          const card = buildCard(p, data.search_hash, 'search')
          card.style.animationDelay = `${i * 60}ms`
          resultsEl.appendChild(card)
        })
        resultsEl.hidden = false
        if (window.ORBIT_GUEST) localStorage.setItem('guest_search_timestamp', String(Date.now()))
      }

      if (window.ORBIT_ADMIN) {
        adminPre.textContent = JSON.stringify(data, null, 2)
        adminPanel.hidden = false
      }
    } catch (err) {
      prog.hide()
      adminLog('Search error', { message: err.message, _elapsed: Math.round(performance.now() - t0) })
      const errorMessages = {
        429: "You've already searched recently. Wait 60 seconds and try again.",
        500: "Something went wrong on our end. Try again in a moment. If it keeps failing, email mohammadkhan@themohammadkhan.com with the word 'Search'.",
        503: "ORBIT is temporarily unavailable. Try again in a few minutes.",
        default: "Search didn't complete. Try a different query or simplify your mission field. Still stuck? Email mohammadkhan@themohammadkhan.com"
      }
      const msg = errorMessages[responseStatus] || errorMessages.default
      errorEl.innerHTML = ''
      errorEl.appendChild(document.createTextNode(msg))
      const copyLink = document.createElement('a')
      copyLink.textContent = 'Copy details to report this'
      copyLink.style.cssText = 'display:block; margin-top:8px; font-family:Courier Prime,monospace; font-size:10px; color:#b87333; cursor:pointer; letter-spacing:0.1em;'
      copyLink.addEventListener('click', () => {
        navigator.clipboard.writeText('Search failed — Status: ' + responseStatus + ' — Time: ' + new Date().toISOString() + ' — Profile: ' + (window.ORBIT_IDENTITY?.name || 'unknown'))
      })
      errorEl.appendChild(copyLink)
      errorEl.hidden = false
    } finally {
      searchBtn.disabled = false
    }
  })

  queryEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      searchBtn.click()
    }
  })
}

init()
