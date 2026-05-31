import { DEMO_ORBITS } from './demo-orbits.js'
import { OrbitCanvas } from './orbit-canvas.js'

function injectStyles() {
  if (document.getElementById('spectator-styles')) return
  const s = document.createElement('style')
  s.id = 'spectator-styles'
  s.textContent = `
    .spec-banner {
      position: absolute;
      top: 0; left: 0; right: 0; height: 48px;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 28px; gap: 16px;
      background: rgba(184,115,51,0.07);
      border-bottom: 1px solid rgba(184,115,51,0.14);
      z-index: 5; flex-shrink: 0;
    }
    .spec-banner-text {
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.2em;
      color: rgba(184,115,51,0.65);
      text-transform: uppercase;
      white-space: nowrap;
    }
    .spec-banner-right {
      display: flex; align-items: center; gap: 12px; flex-shrink: 0;
    }
    .spec-waitlist-btn {
      background: none;
      border: 1px solid rgba(184,115,51,0.45);
      color: #b87333;
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.16em;
      text-transform: uppercase;
      padding: 5px 14px; cursor: pointer;
      transition: all 0.12s ease;
      white-space: nowrap;
    }
    .spec-waitlist-btn:hover {
      background: rgba(184,115,51,0.1);
      border-color: #b87333;
    }

    .spec-chip-row {
      position: absolute;
      left: 0; right: 0;
      top: 48px;
      height: 52px;
      display: flex; align-items: center;
      gap: 8px;
      padding: 0 20px;
      overflow-x: auto;
      overflow-y: hidden;
      border-bottom: 1px solid rgba(184,115,51,0.08);
      background: rgba(10,10,10,0.5);
      z-index: 4;
      flex-shrink: 0;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .spec-chip-row::-webkit-scrollbar { display: none; }

    .spec-chip {
      display: flex; align-items: center; gap: 7px;
      padding: 5px 12px;
      border: 1px solid rgba(184,115,51,0.18);
      background: transparent;
      cursor: pointer;
      transition: all 0.12s ease;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .spec-chip:hover {
      background: rgba(184,115,51,0.07);
      border-color: rgba(184,115,51,0.4);
    }
    .spec-chip.active {
      background: rgba(184,115,51,0.12);
      border-color: #b87333;
    }
    .spec-chip-initials {
      font-family: 'Courier Prime', monospace;
      font-size: 10px; font-weight: 700;
      color: #b87333;
      width: 18px; text-align: center;
    }
    .spec-chip-name {
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.08em;
      color: rgba(240,236,228,0.75);
    }
    .spec-chip-field {
      font-family: 'DM Sans', sans-serif;
      font-size: 10px;
      color: rgba(240,236,228,0.32);
    }

    .spec-canvas-area {
      position: absolute;
      top: 100px; left: 0; right: 0; bottom: 0;
      overflow: hidden;
    }

    .spec-watermark {
      position: absolute;
      bottom: 24px; left: 50%;
      transform: translateX(-50%);
      font-family: 'Courier Prime', monospace;
      font-size: 11px; letter-spacing: 0.32em;
      color: rgba(184,115,51,0.15);
      text-transform: uppercase;
      pointer-events: none;
      user-select: none;
      white-space: nowrap;
      z-index: 2;
    }

    .spec-info-bar {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      padding: 10px 24px;
      background: rgba(10,10,10,0.8);
      border-top: 1px solid rgba(184,115,51,0.08);
      display: flex; align-items: baseline; gap: 12px;
      z-index: 3;
    }
    .spec-info-name {
      font-family: 'Courier Prime', monospace;
      font-size: 13px; color: #f0ece4;
    }
    .spec-info-era {
      font-family: 'DM Sans', sans-serif;
      font-size: 11px; color: rgba(240,236,228,0.3);
    }
    .spec-info-field {
      font-family: 'DM Sans', sans-serif;
      font-size: 11px; color: rgba(184,115,51,0.55);
    }

    /* ── Waitlist modal ── */
    .spec-modal-overlay {
      position: fixed; inset: 0; z-index: 500;
      background: rgba(10,10,10,0.96);
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
    }
    .spec-modal-card {
      max-width: 420px; width: 100%;
      border: 1px solid rgba(184,115,51,0.35);
      padding: 40px 36px;
      background: #0a0a0a;
    }
    .spec-modal-eyebrow {
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.22em;
      color: rgba(184,115,51,0.55);
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .spec-modal-heading {
      font-family: 'Courier Prime', monospace;
      font-size: 20px; font-weight: 400;
      color: #f0ece4; line-height: 1.3;
      margin-bottom: 12px;
    }
    .spec-modal-sub {
      font-family: 'DM Sans', sans-serif;
      font-size: 14px; color: rgba(240,236,228,0.55);
      line-height: 1.65; margin-bottom: 28px;
    }
    .spec-modal-input {
      width: 100%; background: transparent;
      border: none; border-bottom: 1px solid rgba(184,115,51,0.3);
      color: #f0ece4; font-family: 'DM Sans', sans-serif;
      font-size: 15px; padding: 8px 0 12px;
      outline: none; display: block; margin-bottom: 16px;
      transition: border-color 0.2s ease;
    }
    .spec-modal-input:focus { border-bottom-color: #b87333; }
    .spec-modal-input::placeholder { color: rgba(240,236,228,0.2); }
    .spec-modal-btn {
      background: none;
      border: 1px solid rgba(184,115,51,0.5);
      color: #b87333;
      font-family: 'Courier Prime', monospace;
      font-size: 11px; letter-spacing: 0.18em;
      text-transform: uppercase;
      padding: 10px 28px; cursor: pointer;
      transition: all 0.15s ease; display: block; width: 100%;
    }
    .spec-modal-btn:hover:not(:disabled) {
      background: rgba(184,115,51,0.1);
      border-color: #b87333; color: #f0ece4;
    }
    .spec-modal-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .spec-modal-status {
      font-family: 'Courier Prime', monospace;
      font-size: 11px; color: rgba(184,115,51,0.65);
      letter-spacing: 0.1em; margin-top: 14px; min-height: 1.4em;
    }
    .spec-modal-close {
      display: block; margin-top: 16px;
      background: none; border: none;
      color: rgba(240,236,228,0.3);
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase; cursor: pointer;
      padding: 8px 0; width: 100%; text-align: center;
      transition: color 0.15s ease;
    }
    .spec-modal-close:hover { color: rgba(240,236,228,0.6); }

    @media (max-width: 600px) {
      .spec-banner { padding: 0 16px; }
      .spec-banner-text { display: none; }
      .spec-chip-row { padding: 0 12px; }
    }
  `
  document.head.appendChild(s)
}

