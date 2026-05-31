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
      display: flex; align-items: flex-start; justify-content: center;
      padding: clamp(16px, 4vw, 40px) clamp(16px, 4vw, 24px);
      transition: opacity 0.4s ease;
      overflow-y: auto;
      box-sizing: border-box;
    }
    #onboarding-overlay.fade-out { opacity: 0; pointer-events: none; }

    .onboarding-inner { max-width: min(560px, 100%); width: 100%; box-sizing: border-box; }

    .onboarding-eyebrow {
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.24em;
      color: rgba(184,115,51,0.5);
      text-transform: uppercase;
      margin-bottom: 32px;
    }
    .onboarding-headline {
      font-family: 'Courier Prime', monospace;
      font-size: clamp(16px, 3.5vw, 22px); font-weight: 400;
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
      box-sizing: border-box;
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
      box-sizing: border-box;
    }
    @media (max-width: 480px) {
      .onboarding-submit, .welcome-cta { width: 100%; text-align: center; }
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

    /* ── Welcome screen ── */
    .welcome-heading {
      font-family: 'Courier Prime', monospace;
      font-size: clamp(20px, 4vw, 28px); font-weight: 400;
      color: #b87333; line-height: 1.3;
      margin-bottom: 40px; max-width: 480px;
    }
    .welcome-body {
      font-family: 'DM Sans', sans-serif;
      font-size: clamp(13px, 2.5vw, 15px); color: rgba(240,236,228,0.65);
      line-height: 1.7; margin-bottom: 20px; max-width: 440px;
    }
    .welcome-cta {
      display: inline-block;
      background: none; border: 1px solid rgba(184,115,51,0.45);
      color: #b87333; font-family: 'Courier Prime', monospace;
      font-size: 12px; letter-spacing: 0.18em;
      text-transform: uppercase; padding: 12px 36px;
      cursor: pointer; transition: all 0.15s ease; margin-top: 40px;
      box-sizing: border-box;
    }
    .welcome-cta:hover {
      background: rgba(184,115,51,0.08);
      border-color: #b87333; color: #f0ece4;
    }

    /* ── Return flow ── */
    .return-divider {
      border: none;
      border-top: 1px solid rgba(184,115,51,0.15);
      margin: 36px 0 24px;
    }
    .return-link {
      background: none; border: 1px solid rgba(184,115,51,0.45);
      color: #b87333;
      font-family: 'Courier Prime', monospace;
      font-size: 11px; letter-spacing: 0.18em;
      text-transform: uppercase;
      cursor: pointer; padding: 10px 28px;
      display: inline-block; margin-top: 16px;
      transition: background 0.15s ease, border-color 0.15s ease;
      box-sizing: border-box;
    }
    .return-link:hover { background: rgba(184,115,51,0.08); border-color: #b87333; }
    .return-back {
      background: none; border: none;
      color: rgba(184,115,51,0.65);
      font-family: 'Courier Prime', monospace;
      font-size: 11px; letter-spacing: 0.10em;
      cursor: pointer; padding: 0; display: block;
      margin-bottom: 28px;
      transition: color 0.15s ease;
    }
    .return-back:hover { color: rgba(184,115,51,1); }
    .return-heading {
      font-family: 'Courier Prime', monospace;
      font-size: clamp(18px, 4vw, 24px); font-weight: 400;
      color: #b87333; margin-bottom: 32px;
    }

    /* ── Post-onboarding suggestions screen ── */
    .postonboard-heading {
      font-family: 'Courier Prime', monospace;
      font-size: clamp(18px, 4vw, 24px); font-weight: 400;
      color: #b87333; line-height: 1.3;
      margin-bottom: 8px;
    }
    .postonboard-sub {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px; color: rgba(240,236,228,0.38);
      margin-bottom: 40px;
    }
    .postonboard-progress { margin-bottom: 32px; }
    .postonboard-progress-msg {
      font-family: 'DM Sans', sans-serif;
      font-size: 14px; color: rgba(240,236,228,0.6);
      margin-bottom: 6px; min-height: 1.5em;
    }
    .postonboard-progress-sub {
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.1em;
      color: rgba(240,236,228,0.22);
      margin-bottom: 16px;
    }
    .postonboard-progress-track {
      width: 100%; height: 1px;
      background: rgba(184,115,51,0.15);
    }
    .postonboard-progress-fill {
      height: 100%; background: #b87333;
      width: 0%; transition: width 0.6s ease;
    }
    .postonboard-cards { margin-bottom: 32px; }
    .postonboard-card {
      padding: 20px 0;
      border-bottom: 1px solid rgba(184,115,51,0.08);
    }
    .postonboard-card:first-child { border-top: 1px solid rgba(184,115,51,0.08); }
    .postonboard-card-name {
      font-family: 'Courier Prime', monospace;
      font-size: 15px; font-weight: 700; color: #f0ece4;
      margin-bottom: 3px;
    }
    .postonboard-card-role {
      font-family: 'DM Sans', sans-serif;
      font-size: 12px; color: rgba(240,236,228,0.38);
      margin-bottom: 8px;
    }
    .postonboard-card-reason {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px; color: rgba(240,236,228,0.62);
      line-height: 1.55; font-style: italic;
      margin-bottom: 12px;
    }
    .postonboard-card-add {
      background: none;
      border: 1px solid rgba(184,115,51,0.35);
      color: #b87333;
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase;
      padding: 6px 16px; cursor: pointer;
      transition: all 0.12s ease;
    }
    .postonboard-card-add:hover:not(:disabled) {
      background: rgba(184,115,51,0.08);
      border-color: #b87333; color: #f0ece4;
    }
    .postonboard-card-add.added {
      border-color: rgba(240,236,228,0.12);
      color: rgba(240,236,228,0.3);
      cursor: default;
    }
    .postonboard-enter {
      background: rgba(184,115,51,0.1);
      border: 1px solid rgba(184,115,51,0.45);
      color: #b87333;
      font-family: 'Courier Prime', monospace;
      font-size: 12px; letter-spacing: 0.18em;
      text-transform: uppercase;
      padding: 12px 36px; cursor: pointer;
      transition: all 0.15s ease;
      display: inline-block;
      margin-top: 8px;
      box-sizing: border-box;
    }
    .postonboard-enter:hover {
      background: rgba(184,115,51,0.18);
      border-color: #b87333; color: #f0ece4;
    }
    .postonboard-error {
      font-family: 'DM Sans', sans-serif;
      font-size: 14px; color: rgba(240,236,228,0.4);
      margin-bottom: 24px; font-style: italic;
    }
    @media (max-width: 480px) {
      .postonboard-enter { width: 100%; text-align: center; }
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

  // Spectator mode: demo orbits only, no identity flow needed
  if (window.ORBIT_SPECTATOR) return

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

  const divider = document.createElement('hr')
  divider.className = 'return-divider'

  const returnLink = document.createElement('button')
  returnLink.className = 'return-link'
  returnLink.textContent = 'Already have an orbit? Return to it →'
  returnLink.addEventListener('click', () => buildReturnFlow(inner, overlay, restoreWelcome))

  function restoreWelcome() {
    inner.innerHTML = ''
    inner.appendChild(eyebrow)
    inner.appendChild(heading)
    inner.appendChild(p1)
    inner.appendChild(p2)
    inner.appendChild(cta)
    inner.appendChild(divider)
    inner.appendChild(returnLink)
  }

  inner.appendChild(eyebrow)
  inner.appendChild(heading)
  inner.appendChild(p1)
  inner.appendChild(p2)
  inner.appendChild(cta)
  inner.appendChild(divider)
  inner.appendChild(returnLink)
  overlay.appendChild(inner)
  return overlay
}

// ── Return flow ──────────────────────────────────────────────────────────────

function buildReturnFlow(inner, overlay, onBack) {
  inner.innerHTML = ''

  if (onBack) {
    const backBtn = document.createElement('button')
    backBtn.className = 'return-back'
    backBtn.textContent = '← Back'
    backBtn.addEventListener('click', onBack)
    inner.appendChild(backBtn)
  }

  const eyebrow = document.createElement('div')
  eyebrow.className = 'onboarding-eyebrow'
  eyebrow.textContent = 'ORBIT'

  const heading = document.createElement('div')
  heading.className = 'return-heading'
  heading.textContent = 'Welcome back.'

  const fieldEl = document.createElement('div')
  fieldEl.className = 'onboarding-field'

  const label = document.createElement('label')
  label.className = 'onboarding-label'
  label.textContent = 'Your email'

  const emailInput = document.createElement('input')
  emailInput.className = 'onboarding-input'
  emailInput.type = 'email'
  emailInput.placeholder = 'The email you used when you signed up'

  fieldEl.appendChild(label)
  fieldEl.appendChild(emailInput)

  const submitBtn = document.createElement('button')
  submitBtn.className = 'onboarding-submit'
  submitBtn.textContent = 'Find my orbit'

  const errorEl = document.createElement('div')
  errorEl.className = 'onboarding-error'

  inner.appendChild(eyebrow)
  inner.appendChild(heading)
  inner.appendChild(fieldEl)
  inner.appendChild(submitBtn)
  inner.appendChild(errorEl)

  async function submitReturn() {
    const email = emailInput.value.trim()
    if (!email || !email.includes('@')) {
      errorEl.textContent = 'Please enter a valid email.'
      return
    }
    submitBtn.disabled = true
    submitBtn.textContent = 'Searching...'
    errorEl.textContent = ''
    try {
      const r = await fetch(`/api/identity?action=lookup&email=${encodeURIComponent(email)}`)
      if (r.ok) {
        const { sessionId, identity } = await r.json()
        try { localStorage.setItem(LS_SESSION, sessionId) } catch {}
        setIdentity(identity)
        window.ORBIT_GUEST = false
        dismiss(overlay)
        window._orbitSessionResolve({ sessionId, identity })
        console.log('[return] session restored for', email)
      } else if (r.status === 404) {
        errorEl.textContent = 'No orbit found for that email. Did you use a different address?'
        submitBtn.disabled = false
        submitBtn.textContent = 'Find my orbit'
      } else {
        errorEl.textContent = 'Something went wrong. Try again.'
        submitBtn.disabled = false
        submitBtn.textContent = 'Find my orbit'
      }
    } catch {
      errorEl.textContent = 'Connection error. Try again.'
      submitBtn.disabled = false
      submitBtn.textContent = 'Find my orbit'
    }
  }

  submitBtn.addEventListener('click', submitReturn)
  emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitReturn() })
  setTimeout(() => emailInput.focus(), 60)
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

  const returnLinkForm = document.createElement('button')
  returnLinkForm.className = 'return-link'
  returnLinkForm.style.marginBottom = '32px'
  returnLinkForm.textContent = 'Already have an orbit? Return to it →'
  returnLinkForm.addEventListener('click', () => buildReturnFlow(inner, overlay))

  const inputs = {}

  inner.appendChild(eyebrow)
  inner.appendChild(headline)
  inner.appendChild(returnLinkForm)

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
      created_at:  new Date().toISOString(),
    }

    setIdentity(identity)
    if (identity.email) window.ORBIT_GUEST = false
    try { localStorage.setItem(LS_SESSION, sessionId) } catch {}

    showPostOnboardingScreen(overlay, inner, sessionId, identity)
  })

  return overlay
}

