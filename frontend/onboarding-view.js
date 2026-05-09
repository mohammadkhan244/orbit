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

    /* Allow scroll when form is tall */
    #onboarding-overlay { overflow-y: auto; }

    /* ── Welcome screen ── */
    .welcome-heading {
      font-family: 'Courier Prime', monospace;
      font-size: 28px; font-weight: 400;
      color: #b87333; line-height: 1.3;
      margin-bottom: 40px; max-width: 480px;
    }
    .welcome-body {
      font-family: 'DM Sans', sans-serif;
      font-size: 15px; color: rgba(240,236,228,0.65);
      line-height: 1.7; margin-bottom: 20px; max-width: 440px;
    }
    .welcome-cta {
      display: inline-block;
      background: none; border: 1px solid rgba(184,115,51,0.45);
      color: #b87333; font-family: 'Courier Prime', monospace;
      font-size: 12px; letter-spacing: 0.18em;
      text-transform: uppercase; padding: 12px 36px;
      cursor: pointer; transition: all 0.15s ease; margin-top: 40px;
    }
    .welcome-cta:hover {
      background: rgba(184,115,51,0.08);
      border-color: #b87333; color: #f0ece4;
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

  // Admin auth pending — show loading state and wait for verification + reload
  if (window.ORBIT_ADMIN_PENDING) {
    const overlay = makeOverlay()
    const inner = document.createElement('div')
    inner.className = 'onboarding-inner'
    const eyebrow = document.createElement('div')
    eyebrow.className = 'onboarding-eyebrow'
    eyebrow.textContent = 'ORBIT'
    const headline = document.createElement('div')
    headline.className = 'onboarding-headline'
    headline.textContent = 'Verifying admin access…'
    inner.appendChild(eyebrow)
    inner.appendChild(headline)
    overlay.appendChild(inner)
    hideNav()
    document.body.appendChild(overlay)
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

  // New visitor: guest sees welcome screen first, others go straight to form
  hideNav()
  if (window.ORBIT_GUEST) {
    const welcomeOverlay = buildWelcomeScreen(() => {
      document.body.appendChild(buildForm())
    })
    document.body.appendChild(welcomeOverlay)
  } else {
    document.body.appendChild(buildForm())
  }
}

// ── Welcome screen (guest only) ───────────────────────────────────────────────

function buildWelcomeScreen(onProceed) {
  const overlay = makeOverlay()
  const inner = document.createElement('div')
  inner.className = 'onboarding-inner'

  const eyebrow = document.createElement('div')
  eyebrow.className = 'onboarding-eyebrow'
  eyebrow.textContent = 'ORBIT'

  const heading = document.createElement('div')
  heading.className = 'welcome-heading'
  heading.textContent = 'You have an orbit. You just can\'t see it yet.'

  const p1 = document.createElement('p')
  p1.className = 'welcome-body'
  p1.textContent = 'ORBIT maps the people you should already be talking to — researchers, writers, builders working on the same problems you are. Not connections. Thinking partners.'

  const p2 = document.createElement('p')
  p2.className = 'welcome-body'
  p2.textContent = 'You get one search and one suggestion. Your orbit is saved. When ORBIT launches, you\'ll pick up exactly where you left off.'

  const cta = document.createElement('button')
  cta.className = 'welcome-cta'
  cta.textContent = 'Build my orbit →'

  cta.addEventListener('click', () => {
    overlay.remove()
    onProceed()
  })

  inner.appendChild(eyebrow)
  inner.appendChild(heading)
  inner.appendChild(p1)
  inner.appendChild(p2)
  inner.appendChild(cta)
  overlay.appendChild(inner)
  return overlay
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
    { key: 'name',        label: 'Your Name',                                           placeholder: 'First and last name',                                               type: 'input'    },
    { key: 'mission',     label: 'What are you working on?',                            placeholder: '2–3 sentences. What is the thing?',                                  type: 'textarea' },
    { key: 'north_stars', label: 'What do you want to be known for?',                  placeholder: 'The work, the idea, the reputation.',                                type: 'input'    },
    { key: 'worldview',   label: 'What kind of thinking partner are you looking for?',  placeholder: 'Someone who can challenge assumptions, co-think, build alongside.',   type: 'textarea' },
    { key: 'email',       label: 'Your email (optional)',                               placeholder: 'For saving your orbit across devices',                               type: 'email'    },
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
    if (f.type === 'email') input.type = 'email'

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
      email:       inputs.email.value.trim(),
      voice:       '',
      ews_story:   '',
    }

    setIdentity(identity)
    try { localStorage.setItem(LS_SESSION, sessionId) } catch {}

    // Store to KV — non-blocking, failure is graceful
    // sendWelcome: true triggers confirmation + notification emails via Resend
    fetch('/api/identity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, identity, sendWelcome: true }),
    }).catch(() => {})

    dismiss(overlay)
    window._orbitSessionResolve({ sessionId, identity })
  })

  return overlay
}

init()
