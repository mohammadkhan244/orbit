import { OrbitCanvas } from './orbit-canvas.js'
import { SidePanel } from './side-panel.js'
import { EVENTS } from '../shared/events.js'

function injectStyles() {
  if (document.getElementById('orbit-view-styles')) return
  const s = document.createElement('style')
  s.id = 'orbit-view-styles'
  s.textContent = `
    /* Positioning context so absolute children stack correctly */
    #orbit-view { position: relative; }

    .orbit-progress {
      position: absolute;
      top: 0; left: 0; right: 0; height: 44px;
      display: flex; align-items: center; gap: 16px;
      padding: 0 32px;
      border-bottom: 1px solid rgba(184,115,51,0.10);
      background: rgba(10,10,10,0.6);
      backdrop-filter: blur(4px);
      z-index: 5;
    }
    .orbit-progress-label {
      font-family: 'Courier Prime', monospace;
      font-size: 11px; letter-spacing: 0.12em;
      color: rgba(240,236,228,0.38);
      white-space: nowrap; flex-shrink: 0;
    }
    .orbit-progress-track {
      flex: 1; height: 1px;
      background: rgba(184,115,51,0.15);
    }
    .orbit-progress-fill {
      height: 100%; background: #b87333;
      transition: width 0.4s ease;
    }

    .orbit-canvas-area {
      position: absolute;
      top: 44px; left: 0; right: 0; bottom: 0;
      overflow: hidden;
      max-width: 100vw;
    }

    @media (max-width: 700px) {
      .orbit-progress { padding: 0 16px; }
      .orbit-progress-label { font-size: 10px; letter-spacing: 0.08em; }
      .orbit-side-panel {
        width: 100% !important;
        left: 0 !important;
        border-left: none !important;
        border-top: 1px solid rgba(184,115,51,0.15);
      }
    }

    .orbit-suggest-banner {
      position: absolute;
      top: 44px; left: 0; right: 0; height: 52px;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 32px; gap: 16px;
      background: rgba(184,115,51,0.06);
      border-bottom: 1px solid rgba(184,115,51,0.12);
      z-index: 4; box-sizing: border-box;
    }
    .orbit-suggest-banner-text {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px; color: rgba(240,236,228,0.65);
      flex: 1; min-width: 0;
    }
    .orbit-suggest-banner-show {
      background: rgba(184,115,51,0.14);
      border: 1px solid rgba(184,115,51,0.4);
      color: #b87333;
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase;
      padding: 5px 14px; cursor: pointer;
      transition: all 0.12s ease; flex-shrink: 0;
    }
    .orbit-suggest-banner-show:hover {
      background: rgba(184,115,51,0.24);
      border-color: #b87333;
    }
    .orbit-suggest-banner-dismiss {
      background: none; border: none;
      color: rgba(240,236,228,0.28);
      font-family: 'DM Sans', sans-serif;
      font-size: 12px; cursor: pointer;
      padding: 4px 0; flex-shrink: 0;
      transition: color 0.12s ease;
    }
    .orbit-suggest-banner-dismiss:hover { color: rgba(240,236,228,0.55); }
    .orbit-canvas-area { transition: top 0.2s ease; }
    .orbit-canvas-area.with-banner { top: 96px; }
    @media (max-width: 700px) {
      .orbit-suggest-banner { padding: 0 16px; }
      .orbit-suggest-banner-text { font-size: 12px; }
    }
  `
  document.head.appendChild(s)
}

// ── KV helpers ───────────────────────────────────────────────────────────────

async function kvGetContacts(sessionId) {
  const r = await fetch(`/api/contacts-kv?sessionId=${encodeURIComponent(sessionId)}`)
  if (!r.ok) throw new Error(`contacts-kv GET ${r.status}`)
  return r.json()
}

function kvSetContacts(sessionId, contacts) {
  return fetch('/api/contacts-kv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, contacts }),
  })
}

// ── Persistence helpers ───────────────────────────────────────────────────────

const LS_KEY = 'orbit_contacts'

const ls = {
  read:   ()           => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] } },
  write:  (cs)         => { try { localStorage.setItem(LS_KEY, JSON.stringify(cs)) } catch {} },
  update: (id, fields) => {
    const cs = ls.read()
    const i  = cs.findIndex(c => c.id === id)
    if (i >= 0) { cs[i] = { ...cs[i], ...fields }; ls.write(cs) }
  },
}


// ── Canvas first-time hint ────────────────────────────────────────────────────