// ── Post-onboarding suggestions screen ──────────────────────────────────────

const POST_ONBOARD_MESSAGES = [
  'Reading your gravity profile...',
  'Finding practitioners in your field...',
  'Checking who\'s reachable...',
  'Almost there...',
]

function showPostOnboardingScreen(overlay, inner, sessionId, identity) {
  inner.innerHTML = ''
  overlay.scrollTop = 0

  const eyebrow = document.createElement('div')
  eyebrow.className = 'onboarding-eyebrow'
  eyebrow.textContent = 'ORBIT'

  const heading = document.createElement('div')
  heading.className = 'postonboard-heading'
  heading.textContent = 'People for your orbit'

  const sub = document.createElement('div')
  sub.className = 'postonboard-sub'
  sub.textContent = 'Based on your gravity profile'

  const progressArea = document.createElement('div')
  progressArea.className = 'postonboard-progress'

  const progressMsg = document.createElement('div')
  progressMsg.className = 'postonboard-progress-msg'
  progressMsg.textContent = POST_ONBOARD_MESSAGES[0]

  const progressSub = document.createElement('div')
  progressSub.className = 'postonboard-progress-sub'
  progressSub.textContent = 'Finding people based on your profile'

  const progressTrack = document.createElement('div')
  progressTrack.className = 'postonboard-progress-track'
  const progressFill = document.createElement('div')
  progressFill.className = 'postonboard-progress-fill'
  progressTrack.appendChild(progressFill)

  progressArea.appendChild(progressMsg)
  progressArea.appendChild(progressSub)
  progressArea.appendChild(progressTrack)

  const enterBtn = document.createElement('button')
  enterBtn.className = 'postonboard-enter'
  enterBtn.textContent = 'Enter your orbit →'
  enterBtn.hidden = true

  inner.appendChild(eyebrow)
  inner.appendChild(heading)
  inner.appendChild(sub)
  inner.appendChild(progressArea)
  inner.appendChild(enterBtn)

  // Progress animation
  let step = 0
  const timer = setInterval(() => {
    step++
    const pct = Math.min(88, Math.round((step / POST_ONBOARD_MESSAGES.length) * 100))
    progressFill.style.width = pct + '%'
    if (step < POST_ONBOARD_MESSAGES.length) progressMsg.textContent = POST_ONBOARD_MESSAGES[step]
    if (step >= POST_ONBOARD_MESSAGES.length) clearInterval(timer)
  }, 2500)

  const queuedContacts = []

  function resolveAndEnter() {
    // Dispatch queued contacts synchronously BEFORE resolving session so
    // orbit-view.js CONTACT_ADDED handler updates contacts[] before KV load runs
    queuedContacts.forEach(c => {
      document.dispatchEvent(new CustomEvent('orbit:contact-added', { detail: c }))
    })
    window._orbitSessionResolve({ sessionId, identity })
    dismiss(overlay)
  }

  enterBtn.addEventListener('click', resolveAndEnter)

  // ── Fire API calls in parallel ────────────────────────────────────────────

  fetch('/api/identity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, identity, sendWelcome: true }),
  }).catch(err => console.error('[onboarding] identity POST failed:', err))

  fetch('/api/suggest-orbit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gravityProfile: identity, existingContacts: [] }),
  })
  .then(r => {
    if (!r.ok) throw new Error(r.status)
    return r.json()
  })
  .then(data => {
    clearInterval(timer)
    if (!Array.isArray(data) || data.length === 0) throw new Error('Empty')

    progressFill.style.width = '100%'
    setTimeout(() => {
      progressArea.remove()

      const cardsEl = document.createElement('div')
      cardsEl.className = 'postonboard-cards'

      data.forEach(person => {
        const card = document.createElement('div')
        card.className = 'postonboard-card'

        const nameEl = document.createElement('div')
        nameEl.className = 'postonboard-card-name'
        nameEl.textContent = person.name || ''

        const roleEl = document.createElement('div')
        roleEl.className = 'postonboard-card-role'
        roleEl.textContent = person.role || ''

        const reasonEl = document.createElement('div')
        reasonEl.className = 'postonboard-card-reason'
        reasonEl.textContent = person.reason || ''

        const addBtn = document.createElement('button')
        addBtn.className = 'postonboard-card-add'
        addBtn.textContent = '+ Add to Orbit'
        addBtn.addEventListener('click', () => {
          queuedContacts.push({
            id: crypto.randomUUID(),
            name: person.name || '',
            role: person.role || '',
            why: person.reason || '',
            url: person.url || '',
            platform: 'Suggested',
            status: 'IDENTIFIED',
            date_added: new Date().toISOString().split('T')[0],
            notes: '',
          })
          addBtn.textContent = 'Added'
          addBtn.disabled = true
          addBtn.classList.add('added')
        })

        card.appendChild(nameEl)
        card.appendChild(roleEl)
        card.appendChild(reasonEl)
        card.appendChild(addBtn)
        cardsEl.appendChild(card)
      })

      inner.insertBefore(cardsEl, enterBtn)
      enterBtn.hidden = false

      // Persist to KV so suggest-view.js loads these on next visit
      const now = Date.now()
      fetch('/api/results-kv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          type: 'suggest',
          results: {
            people: data.map(p => ({
              id: crypto.randomUUID(),
              name: p.name,
              role: p.role,
              why: p.reason,
              url: p.url,
              platform: 'Suggested',
              category: 'PRACTITIONER',
            })),
          },
          timestamp: now,
          date: new Date().toISOString(),
        }),
      }).catch(() => {})
    }, 260)
  })
  .catch(() => {
    clearInterval(timer)
    progressArea.remove()

    const errEl = document.createElement('div')
    errEl.className = 'postonboard-error'
    errEl.textContent = "Couldn't find suggestions right now"
    inner.insertBefore(errEl, enterBtn)
    enterBtn.hidden = false
  })
}

init()
