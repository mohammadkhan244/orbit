let _mounted = false
let _panel = null
let _backdrop = null
let _activeType = 'feedback'
let _textarea = null
let _emailInput = null
let _label = null
let _statusEl = null
let _submitBtn = null

const LABELS = {
  feedback: "What's on your mind?",
  feature: 'What would you like to see?',
}

function injectStyles() {
  if (document.getElementById('fp-styles')) return
  const s = document.createElement('style')
  s.id = 'fp-styles'
  s.textContent = `
    .fp-backdrop {
      position: fixed; inset: 0; z-index: 1099;
      background: rgba(0,0,0,0.6);
      opacity: 0; pointer-events: none;
      transition: opacity 0.25s ease;
    }
    .fp-backdrop.open { opacity: 1; pointer-events: auto; }

    .fp-panel {
      position: fixed; z-index: 1100;
      background: #0a0a0a;
      display: flex; flex-direction: column;
      transition: transform 0.28s cubic-bezier(0.32,0,0.15,1);
    }

    /* Mobile: slides up from bottom */
    @media (max-width: 767px) {
      .fp-panel {
        left: 0; right: 0; bottom: 0;
        height: 85vh;
        border-radius: 16px 16px 0 0;
        transform: translateY(100%);
      }
      .fp-panel.open { transform: translateY(0); }
    }

    /* Desktop: slides in from right */
    @media (min-width: 768px) {
      .fp-panel {
        top: 0; right: 0; bottom: 0;
        width: 400px;
        border-left: 1px solid rgba(184,115,51,0.25);
        transform: translateX(100%);
      }
      .fp-panel.open { transform: translateX(0); }
    }

    .fp-drag-handle {
      width: 32px; height: 4px;
      background: rgba(240,236,228,0.15);
      border-radius: 2px;
      margin: 14px auto 0;
      flex-shrink: 0;
    }
    @media (min-width: 768px) { .fp-drag-handle { display: none; } }

    .fp-header {
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 20px 24px 16px;
      flex-shrink: 0;
      border-bottom: 1px solid rgba(184,115,51,0.1);
    }
    .fp-title {
      font-family: 'Courier Prime', monospace;
      font-size: 14px; font-weight: 700;
      letter-spacing: 0.1em;
      color: #f0ece4;
      text-transform: uppercase;
    }
    .fp-close {
      background: none; border: none;
      color: rgba(240,236,228,0.4);
      font-size: 22px; line-height: 1;
      cursor: pointer; padding: 0 0 0 16px;
      transition: color 0.15s ease;
    }
    .fp-close:hover { color: #f0ece4; }

    .fp-body {
      flex: 1; overflow-y: auto;
      padding: 24px 24px 32px;
      display: flex; flex-direction: column; gap: 20px;
    }

    .fp-type-row {
      display: flex; gap: 0;
      border: 1px solid rgba(184,115,51,0.3);
    }
    .fp-type-btn {
      flex: 1; height: 44px;
      background: none; border: none;
      color: rgba(240,236,228,0.5);
      font-family: 'Courier Prime', monospace;
      font-size: 11px; letter-spacing: 0.14em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .fp-type-btn:first-child {
      border-right: 1px solid rgba(184,115,51,0.3);
    }
    .fp-type-btn.active {
      background: #b87333;
      color: #0a0a0a;
    }
    .fp-type-btn:not(.active):hover {
      background: rgba(184,115,51,0.08);
      color: rgba(240,236,228,0.8);
    }

    .fp-field { display: flex; flex-direction: column; gap: 8px; }
    .fp-field-label {
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.18em;
      color: rgba(184,115,51,0.65);
      text-transform: uppercase;
    }
    .fp-textarea {
      width: 100%; background: transparent;
      border: none; border-bottom: 1px solid rgba(184,115,51,0.25);
      color: #f0ece4;
      font-family: 'DM Sans', sans-serif;
      font-size: 16px; font-weight: 300;
      padding: 8px 0 12px;
      outline: none; resize: vertical;
      line-height: 1.55;
      transition: border-color 0.2s ease;
      min-height: 120px;
    }
    .fp-textarea::placeholder { color: rgba(240,236,228,0.18); }
    .fp-textarea:focus { border-bottom-color: rgba(184,115,51,0.55); }

    .fp-email {
      width: 100%; background: transparent;
      border: none; border-bottom: 1px solid rgba(184,115,51,0.2);
      color: #f0ece4;
      font-family: 'DM Sans', sans-serif;
      font-size: 16px; font-weight: 300;
      padding: 8px 0;
      outline: none; height: 44px;
      transition: border-color 0.2s ease;
    }
    .fp-email::placeholder { color: rgba(240,236,228,0.18); }
    .fp-email:focus { border-bottom-color: rgba(184,115,51,0.5); }

    .fp-submit {
      width: 100%; height: 48px;
      background: none;
      border: 1px solid rgba(184,115,51,0.5);
      color: #b87333;
      font-family: 'Courier Prime', monospace;
      font-size: 12px; letter-spacing: 0.2em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.15s ease;
      margin-top: 4px;
    }
    .fp-submit:hover:not(:disabled) {
      background: rgba(184,115,51,0.1);
      border-color: #b87333; color: #f0ece4;
    }
    .fp-submit:disabled { opacity: 0.4; cursor: not-allowed; }

    .fp-status {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px; min-height: 1.4em;
      line-height: 1.5;
    }
    .fp-status.error { color: rgba(220,80,80,0.7); }
    .fp-status.success { color: rgba(184,115,51,0.8); }
  `
  document.head.appendChild(s)
}