function showCanvasHint() {
  const panel = document.createElement('div')
  panel.style.cssText = [
    'position:fixed',
    'bottom:70px',
    'left:50%',
    'transform:translateX(-50%)',
    'max-width:480px',
    'width:calc(100% - 48px)',
    'background:rgba(10,10,10,0.95)',
    'border:1px solid rgba(184,115,51,0.3)',
    'border-radius:6px',
    'padding:16px 20px',
    'z-index:50',
    'box-sizing:border-box',
  ].join(';')

  const text = document.createElement('p')
  text.style.cssText = 'font-family:"DM Sans",sans-serif;font-size:13px;color:#f0ece4;line-height:1.6;margin:0 0 14px;'
  text.textContent = 'Everyone starts in IDENTIFIED — someone worth watching. As you reach out, they reply, and the relationship builds, drag them closer. The inner circle isn\'t a goal. It\'s what happens when the orbit does its job.'

  const row = document.createElement('div')
  row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;'

  const gotItBtn = document.createElement('button')
  gotItBtn.textContent = 'Got it'
  gotItBtn.style.cssText = [
    'background:none',
    'border:1px solid rgba(184,115,51,0.55)',
    'color:#b87333',
    'font-family:"Courier Prime",monospace',
    'font-size:11px',
    'letter-spacing:0.14em',
    'text-transform:uppercase',
    'padding:0 16px',
    'height:32px',
    'cursor:pointer',
    'transition:all 0.12s ease',
    'flex-shrink:0',
  ].join(';')
  gotItBtn.addEventListener('mouseover', () => { gotItBtn.style.background = 'rgba(184,115,51,0.1)'; gotItBtn.style.borderColor = '#b87333' })
  gotItBtn.addEventListener('mouseout',  () => { gotItBtn.style.background = 'none'; gotItBtn.style.borderColor = 'rgba(184,115,51,0.55)' })

  const dragHint = document.createElement('span')
  dragHint.textContent = 'Drag nodes between rings to update stage'
  dragHint.style.cssText = 'font-family:"DM Sans",sans-serif;font-size:11px;color:rgba(240,236,228,0.3);text-align:right;'

  row.appendChild(gotItBtn)
  row.appendChild(dragHint)
  panel.appendChild(text)
  panel.appendChild(row)
  document.body.appendChild(panel)

  function dismiss() {
    try { localStorage.setItem('orbit_canvas_hint_seen', '1') } catch {}
    panel.remove()
  }

  const timer = setTimeout(dismiss, 12000)
  gotItBtn.addEventListener('click', () => { clearTimeout(timer); dismiss() })
}

// ────────────────────────────────────────────────────────────────────────────

