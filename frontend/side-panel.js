function injectStyles() {
  if (document.getElementById('orbit-panel-styles')) return
  const s = document.createElement('style')
  s.id = 'orbit-panel-styles'
  s.textContent = `
    .orbit-side-panel {
      position: absolute;
      top: 0; right: 0;
      width: 320px; height: 100%;
      background: rgba(10,10,10,0.96);
      border-left: 1px solid rgba(184,115,51,0.15);
      transform: translateX(100%);
      transition: transform 300ms ease;
      overflow-y: auto;
      z-index: 10;
    }
    .orbit-side-panel.open { transform: translateX(0); }

    .panel-close {
      position: absolute; top: 16px; right: 16px;
      background: none; border: none;
      color: rgba(240,236,228,0.35);
      font-size: 14px; line-height: 1; cursor: pointer;
      transition: color 0.15s ease;
    }
    .panel-close:hover { color: #f0ece4; }

    .panel-body { padding: 40px 24px 40px; }

    .panel-name {
      font-family: 'Courier Prime', monospace;
      font-size: 18px; font-weight: 700;
      color: #f0ece4; margin-bottom: 4px;
    }
    .panel-role {
      font-family: 'DM Sans', sans-serif;
      font-size: 12px; color: rgba(240,236,228,0.45);
      margin-bottom: 16px;
    }
    .panel-why {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px; color: rgba(240,236,228,0.72);
      line-height: 1.55; margin-bottom: 16px;
    }
    .panel-link {
      display: block; font-family: 'DM Sans', sans-serif;
      font-size: 12px; color: #b87333;
      text-decoration: none; word-break: break-all;
      margin-bottom: 8px;
    }
    .panel-link:hover { text-decoration: underline; }

    .panel-platform-badge {
      display: inline-block;
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.1em;
      color: rgba(184,115,51,0.8);
      background: rgba(184,115,51,0.08);
      border: 1px solid rgba(184,115,51,0.18);
      border-radius: 2px; padding: 2px 8px;
      text-transform: uppercase; margin-bottom: 24px;
    }

    .panel-field-label {
      display: block;
      font-family: 'Courier Prime', monospace;
      font-size: 10px; letter-spacing: 0.12em;
      color: rgba(240,236,228,0.3);
      margin-bottom: 6px; margin-top: 20px;
    }

    .panel-stage-select,
    .panel-notes {
      width: 100%;
      background: rgba(184,115,51,0.05);
      border: 1px solid rgba(184,115,51,0.18);
      border-radius: 2px;
      color: #f0ece4;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      padding: 8px 10px;
    }
    .panel-stage-select {
      cursor: pointer;
      -webkit-appearance: none; appearance: none;
    }
    .panel-stage-select:focus,
    .panel-notes:focus {
      outline: none;
      border-color: rgba(184,115,51,0.45);
    }
    .panel-notes { resize: vertical; line-height: 1.5; }

    .panel-date-added {
      font-family: 'DM Sans', sans-serif;
      font-size: 11px; color: rgba(240,236,228,0.22);
      margin-top: 24px;
    }
  `
  document.head.appendChild(s)
}

export class SidePanel {
  constructor(container) {
    this.container = container
    this._current = null
    injectStyles()
    this._build()
    document.addEventListener('orbit:node-selected', e => this.open(e.detail))
  }

  _build() {
    const el = document.createElement('div')
    el.className = 'orbit-side-panel'
    el.innerHTML = `
      <button class="panel-close" aria-label="Close panel">✕</button>
      <div class="panel-body">
        <div class="panel-name"></div>
        <div class="panel-role"></div>
        <div class="panel-why"></div>
        <a class="panel-link" target="_blank" rel="noopener noreferrer"></a>
        <span class="panel-platform-badge"></span>

        <label class="panel-field-label">STAGE</label>
        <select class="panel-stage-select">
          <option value="IDENTIFIED">Identified</option>
          <option value="REACHED_OUT">Reached Out</option>
          <option value="REPLIED">Replied</option>
          <option value="CONVERSATION">Conversation</option>
        </select>

        <label class="panel-field-label">NOTES</label>
        <textarea class="panel-notes" rows="4" placeholder="Add a note…"></textarea>

        <div class="panel-date-added"></div>
      </div>
    `

    el.querySelector('.panel-close').addEventListener('click', () => this.close())

    el.querySelector('.panel-stage-select').addEventListener('change', e => {
      if (!this._current) return
      const newStatus = e.target.value
      this._current = { ...this._current, status: newStatus }
      document.dispatchEvent(new CustomEvent('orbit:stage-changed', {
        detail: { id: this._current.name, newStatus }
      }))
    })

    el.querySelector('.panel-notes').addEventListener('blur', e => {
      if (!this._current) return
      document.dispatchEvent(new CustomEvent('orbit:notes-updated', {
        detail: { id: this._current.name, notes: e.target.value }
      }))
    })

    this.container.appendChild(el)
    this.el = el
  }

  open(contact) {
    this._current = contact
    this.el.querySelector('.panel-name').textContent = contact.name
    this.el.querySelector('.panel-role').textContent = contact.role
    this.el.querySelector('.panel-why').textContent = contact.why
    const link = this.el.querySelector('.panel-link')
    link.href = contact.url
    link.textContent = contact.url
    this.el.querySelector('.panel-platform-badge').textContent = contact.platform
    this.el.querySelector('.panel-stage-select').value = contact.status
    this.el.querySelector('.panel-notes').value = contact.notes || ''
    this.el.querySelector('.panel-date-added').textContent = `Added ${contact.date_added}`
    this.el.classList.add('open')
  }

  close() {
    this.el.classList.remove('open')
    this._current = null
  }
}
