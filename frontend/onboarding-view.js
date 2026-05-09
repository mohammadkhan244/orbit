import { IDENTITY_PACK } from '../shared/schema.js'

const LS_SESSION  = 'orbit_session_id'
const LS_IDENTITY = 'orbit_identity'

// ── Styles ───────────────────────────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById('onboarding-styles')) return
  const s = document.createElement('style')
  s.id = 'onboarding-styles'
  s.textContent = `
    #onboarding-overlay {
      position: fixed; inset: 0; z-index: 200;
      background: #0a0a0a;
      display: flex; align-items: center; justify-content: center;
      padding: 40px 24px;
      transition: opacity 0.4s ease;
    }
    #onboarding-overlay.fade-out { opacity: 0; pointer-events: none; }

    .onboarding-inner { max-width: 560px; width: 100%; }

    .onboarding-eyebrow {
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.24em;
      color: rgba(184,115,51,0.5);
      text-transform: uppercase;
      margin-bottom: 32px;
    }
    .onboarding-headline {
      font-family: 'Courier Prime', monospace;
      font-size: 22px; font-weight: 400;
      color: rgba(240,236,228,0.72);
      line-height: 1.4;
      margin-bottom: 48px;
      max-width: 440px;
    }
    .onboarding-field { margin-bottom: 32px; }
    .onboarding-label {
      display: block;
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.18em;
      color: rgba(184,115,51,0.65);
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .onboarding-input,
    .onboarding-textarea {
      width: 100%; background: transparent;
      border: none; border-bottom: 1px solid rgba(184,115,51,0.22);
      color: #f0ece4;
      font-family: 'DM Sans', sans-serif;
      font-size: 16px; font-weight: 300;
      padding: 4px 0 14px;
      outline: none; line-height: 1.5;
      transition: border-color 0.2s ease;
      resize: none;
    }
    .onboarding-input::placeholder,
    .onboarding-textarea::placeholder { color: rgba(240,236,228,0.18); }
    .onboarding-input:focus,
    .onboarding-textarea:focus { border-bottom-color: rgba(184,115,51,0.5); }
    .onboarding-submit {
      background: none;
      border: 1px solid rgba(184,115,51,0.45);
      color: #b87333;
      font-family: 'Courier Prime', monospace;
      font-size: 12px; letter-spacing: 0.18em;
      text-transform: uppercase;
      padding: 12px 36px;
      cursor: pointer;
      transition: all 0.15s ease;
      margin-top: 8px;
    }
    .onboarding-submit:hover:not(:disabled) {
      background: rgba(184,115,51,0.08);
      border-color: #b87333; color: #f0ece4;
    }
    .onboarding-submit:disabled { opacity: 0.4; cursor: not-allowed; }
    .onboarding-error {
      font-family: 'DM Sans', sans-serif;
      font-size: 12px; color: rgba(184,115,51,0.65);
      margin-top: 14px; min-height: 1.4em;
    }
  `
  document.head.appendChild(s)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function setIdentity(identity) {
  window.ORBIT_IDENTITY = identity
  try { localStorage.setItem(LS_IDENTITY, JSON.stringify(identity)) } catch {}
}

function hideNav() {
  const nav = document.querySelector('nav')
  if (nav) nav.style.display = 'none'
}

function showNav() {
  const nav = document.querySelector('nav')
  if (nav) nav.style.removeProperty('display')
}

function dismiss(overlay) {
  showNav()
  overlay.classList.add('fade-out')
  setTimeout(() => overlay.remove(), 420)
}

function makeOverlay() {
  const el = document.createElement('div')
  el.id = 'onboarding-overlay'
  return el
}

// ── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  injectStyles()

  // Admin mode: use hardcoded identity, skip form
  if (window.ORBIT_ADMIN) {
    const sessionId = 'admin'
    try { localStorage.setItem(LS_SESSION, sessionId) } catch {}
    setIdentity(IDENTITY_PACK)
    window._orbitSessionResolve({ sessionId, identity: IDENTITY_PACK })
    return
  }

  const existingSession = localStorage.getItem(LS_SESSION)

  // Returning visitor: try KV, fall back to localStorage
  if (existingSession) {
    const overlay = makeOverlay()
    const inner = document.createElement('div')
    inner.className = 'onboarding-inner'
    const eyebrow = document.createElement('div')
    eyebrow.className = 'onboarding-eyebrow'
    eyebrow.textContent = 'ORBIT'
    const headline = document.createElement('div')
    headline.className = 'onboarding-headline'
    headline.textContent = 'Loading your orbit...'
    inner.appendChild(eyebrow)
    inner.appendChild(headline)
    overlay.appendChild(inner)
    hideNav()
    document.body.appendChild(overlay)

    try {
      const r = await fetch(`/api/identity?sessionId=${encodeURIComponent(existingSession)}`)
      if (r.ok) {
        const identity = await r.json()
        setIdentity(identity)
        dismiss(overlay)
        window._orbitSessionResolve({ sessionId: existingSession, identity })
        return
      }
    } catch {}

    // KV failed — try localStorage fallback
    try {
      const stored = localStorage.getItem(LS_IDENTITY)
      if (stored) {
        const identity = JSON.parse(stored)
        setIdentity(identity)
        dismiss(overlay)
        window._orbitSessionResolve({ sessionId: existingSession, identity })
        return
      }
    } catch {}

    // Both failed — fall through to show form
    overlay.remove()
    showNav()
  }

  // New visitor: show onboarding form
  hideNav()
  const overlay = buildForm()
  document.body.appendChild(overlay)
}

// ── Form builder ─────────────────────────────────────────────────────────────

function buildForm() {
  const overlay = makeOverlay()
  const inner = document.createElement('div')
  inner.className = 'onboarding-inner'

  const eyebrow = document.createElement('div')
  eyebrow.className = 'onboarding-eyebrow'
  eyebrow.textContent = 'ORBIT'

  const headline = document.createElement('div')
  headline.className = 'onboarding-headline'
  headline.textContent = 'Before we map your orbit — tell us about yourself.'

  const FIELDS = [
    { key: 'name',        label: 'Your Name',                                      placeholder: 'First and last name',                                               type: 'input'    },
    { key: 'mission',     label: 'What are you working on?',                       placeholder: '2–3 sentences. What is the thing?',                                  type: 'textarea' },
    { key: 'north_stars', label: 'What do you want to be known for?',             placeholder: 'The work, the idea, the reputation.',                                type: 'input'    },
    { key: 'worldview',   label: 'What kind of thinking partner are you looking for?', placeholder: 'Someone who can challenge assumptions, co-think, build alongside.', type: 'textarea' },
  ]

  const inputs = {}

  inner.appendChild(eyebrow)
  inner.appendChild(headline)

  FIELDS.forEach(f => {
    const fieldEl = document.createElement('div')
    fieldEl.className = 'onboarding-field'

    const label = document.createElement('label')
    label.className = 'onboarding-label'
    label.textContent = f.label

    const input = f.type === 'textarea'
      ? document.createElement('textarea')
      : document.createElement('input')
    input.className = f.type === 'textarea' ? 'onboarding-textarea' : 'onboarding-input'
    input.placeholder = f.placeholder
    if (f.type === 'textarea') input.rows = 3

    inputs[f.key] = input
    fieldEl.appendChild(label)
    fieldEl.appendChild(input)
    inner.appendChild(fieldEl)
  })

  const submitBtn = document.createElement('button')
  submitBtn.className = 'onboarding-submit'
  submitBtn.textContent = 'Start Mapping'

  const errorEl = document.createElement('div')
  errorEl.className = 'onboarding-error'

  inner.appendChild(submitBtn)
  inner.appendChild(errorEl)
  overlay.appendChild(inner)

  submitBtn.addEventListener('click', async () => {
    const name    = inputs.name.value.trim()
    const mission = inputs.mission.value.trim()
    if (!name || !mission) {
      errorEl.textContent = 'Name and what you\'re working on are required.'
      return
    }

    submitBtn.disabled = true
    submitBtn.textContent = 'Setting up...'
    errorEl.textContent = ''

    const sessionId = crypto.randomUUID()
    const identity = {
      name,
      mission,
      north_stars: inputs.north_stars.value.trim() ? [inputs.north_stars.value.trim()] : [],
      interests:   [],
      worldview:   inputs.worldview.value.trim(),
      voice:       '',
      ews_story:   '',
    }

    setIdentity(identity)
    try { localStorage.setItem(LS_SESSION, sessionId) } catch {}

    // Store to KV — non-blocking, failure is graceful
    fetch('/api/identity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, identity }),
    }).catch(() => {})

    dismiss(overlay)
    window._orbitSessionResolve({ sessionId, identity })
  })

  return overlay
}

init()