async function init() {
  if (window.ORBIT_SPECTATOR) return
  const container = document.getElementById('orbit-view')
  if (!container) return

  injectStyles()

  let contacts = []
  window.ORBIT_CONTACTS = contacts
  let sessionId = null

  function syncGlobal() {
    window.ORBIT_CONTACTS = contacts
    document.dispatchEvent(new CustomEvent('orbit:contacts-updated', { detail: { contacts } }))
  }

  function generateNextActionForContact(contact, sid) {
    const identity = window.ORBIT_IDENTITY || {}
    const gravityProfile = { mission: identity.mission || '', thinkingPartner: identity.worldview || '' }
    fetch('/api/next-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact, stage: 'IDENTIFIED', gravityProfile }),
    })
    .then(r => r.json())
    .then(data => {
      if (!data.action) return
      const nextAction = { action: data.action, channel: data.channel || 'other', generatedAt: new Date().toISOString() }
      const idx = contacts.findIndex(c => c.id === contact.id)
      if (idx >= 0) {
        contacts[idx] = { ...contacts[idx], nextAction }
        syncGlobal()
      }
      if (sid) {
        fetch('/api/contacts-kv', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid, contactId: contact.id, updates: { nextAction } }),
        }).catch(() => {})
      }
    })
    .catch(() => {})
  }

  // ── progress bar ──
  const progress = document.createElement('div')
  progress.className = 'orbit-progress'

  const label = document.createElement('span')
  label.className = 'orbit-progress-label'

  const track = document.createElement('div')
  track.className = 'orbit-progress-track'
  const fill = document.createElement('div')
  fill.className = 'orbit-progress-fill'
  track.appendChild(fill)

  progress.appendChild(label)
  progress.appendChild(track)
  container.appendChild(progress)

  function updateProgress(cs) {
    const count = cs.filter(c => c.status === 'CONVERSATION').length
    label.textContent = `${count} / 100 CONVERSATIONS`
    fill.style.width = `${count}%`
  }
  updateProgress(contacts)

  // ── canvas area ──
  const canvasArea = document.createElement('div')
  canvasArea.className = 'orbit-canvas-area'
  container.appendChild(canvasArea)

  const canvas = new OrbitCanvas(canvasArea)
  canvas.mount(contacts)

  new SidePanel(canvasArea)

  // ── event wiring ──
  document.addEventListener('orbit:stage-changed', e => {
    const { id, newStatus } = e.detail
    contacts = contacts.map(c => c.id === id ? { ...c, status: newStatus } : c)
    canvas.update(contacts)
    updateProgress(contacts)
    syncGlobal()
  })

  document.addEventListener('orbit:notes-updated', e => {
    const { id, notes } = e.detail
    contacts = contacts.map(c => c.id === id ? { ...c, notes } : c)
    syncGlobal()
  })

  // ── Suggestion banner for existing users with sparse orbits ──────────────
  function showSuggestBanner(sid) {
    const banner = document.createElement('div')
    banner.className = 'orbit-suggest-banner'

    const text = document.createElement('span')
    text.className = 'orbit-suggest-banner-text'
    text.textContent = 'Want people suggestions based on your profile?'

    const showBtn = document.createElement('button')
    showBtn.className = 'orbit-suggest-banner-show'
    showBtn.textContent = 'Show me'

    const dismissBtn = document.createElement('button')
    dismissBtn.className = 'orbit-suggest-banner-dismiss'
    dismissBtn.textContent = 'Not now'

    banner.appendChild(text)
    banner.appendChild(showBtn)
    banner.appendChild(dismissBtn)
    container.appendChild(banner)
    canvasArea.classList.add('with-banner')

    function setFlag() {
      fetch('/api/suggest-prompted-kv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid }),
      }).catch(() => {})
    }

    function removeBanner() {
      banner.remove()
      canvasArea.classList.remove('with-banner')
    }

    showBtn.addEventListener('click', () => {
      setFlag()
      removeBanner()
      document.dispatchEvent(new CustomEvent('orbit:open-list'))
      document.dispatchEvent(new CustomEvent('orbit:show-suggestions'))
    })

    dismissBtn.addEventListener('click', () => {
      setFlag()
      removeBanner()
    })
  }

  // ── Load contacts once session is ready (KV → localStorage fallback) ──
  ;(async () => {
    try {
      const session = await window.ORBIT_SESSION_PROMISE
      sessionId = session.sessionId
      window.ORBIT_SESSION_ID = sessionId

      const kvContacts = await kvGetContacts(sessionId)
      // Preserve contacts added before KV load (e.g. from post-onboarding screen)
      const localOnly = contacts.filter(c => !kvContacts.find(mc => mc.id === c.id))
      contacts = [...kvContacts, ...localOnly]
      if (localOnly.length > 0) kvSetContacts(sessionId, contacts).catch(() => {})
      ls.write(contacts)
      canvas.update(contacts)
      updateProgress(contacts)
      syncGlobal()

      // Show canvas hint once to non-admin users who have contacts
      if (!window.ORBIT_ADMIN && contacts.length > 0 && !localStorage.getItem('orbit_canvas_hint_seen')) {
        showCanvasHint()
      }

      // Show suggestion banner to non-guest users with fewer than 3 contacts
      if (!window.ORBIT_GUEST && contacts.length < 3) {
        fetch(`/api/suggest-prompted-kv?sessionId=${encodeURIComponent(sessionId)}`)
          .then(r => r.ok ? r.json() : { prompted: false })
          .then(data => { if (!data.prompted) showSuggestBanner(sessionId) })
          .catch(() => {})
      }
    } catch {
      const stored = ls.read()
      if (stored.length > 0) {
        contacts = stored
        canvas.update(contacts)
        updateProgress(contacts)
        syncGlobal()
      }
    }
  })()

  // ── CONTACT_ADDED: canvas + KV + next action ─────────────────────
  document.addEventListener(EVENTS.CONTACT_ADDED, async e => {
    const contact = e.detail
    contacts = [...contacts, contact]
    ls.write(contacts)
    canvas.update(contacts)
    updateProgress(contacts)
    syncGlobal()
    if (sessionId) {
      kvSetContacts(sessionId, contacts).catch(() => {})
      generateNextActionForContact(contact, sessionId)
    }
  })

  // ── STAGE_CHANGED: KV sync ────────────────────────────────────────
  document.addEventListener(EVENTS.STAGE_CHANGED, async e => {
    const { id, newStatus } = e.detail
    const contact = contacts.find(c => c.id === id)
    if (!contact?.id) return
    contacts = contacts.map(c => c.id === contact.id ? { ...c, status: newStatus } : c)
    ls.update(contact.id, { status: newStatus })
    syncGlobal()
    if (sessionId) kvSetContacts(sessionId, contacts).catch(() => {})
  })

  // ── NOTES_UPDATED: KV sync ────────────────────────────────────────
  document.addEventListener(EVENTS.NOTES_UPDATED, async e => {
    const { id, notes } = e.detail
    const contact = contacts.find(c => c.id === id)
    if (!contact?.id) return
    contacts = contacts.map(c => c.id === contact.id ? { ...c, notes } : c)
    ls.update(contact.id, { notes })
    syncGlobal()
    if (sessionId) kvSetContacts(sessionId, contacts).catch(() => {})
  })
}

init()
