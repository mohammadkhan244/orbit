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
    .spec-ea-btn {
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
    .spec-ea-btn:hover {
      background: rgba(184,115,51,0.1);
      border-color: #b87333;
    }

    .spec-selector-row {
      position: absolute;
      left: 0; right: 0;
      top: 48px;
      height: 52px;
      display: flex; align-items: center;
      gap: 14px;
      padding: 0 20px;
      border-bottom: 1px solid rgba(184,115,51,0.08);
      background: rgba(10,10,10,0.5);
      z-index: 4;
    }
    .spec-orbit-label {
      font-family: 'Courier Prime', monospace;
      font-size: 9px; letter-spacing: 0.22em;
      color: rgba(184,115,51,0.55);
      text-transform: uppercase;
      white-space: nowrap; flex-shrink: 0;
    }
    .spec-orbit-select {
      flex: 1;
      background: #0a0a0a;
      border: 1px solid rgba(184,115,51,0.35);
      color: #f0ece4;
      font-family: 'Courier Prime', monospace;
      font-size: 12px; letter-spacing: 0.04em;
      padding: 6px 10px;
      cursor: pointer; outline: none;
      -webkit-appearance: none; appearance: none;
      max-width: 500px;
    }
    .spec-orbit-select:hover,
    .spec-orbit-select:focus { border-color: #b87333; }
    .spec-orbit-select option { background: #0a0a0a; color: #f0ece4; }

    .spec-canvas-area {
      position: absolute;
      top: 100px; left: 0; right: 0; bottom: 56px;
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
      pointer-events: none; user-select: none;
      white-space: nowrap; z-index: 2;
    }

    .spec-info-bar {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      padding: 8px 24px;
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

    /* Early access bar — persistent, bottom of orbit-view */
    .spec-access-bar {
      position: absolute;
      bottom: 0; left: 0; right: 0; height: 56px;
      display: flex; align-items: center;
      gap: 12px; padding: 0 24px;
      background: rgba(10,10,10,0.95);
      border-top: 1px solid rgba(184,115,51,0.14);
      z-index: 5;
    }
    .spec-access-label {
      font-family: 'Courier Prime', monospace;
      font-size: 11px; letter-spacing: 0.1em;
      color: rgba(240,236,228,0.45);
      text-transform: uppercase;
      white-space: nowrap; flex-shrink: 0;
    }
    .spec-access-input {
      flex: 1; max-width: 260px;
      background: transparent;
      border: none; border-bottom: 1px solid rgba(184,115,51,0.3);
      color: #f0ece4; font-family: 'DM Sans', sans-serif;
      font-size: 13px; padding: 4px 0;
      outline: none;
      transition: border-color 0.2s ease;
    }
    .spec-access-input:focus { border-bottom-color: #b87333; }
    .spec-access-input::placeholder { color: rgba(240,236,228,0.2); }
    .spec-access-submit {
      background: none;
      border: 1px solid rgba(184,115,51,0.45);
      color: #b87333;
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase;
      padding: 5px 14px; cursor: pointer;
      transition: all 0.12s ease; flex-shrink: 0;
    }
    .spec-access-submit:hover:not(:disabled) {
      background: rgba(184,115,51,0.1); border-color: #b87333;
    }
    .spec-access-submit:disabled { opacity: 0.4; cursor: not-allowed; }
    .spec-access-status {
      font-family: 'Courier Prime', monospace;
      font-size: 10px; color: rgba(184,115,51,0.65);
      letter-spacing: 0.08em; white-space: nowrap;
    }

    /* Read-only contact cards in spectator panel */
    .spec-contact-card {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(184,115,51,0.06);
    }
    .spec-contact-top {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 6px;
    }
    .spec-contact-avatar {
      width: 28px; height: 28px; flex-shrink: 0;
      border: 1px solid rgba(184,115,51,0.35);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Courier Prime', monospace;
      font-size: 9px; font-weight: 700; color: #b87333;
    }
    .spec-contact-info { flex: 1; min-width: 0; }
    .spec-contact-name {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px; color: #f0ece4;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .spec-contact-role {
      font-family: 'DM Sans', sans-serif;
      font-size: 11px; color: rgba(240,236,228,0.4);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .spec-contact-badge {
      font-family: 'Courier Prime', monospace;
      font-size: 8px; letter-spacing: 0.1em;
      color: rgba(184,115,51,0.65);
      background: rgba(184,115,51,0.06);
      border: 1px solid rgba(184,115,51,0.14);
      padding: 2px 6px; text-transform: uppercase;
      flex-shrink: 0; white-space: nowrap;
    }
    .spec-contact-why {
      font-family: 'DM Sans', sans-serif;
      font-size: 11px; color: rgba(240,236,228,0.45);
      font-style: italic; line-height: 1.45;
    }

    /* ── Early access modal ── */
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
      text-transform: uppercase; margin-bottom: 20px;
    }
    .spec-modal-heading {
      font-family: 'Courier Prime', monospace;
      font-size: 20px; font-weight: 400;
      color: #f0ece4; line-height: 1.3; margin-bottom: 12px;
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

    /* ── Read-only contact detail panel ── */
    .spec-detail-panel {
      position: absolute;
      top: 0; right: 0;
      width: 300px; height: 100%;
      background: rgba(10,10,10,0.97);
      border-left: 1px solid rgba(184,115,51,0.18);
      z-index: 20;
      overflow-y: auto;
      padding: 24px 20px;
      transform: translateX(100%);
      transition: transform 0.22s ease;
      box-sizing: border-box;
    }
    .spec-detail-panel.open { transform: translateX(0); }
    .spec-detail-header {
      display: flex; align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .spec-detail-name {
      font-family: 'Courier Prime', monospace;
      font-size: 17px; color: #f0ece4;
      line-height: 1.3; flex: 1;
    }
    .spec-detail-close {
      background: none; border: none;
      color: rgba(240,236,228,0.35);
      font-family: 'Courier Prime', monospace;
      font-size: 22px; cursor: pointer;
      padding: 0 0 0 12px; line-height: 1;
      transition: color 0.15s ease; flex-shrink: 0;
    }
    .spec-detail-close:hover { color: #f0ece4; }
    .spec-detail-role {
      font-family: 'DM Sans', sans-serif;
      font-size: 12px; color: rgba(240,236,228,0.45);
      margin-bottom: 12px;
    }
    .spec-detail-badge {
      font-family: 'Courier Prime', monospace;
      font-size: 9px; letter-spacing: 0.12em;
      color: rgba(184,115,51,0.7);
      background: rgba(184,115,51,0.06);
      border: 1px solid rgba(184,115,51,0.18);
      padding: 3px 8px; text-transform: uppercase;
      display: inline-block; margin-bottom: 20px;
    }
    .spec-detail-why {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px; color: rgba(240,236,228,0.65);
      font-style: italic; line-height: 1.65;
      margin-bottom: 16px;
    }
    .spec-detail-era {
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.14em;
      color: rgba(240,236,228,0.28);
      text-transform: uppercase;
    }
    .spec-contact-card[data-clickable]:hover {
      background: rgba(184,115,51,0.04);
    }

    @media (max-width: 768px) {
      .spec-banner { padding: 0 16px; height: 36px; }
      .spec-banner-text { display: none; }
      .spec-selector-row { top: 36px; height: 40px; padding: 0 12px; }
      .spec-orbit-label { display: none; }
      .spec-canvas-area { top: 76px; }
      .spec-access-bar {
        background: #b87333;
        border-top: none;
        padding: 0;
        height: 48px;
      }
      .spec-access-label,
      .spec-access-input,
      .spec-access-status { display: none; }
      .spec-access-submit {
        flex: 1; width: 100%;
        background: none; border: none;
        color: #0a0a0a;
        font-size: 11px; letter-spacing: 0.18em;
        padding: 0; height: 100%;
      }
      .spec-detail-panel {
        position: fixed;
        top: auto; left: 0; right: 0; bottom: 48px;
        width: 100%; height: auto; max-height: 60vh;
        border-left: none;
        border-top: 1px solid rgba(184,115,51,0.25);
        transform: translateY(100%);
        overflow-y: auto;
      }
      .spec-detail-panel.open { transform: translateY(0); }
    }
  `
  document.head.appendChild(s)
}

async function submitEarlyAccess(email, name) {
  return fetch('/api/guest-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ waitlist: true, name: name || '', email }),
  })
}

function showEarlyAccessModal() {
  if (document.getElementById('spec-ea-modal')) return

  const overlay = document.createElement('div')
  overlay.id = 'spec-ea-modal'
  overlay.className = 'spec-modal-overlay'

  const card = document.createElement('div')
  card.className = 'spec-modal-card'

  const eyebrow = document.createElement('div')
  eyebrow.className = 'spec-modal-eyebrow'
  eyebrow.textContent = 'ORBIT — EARLY ACCESS'

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
  btn.textContent = 'Get early access'

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
    btn.textContent = 'Submitting…'
    status.textContent = ''
    try {
      await submitEarlyAccess(email, nameInput.value.trim())
      status.textContent = "You're on the early access list. We'll reach out when your spot opens."
      btn.textContent = 'Done'
    } catch {
      btn.disabled = false
      btn.textContent = 'Get early access'
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

function buildAccessBar() {
  const bar = document.createElement('div')
  bar.className = 'spec-access-bar'

  const label = document.createElement('span')
  label.className = 'spec-access-label'
  label.textContent = 'Ready to build yours?'

  const input = document.createElement('input')
  input.type = 'email'
  input.placeholder = 'your@email.com'
  input.className = 'spec-access-input'

  const btn = document.createElement('button')
  btn.className = 'spec-access-submit'
  btn.textContent = 'Get early access'

  const statusEl = document.createElement('span')
  statusEl.className = 'spec-access-status'

  btn.addEventListener('click', async () => {
    if (window.innerWidth <= 768) { showEarlyAccessModal(); return }
    const email = input.value.trim()
    if (!email || !email.includes('@')) { input.focus(); return }
    btn.disabled = true
    btn.textContent = 'Submitting…'
    statusEl.textContent = ''
    try {
      await submitEarlyAccess(email)
      statusEl.textContent = "You're on the early access list. We'll reach out when your spot opens."
      input.value = ''
      btn.textContent = 'Done'
    } catch {
      btn.disabled = false
      btn.textContent = 'Get early access'
      statusEl.textContent = 'Something went wrong. Try again.'
    }
  })

  input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click() })

  bar.appendChild(label)
  bar.appendChild(input)
  bar.appendChild(btn)
  bar.appendChild(statusEl)
  return bar
}

function buildContactCard(c, onClick) {
  const card = document.createElement('div')
  card.className = 'spec-contact-card'
  if (onClick) {
    card.dataset.clickable = 'true'
    card.style.cursor = 'pointer'
    card.addEventListener('click', onClick)
  }

  const top = document.createElement('div')
  top.className = 'spec-contact-top'

  const avatar = document.createElement('div')
  avatar.className = 'spec-contact-avatar'
  avatar.textContent = (c.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const info = document.createElement('div')
  info.className = 'spec-contact-info'

  const nameEl = document.createElement('div')
  nameEl.className = 'spec-contact-name'
  nameEl.textContent = c.name || ''
  info.appendChild(nameEl)

  if (c.role) {
    const roleEl = document.createElement('div')
    roleEl.className = 'spec-contact-role'
    roleEl.textContent = c.role
    info.appendChild(roleEl)
  }

  const badge = document.createElement('div')
  badge.className = 'spec-contact-badge'
  badge.textContent = (c.status || 'IDENTIFIED').replace(/_/g, ' ')

  top.appendChild(avatar)
  top.appendChild(info)
  top.appendChild(badge)
  card.appendChild(top)

  if (c.why) {
    const why = document.createElement('div')
    why.className = 'spec-contact-why'
    why.textContent = c.why
    card.appendChild(why)
  }

  return card
}

async function init() {
  if (!window.ORBIT_SPECTATOR) return

  injectStyles()

  fetch('/api/suggest-prompted-kv', {
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
  const gpLink = document.getElementById('gravity-profile-link')
  if (gpLink) gpLink.style.display = 'none'

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

  const eaBtn = document.createElement('button')
  eaBtn.className = 'spec-ea-btn'
  eaBtn.textContent = 'Get early access →'
  eaBtn.addEventListener('click', showEarlyAccessModal)

  bannerRight.appendChild(eaBtn)
  banner.appendChild(bannerText)
  banner.appendChild(bannerRight)
  container.appendChild(banner)

  // Selector row
  const selectorRow = document.createElement('div')
  selectorRow.className = 'spec-selector-row'

  const selectorLabel = document.createElement('label')
  selectorLabel.className = 'spec-orbit-label'
  selectorLabel.textContent = 'VIEWING ORBIT OF'

  const orbitSelect = document.createElement('select')
  orbitSelect.className = 'spec-orbit-select'
  DEMO_ORBITS.forEach(orbit => {
    const opt = document.createElement('option')
    opt.value = orbit.id
    opt.textContent = `${orbit.name} — ${orbit.field}`
    orbitSelect.appendChild(opt)
  })

  selectorRow.appendChild(selectorLabel)
  selectorRow.appendChild(orbitSelect)
  container.appendChild(selectorRow)

  // Canvas area
  const canvasArea = document.createElement('div')
  canvasArea.className = 'spec-canvas-area'
  container.appendChild(canvasArea)

  const watermark = document.createElement('div')
  watermark.className = 'spec-watermark'
  watermark.textContent = 'DEMO ORBIT — READ ONLY'
  canvasArea.appendChild(watermark)

  const infoBar = document.createElement('div')
  infoBar.className = 'spec-info-bar'
  const infoName = document.createElement('span')
  infoName.className = 'spec-info-name'
  const infoEra = document.createElement('span')
  infoEra.className = 'spec-info-era'
  const infoField = document.createElement('span')
  infoField.className = 'spec-info-field'
  infoBar.appendChild(infoName)
  infoBar.appendChild(infoEra)
  infoBar.appendChild(infoField)
  canvasArea.appendChild(infoBar)

  // Persistent early access bar at the bottom
  container.appendChild(buildAccessBar())

  const canvas = new OrbitCanvas(canvasArea)

  // Block stage changes (read-only canvas)
  document.addEventListener('orbit:stage-changed', e => e.stopImmediatePropagation(), true)

  let activeOrbit = null
  let currentOrbit = null
  let detailPanel = null
  let outsideListener = null
  let _lastShowAt = 0

  function closeContactDetail() {
    if (outsideListener) {
      document.removeEventListener('click', outsideListener, true)
      outsideListener = null
    }
    if (detailPanel) {
      detailPanel.classList.remove('open')
      const p = detailPanel
      detailPanel = null
      setTimeout(() => p.remove(), 220)
    }
  }

  function showContactDetail(c) {
    const now = Date.now()
    if (now - _lastShowAt < 80) { _lastShowAt = now; return }
    _lastShowAt = now
    if (outsideListener) {
      document.removeEventListener('click', outsideListener, true)
      outsideListener = null
    }
    if (detailPanel) { detailPanel.remove(); detailPanel = null }

    const panel = document.createElement('div')
    panel.className = 'spec-detail-panel'
    detailPanel = panel

    const header = document.createElement('div')
    header.className = 'spec-detail-header'

    const nameEl = document.createElement('div')
    nameEl.className = 'spec-detail-name'
    nameEl.textContent = c.name || ''

    const closeBtn = document.createElement('button')
    closeBtn.className = 'spec-detail-close'
    closeBtn.textContent = '×'
    closeBtn.addEventListener('click', e => { e.stopPropagation(); closeContactDetail() })

    header.appendChild(nameEl)
    header.appendChild(closeBtn)
    panel.appendChild(header)

    if (c.role) {
      const roleEl = document.createElement('div')
      roleEl.className = 'spec-detail-role'
      roleEl.textContent = c.role
      panel.appendChild(roleEl)
    }

    const badge = document.createElement('div')
    badge.className = 'spec-detail-badge'
    badge.textContent = (c.status || 'IDENTIFIED').replace(/_/g, ' ')
    panel.appendChild(badge)

    if (c.why) {
      const whyEl = document.createElement('div')
      whyEl.className = 'spec-detail-why'
      whyEl.textContent = c.why
      panel.appendChild(whyEl)
    }

    const era = c.era || currentOrbit?.era
    if (era) {
      const eraEl = document.createElement('div')
      eraEl.className = 'spec-detail-era'
      eraEl.textContent = era
      panel.appendChild(eraEl)
    }

    canvasArea.appendChild(panel)
    requestAnimationFrame(() => panel.classList.add('open'))

    setTimeout(() => {
      outsideListener = e => {
        if (detailPanel && !detailPanel.contains(e.target)) closeContactDetail()
      }
      document.addEventListener('click', outsideListener, true)
    }, 100)
  }

  // Intercept orbit:node-selected in capture phase — canvas spreads contact directly into detail
  document.addEventListener('orbit:node-selected', e => {
    e.stopImmediatePropagation()
    const contact = e.detail  // canvas does: dispatchEvent({ detail: { ...contact } })
    if (!contact?.name) return
    const c = currentOrbit?.contacts?.find(x => x.id === contact.id || x.name === contact.name) || contact
    showContactDetail(c)
  }, true)

  function attachNodeListeners(orbit) {
    requestAnimationFrame(() => {
      const svg = canvasArea.querySelector('svg')
      if (!svg) return
      orbit.contacts.forEach(c => {
        const ci = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        svg.querySelectorAll('g').forEach(g => {
          const t = g.querySelector('text')
          if (!t || t.textContent.trim() !== ci) return
          // click — debounce guard in showContactDetail handles double-trigger
          g.addEventListener('click', () => showContactDetail(c))
          // touchend — track start position to distinguish tap from drag
          let ts = null
          g.addEventListener('touchstart', evt => {
            const touch = evt.touches[0]
            ts = { x: touch.clientX, y: touch.clientY }
          }, { passive: true })
          g.addEventListener('touchend', evt => {
            if (!ts) return
            const touch = evt.changedTouches[0]
            const d = Math.hypot(touch.clientX - ts.x, touch.clientY - ts.y)
            ts = null
            if (d < 10) showContactDetail(c)
          }, { passive: true })
        })
      })
    })
  }

  function loadOrbit(orbit) {
    if (activeOrbit === orbit.id) return
    activeOrbit = orbit.id
    currentOrbit = orbit

    orbitSelect.value = orbit.id
    infoName.textContent = orbit.name
    infoEra.textContent = orbit.era
    infoField.textContent = '· ' + orbit.field

    window.ORBIT_IDENTITY = { name: orbit.name }
    canvas.mount(orbit.contacts)
    canvas.update(orbit.contacts)
    attachNodeListeners(orbit)

    // Populate read-only contacts panel (if open)
    const panel = document.getElementById('orbit-list-panel')
    const contactsEl = panel?.querySelector('.ol-contacts')
    if (contactsEl) {
      contactsEl.innerHTML = ''
      orbit.contacts.forEach(c => contactsEl.appendChild(buildContactCard(c, () => showContactDetail(c))))
    }

    fetch('/api/suggest-prompted-kv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view', id: orbit.id }),
    }).catch(() => {})
  }

  orbitSelect.addEventListener('change', () => {
    const orbit = DEMO_ORBITS.find(o => o.id === orbitSelect.value)
    if (orbit) {
      activeOrbit = null
      loadOrbit(orbit)
    }
  })

  // Configure orbit-list-panel for spectator mode (after IIFE has run)
  // Panel starts collapsed; the existing toggle button lets user open/close it.
  requestAnimationFrame(() => {
    const panel = document.getElementById('orbit-list-panel')
    if (!panel) return

    // Hide interactive controls that don't apply in read-only mode
    const fw = panel.querySelector('.ol-filter-wrap')
    const sr = panel.querySelector('.ol-stage-row')
    const footer = panel.querySelector('.ol-footer')
    const ss = panel.querySelector('.ol-suggest-section')
    const exportBtn = panel.querySelector('.ol-export-btn')
    const headerSpan = panel.querySelector('.ol-header span')
    if (fw) fw.style.display = 'none'
    if (sr) sr.style.display = 'none'
    if (footer) footer.style.display = 'none'
    if (ss) ss.style.display = 'none'
    if (exportBtn) exportBtn.style.display = 'none'
    if (headerSpan) headerSpan.textContent = 'DEMO ORBIT'

    // Watch for renderList() calls (triggered when toggle is clicked) and
    // re-populate with richer spectator cards instead of plain contact rows.
    const contactsEl = panel.querySelector('.ol-contacts')
    if (contactsEl) {
      new MutationObserver(() => {
        if (contactsEl.querySelector('.spec-contact-card')) return
        contactsEl.innerHTML = ''
        if (currentOrbit) {
          currentOrbit.contacts.forEach(c => contactsEl.appendChild(buildContactCard(c, () => showContactDetail(c))))
        }
      }).observe(contactsEl, { childList: true })
    }
  })

  loadOrbit(DEMO_ORBITS[0])
}

init()