function showWaitlistModal() {
  if (document.getElementById('spec-waitlist-modal')) return

  const overlay = document.createElement('div')
  overlay.id = 'spec-waitlist-modal'
  overlay.className = 'spec-modal-overlay'

  const card = document.createElement('div')
  card.className = 'spec-modal-card'

  const eyebrow = document.createElement('div')
  eyebrow.className = 'spec-modal-eyebrow'
  eyebrow.textContent = 'ORBIT — WAITLIST'

  const heading = document.createElement('div')
  heading.className = 'spec-modal-heading'
  heading.textContent = 'ORBIT is at capacity.'

  const sub = document.createElement('div')
  sub.className = 'spec-modal-sub'
  sub.textContent = 'Early access is limited to 10 gravity profiles. Leave your email and you\'ll be first when a spot opens.'

  const nameInput = document.createElement('input')
  nameInput.type = 'text'
  nameInput.placeholder = 'Your name (optional)'
  nameInput.className = 'spec-modal-input'

  const emailInput = document.createElement('input')
  emailInput.type = 'email'
  emailInput.placeholder = 'your@email.com'
  emailInput.className = 'spec-modal-input'

  const btn = document.createElement('button')
  btn.className = 'spec-modal-btn'
  btn.textContent = 'Join the waitlist'

  const status = document.createElement('div')
  status.className = 'spec-modal-status'

  const closeBtn = document.createElement('button')
  closeBtn.className = 'spec-modal-close'
  closeBtn.textContent = 'Not now'
  closeBtn.addEventListener('click', () => overlay.remove())

  btn.addEventListener('click', async () => {
    const email = emailInput.value.trim()
    if (!email || !email.includes('@')) { emailInput.focus(); return }
    btn.disabled = true
    btn.textContent = 'Joining…'
    status.textContent = ''
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.value.trim(), email }),
      })
      status.textContent = "You're on the list. We'll be in touch."
      btn.textContent = 'Joined'
    } catch {
      btn.disabled = false
      btn.textContent = 'Join the waitlist'
      status.textContent = 'Something went wrong. Try again.'
    }
  })

  card.appendChild(eyebrow)
  card.appendChild(heading)
  card.appendChild(sub)
  card.appendChild(nameInput)
  card.appendChild(emailInput)
  card.appendChild(btn)
  card.appendChild(status)
  card.appendChild(closeBtn)
  overlay.appendChild(card)
  document.body.appendChild(overlay)
  setTimeout(() => emailInput.focus(), 60)
}