function resetForm() {
  if (_textarea) { _textarea.value = ''; _textarea.style.minHeight = '120px' }
  if (_emailInput) _emailInput.value = ''
  if (_statusEl) { _statusEl.textContent = ''; _statusEl.className = 'fp-status' }
  if (_submitBtn) { _submitBtn.disabled = false; _submitBtn.textContent = 'SEND' }
  setType('feedback')
}

function setType(type) {
  _activeType = type
  _panel.querySelectorAll('.fp-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type)
  })
  if (_label) _label.textContent = LABELS[type]
  if (_textarea) _textarea.style.minHeight = type === 'feature' ? '160px' : '120px'
}

export function closeFeedbackPanel() {
  if (!_panel) return
  _panel.classList.remove('open')
  _backdrop.classList.remove('open')
}

export function openFeedbackPanel() {
  if (!_mounted) initFeedbackPanel()
  resetForm()
  _panel.classList.add('open')
  _backdrop.classList.add('open')
  setTimeout(() => _textarea?.focus(), 60)
}

export function initFeedbackPanel() {
  if (_mounted) return
  _mounted = true

  injectStyles()

  _backdrop = document.createElement('div')
  _backdrop.className = 'fp-backdrop'
  _backdrop.addEventListener('click', closeFeedbackPanel)

  _panel = document.createElement('div')
  _panel.className = 'fp-panel'

  // Drag handle (mobile only, decorative)
  const handle = document.createElement('div')
  handle.className = 'fp-drag-handle'
  _panel.appendChild(handle)

  // Header
  const header = document.createElement('div')
  header.className = 'fp-header'

  const title = document.createElement('div')
  title.className = 'fp-title'
  title.textContent = 'Send a message'

  const closeBtn = document.createElement('button')
  closeBtn.className = 'fp-close'
  closeBtn.textContent = '×'
  closeBtn.addEventListener('click', closeFeedbackPanel)

  header.appendChild(title)
  header.appendChild(closeBtn)
  _panel.appendChild(header)

  // Body
  const body = document.createElement('div')
  body.className = 'fp-body'

  // Type toggle
  const typeRow = document.createElement('div')
  typeRow.className = 'fp-type-row'
  ;['feedback', 'feature'].forEach((type, i) => {
    const btn = document.createElement('button')
    btn.className = 'fp-type-btn' + (i === 0 ? ' active' : '')
    btn.dataset.type = type
    btn.textContent = type === 'feedback' ? 'Feedback' : 'Feature Request'
    btn.addEventListener('click', () => setType(type))
    typeRow.appendChild(btn)
  })
  body.appendChild(typeRow)

  // Message field
  const msgField = document.createElement('div')
  msgField.className = 'fp-field'

  _label = document.createElement('div')
  _label.className = 'fp-field-label'
  _label.textContent = LABELS['feedback']

  _textarea = document.createElement('textarea')
  _textarea.className = 'fp-textarea'
  _textarea.placeholder = 'Write here…'
  _textarea.rows = 5

  msgField.appendChild(_label)
  msgField.appendChild(_textarea)
  body.appendChild(msgField)

  // Email field
  const emailField = document.createElement('div')
  emailField.className = 'fp-field'

  const emailLabel = document.createElement('div')
  emailLabel.className = 'fp-field-label'
  emailLabel.textContent = 'YOUR EMAIL'

  _emailInput = document.createElement('input')
  _emailInput.type = 'email'
  _emailInput.className = 'fp-email'
  _emailInput.placeholder = 'your@email.com (optional)'

  emailField.appendChild(emailLabel)
  emailField.appendChild(_emailInput)
  body.appendChild(emailField)

  // Submit
  _submitBtn = document.createElement('button')
  _submitBtn.className = 'fp-submit'
  _submitBtn.textContent = 'SEND'
  _submitBtn.addEventListener('click', handleSubmit)
  body.appendChild(_submitBtn)

  // Status
  _statusEl = document.createElement('div')
  _statusEl.className = 'fp-status'
  body.appendChild(_statusEl)

  _panel.appendChild(body)

  document.body.appendChild(_backdrop)
  document.body.appendChild(_panel)

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && _panel.classList.contains('open')) closeFeedbackPanel()
  })
}

async function handleSubmit() {
  const message = _textarea.value.trim()
  if (message.length < 10) {
    _statusEl.textContent = 'Message must be at least 10 characters.'
    _statusEl.className = 'fp-status error'
    _textarea.focus()
    return
  }

  _submitBtn.disabled = true
  _submitBtn.textContent = 'SENDING…'
  _statusEl.textContent = ''
  _statusEl.className = 'fp-status'

  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        type: _activeType,
        email: _emailInput.value.trim(),
      }),
    })
    if (!res.ok) throw new Error('Server error')
    _statusEl.textContent = 'Got it. Thanks for taking the time.'
    _statusEl.className = 'fp-status success'
    _submitBtn.textContent = 'SENT'
    setTimeout(closeFeedbackPanel, 2000)
  } catch {
    _statusEl.textContent = 'Something went wrong. Try again.'
    _statusEl.className = 'fp-status error'
    _submitBtn.disabled = false
    _submitBtn.textContent = 'SEND'
  }
}