async function init() {
  if (!window.ORBIT_SPECTATOR) return

  injectStyles()

  // Fire-and-forget visit counter
  fetch('/api/spectator-analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'visit' }),
  }).catch(() => {})

  // Hide nav links that would trigger APIs
  const hideViews = ['search', 'suggest', 'aperture', 'admin']
  hideViews.forEach(v => {
    document.querySelectorAll(`[data-view="${v}"]`).forEach(el => {
      el.style.display = 'none'
    })
  })
  // Hide gravity profile button
  const gpLink = document.getElementById('gravity-profile-link')
  if (gpLink) gpLink.style.display = 'none'

  // Show spectator badge in place of admin badge
  const adminBadge = document.getElementById('admin-badge')
  if (adminBadge) {
    adminBadge.textContent = 'DEMO'
    adminBadge.hidden = false
  }

  const container = document.getElementById('orbit-view')
  if (!container) return

  // Banner
  const banner = document.createElement('div')
  banner.className = 'spec-banner'

  const bannerText = document.createElement('span')
  bannerText.className = 'spec-banner-text'
  bannerText.textContent = '// Spectator mode — browsing demo orbits'

  const bannerRight = document.createElement('div')
  bannerRight.className = 'spec-banner-right'

  const waitlistBtn = document.createElement('button')
  waitlistBtn.className = 'spec-waitlist-btn'
  waitlistBtn.textContent = 'Join the waitlist →'
  waitlistBtn.addEventListener('click', showWaitlistModal)

  bannerRight.appendChild(waitlistBtn)
  banner.appendChild(bannerText)
  banner.appendChild(bannerRight)
  container.appendChild(banner)

  // Chip row
  const chipRow = document.createElement('div')
  chipRow.className = 'spec-chip-row'
  container.appendChild(chipRow)

  // Canvas area
  const canvasArea = document.createElement('div')
  canvasArea.className = 'spec-canvas-area'
  container.appendChild(canvasArea)

  // Watermark
  const watermark = document.createElement('div')
  watermark.className = 'spec-watermark'
  watermark.textContent = 'DEMO ORBIT — READ ONLY'
  canvasArea.appendChild(watermark)

  // Info bar
  const infoBar = document.createElement('div')
  infoBar.className = 'spec-info-bar'
  canvasArea.appendChild(infoBar)

  const infoName = document.createElement('span')
  infoName.className = 'spec-info-name'
  const infoEra = document.createElement('span')
  infoEra.className = 'spec-info-era'
  const infoField = document.createElement('span')
  infoField.className = 'spec-info-field'
  infoBar.appendChild(infoName)
  infoBar.appendChild(infoEra)
  infoBar.appendChild(infoField)

  // Canvas instance (read-only — no side panel, no stage changes)
  const canvas = new OrbitCanvas(canvasArea)
  // Disable drag/drop stage changes by overriding the event that OrbitCanvas dispatches
  document.addEventListener('orbit:stage-changed', e => e.stopImmediatePropagation(), true)
  // Intercept node-selected to show read-only tooltip instead of panel
  document.addEventListener('orbit:node-selected', e => {
    const c = e.detail
    const tip = document.getElementById('spec-node-tip')
    if (tip) tip.remove()
    const el = document.createElement('div')
    el.id = 'spec-node-tip'
    el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(10,10,10,0.95);border:1px solid rgba(184,115,51,0.25);padding:14px 20px;max-width:320px;width:90%;z-index:20;pointer-events:none;'
    const n = document.createElement('div')
    n.style.cssText = 'font-family:"Courier Prime",monospace;font-size:13px;color:#f0ece4;margin-bottom:3px;'
    n.textContent = c.name
    const r = document.createElement('div')
    r.style.cssText = 'font-family:"DM Sans",sans-serif;font-size:11px;color:rgba(240,236,228,0.4);margin-bottom:8px;'
    r.textContent = c.role
    const w = document.createElement('div')
    w.style.cssText = 'font-family:"DM Sans",sans-serif;font-size:12px;color:rgba(240,236,228,0.62);line-height:1.5;font-style:italic;'
    w.textContent = c.why
    el.appendChild(n)
    el.appendChild(r)
    el.appendChild(w)
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 4000)
  }, false)

  let activeOrbit = null

  function loadOrbit(orbit) {
    if (activeOrbit === orbit.id) return
    activeOrbit = orbit.id

    // Update chips
    chipRow.querySelectorAll('.spec-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.id === orbit.id)
    })

    // Update info bar
    infoName.textContent = orbit.name
    infoEra.textContent = orbit.era
    infoField.textContent = '· ' + orbit.field

    // Set identity name for center circle display
    window.ORBIT_IDENTITY = { name: orbit.name }

    // Load contacts into canvas
    canvas.mount(orbit.contacts)
    canvas.update(orbit.contacts)

    // Track view (fire-and-forget)
    fetch('/api/spectator-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view', id: orbit.id }),
    }).catch(() => {})
  }

  // Build chips
  DEMO_ORBITS.forEach(orbit => {
    const chip = document.createElement('button')
    chip.className = 'spec-chip'
    chip.dataset.id = orbit.id

    const initEl = document.createElement('span')
    initEl.className = 'spec-chip-initials'
    initEl.textContent = orbit.initials

    const nameEl = document.createElement('span')
    nameEl.className = 'spec-chip-name'
    nameEl.textContent = orbit.name

    const fieldEl = document.createElement('span')
    fieldEl.className = 'spec-chip-field'
    fieldEl.textContent = orbit.field

    chip.appendChild(initEl)
    chip.appendChild(nameEl)
    chip.appendChild(fieldEl)

    chip.addEventListener('click', () => loadOrbit(orbit))
    chipRow.appendChild(chip)
  })

  // Load first orbit by default
  loadOrbit(DEMO_ORBITS[0])
}

init()
