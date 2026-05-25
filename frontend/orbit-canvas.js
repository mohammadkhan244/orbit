import { STAGES } from '../shared/stages.js'
import { COLORS } from '../shared/colors.js'

// Deterministic string → non-negative integer. No external dependency.
function stableHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function injectStyles() {
  if (document.getElementById('orbit-canvas-styles')) return
  const s = document.createElement('style')
  s.id = 'orbit-canvas-styles'
  s.textContent = `
    @keyframes orbit-pulse {
      0%, 100% { opacity: 0.07; }
      50%       { opacity: 0.22; }
    }
  `
  document.head.appendChild(s)
}

const NS = 'http://www.w3.org/2000/svg'

function svgEl(tag, attrs = {}, styles = {}) {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v)
  for (const [k, v] of Object.entries(styles)) e.style[k] = v
  return e
}

export class OrbitCanvas {
  constructor(container) {
    this.container = container
    this.contacts = []
    this.svg = null
    this._ro = new ResizeObserver(() => this._render())

    document.addEventListener('orbit:stage-changed', e => {
      const { id, newStatus } = e.detail
      const updated = this.contacts.map(c =>
        c.id === id ? { ...c, status: newStatus } : c
      )
      const changed = updated.some((c, i) => c !== this.contacts[i])
      if (changed) { this.contacts = updated; this._render() }
    })
  }

  mount(contacts) {
    this.contacts = contacts
    injectStyles()
    this._ro.observe(this.container)
  }

  update(contacts) {
    const prev = this.contacts
    this.contacts = contacts

    const changed = contacts.filter(c => {
      const old = prev.find(p => p.id === c.id)
      return old && old.status !== c.status
    })

    if (changed.length > 0 && contacts.length === prev.length) {
      this._render()
    } else {
      this._render()
    }
  }

  destroy() {
    this._ro.disconnect()
    this.svg?.remove()
  }

  _render() {
    const { width, height } = this.container.getBoundingClientRect()
    if (!width || !height) return

    const cx = width / 2
    const cy = height / 2

    // 4 rings evenly spaced inside the safe area
    const safeR = Math.min(width, height) / 2 - 52
    const step  = safeR / 4.2
    const RING_R = {
      1: safeR - step * 3,
      2: safeR - step * 2,
      3: safeR - step,
      4: safeR,
    }

    this.svg?.remove()
    const svg = svgEl('svg', { width, height }, { display: 'block' })
    svg.style.transition = 'all 0.3s ease'
    this.svg = svg

    // ── touch drag state (scoped to this render) ──
    let dragTarget = null
    let dragStartClient = null

    svg.addEventListener('touchmove', e => {
      if (!dragTarget) return
      e.preventDefault()
      const touch = e.touches[0]
      const dx = touch.clientX - dragStartClient.x
      const dy = touch.clientY - dragStartClient.y
      dragTarget.g.setAttribute('transform', `translate(${dx},${dy})`)
    }, { passive: false })

    svg.addEventListener('touchend', e => {
      if (!dragTarget) return
      const touch = e.changedTouches[0]
      const dx = touch.clientX - dragStartClient.x
      const dy = touch.clientY - dragStartClient.y
      const { g, contact } = dragTarget
      dragTarget = null
      dragStartClient = null

      if (Math.hypot(dx, dy) < 10) {
        g.removeAttribute('transform')
        const live = (window.ORBIT_CONTACTS || []).find(c => c.id === contact.id) || contact
        document.dispatchEvent(new CustomEvent('orbit:node-selected', { detail: { ...live } }))
        return
      }

      const rect = svg.getBoundingClientRect()
      const finalX = touch.clientX - rect.left
      const finalY = touch.clientY - rect.top
      const dist = Math.hypot(finalX - cx, finalY - cy)

      let bestRing = 4, bestDiff = Infinity
      for (const [ring, r] of Object.entries(RING_R)) {
        const diff = Math.abs(r - dist)
        if (diff < bestDiff) { bestDiff = diff; bestRing = Number(ring) }
      }

      const stageEntry = Object.entries(STAGES).find(([, s]) => s.ring === bestRing)
      if (stageEntry) {
        document.dispatchEvent(new CustomEvent('orbit:stage-changed', {
          detail: { id: contact.id, newStatus: stageEntry[0] }
        }))
      }
    })

    // ── rings ──
    const stageEntries = Object.entries(STAGES).sort((a, b) => b[1].ring - a[1].ring)
    for (const [, stage] of stageEntries) {
      const r = RING_R[stage.ring]
      svg.appendChild(svgEl('circle', {
        cx, cy, r, fill: 'none',
        stroke: 'rgba(184,115,51,0.12)', 'stroke-width': '1',
      }))
      const lbl = svgEl('text', {
        x: cx, y: cy - r - 10,
        'text-anchor': 'middle',
        fill: 'rgba(240,236,228,0.22)',
        'font-family': 'Courier Prime, monospace',
        'font-size': '10',
        'letter-spacing': '2',
      })
      lbl.textContent = stage.label.toUpperCase()
      svg.appendChild(lbl)
    }

    // ── center ──
    const firstName = window.ORBIT_IDENTITY?.name
      ? window.ORBIT_IDENTITY.name.split(' ')[0].slice(0, 8).toUpperCase()
      : null
    const centerLabelText = firstName || 'YOU'
    const centerFontSize  = centerLabelText.length > 5 ? '7' : '8'

    const centerG = document.createElementNS(NS, 'g')
    centerG.style.cursor = 'pointer'

    const centerGlow = svgEl('circle', { cx, cy, r: 40, fill: 'rgba(184,115,51,0.06)' },
      { filter: 'drop-shadow(0 0 12px rgba(184,115,51,0.5))' })
    centerG.appendChild(centerGlow)

    const centerCircle = svgEl('circle', {
      cx, cy, r: 20,
      fill: COLORS.bg, stroke: COLORS.accent, 'stroke-width': '1.5',
    }, { filter: 'drop-shadow(0 0 6px rgba(184,115,51,0.65))' })
    centerG.appendChild(centerCircle)

    const centerLabel = svgEl('text', {
      x: cx, y: cy + 4,
      'text-anchor': 'middle',
      fill: COLORS.accent,
      'font-family': 'Courier Prime, monospace',
      'font-size': centerFontSize,
      'letter-spacing': centerLabelText.length > 5 ? '1' : '2',
    }, { pointerEvents: 'none' })
    centerLabel.textContent = centerLabelText
    centerG.appendChild(centerLabel)

    centerG.addEventListener('mouseenter', () => {
      centerCircle.setAttribute('stroke', COLORS.text)
      centerCircle.style.filter = 'drop-shadow(0 0 10px rgba(184,115,51,0.9))'
    })
    centerG.addEventListener('mouseleave', () => {
      centerCircle.setAttribute('stroke', COLORS.accent)
      centerCircle.style.filter = 'drop-shadow(0 0 6px rgba(184,115,51,0.65))'
    })
    centerG.addEventListener('click', () => {
      document.getElementById('gravity-profile-link')?.click()
    })

    svg.appendChild(centerG)

    // ── empty state hint ──
    if (this.contacts.length === 0) {
      const hint = svgEl('text', {
        x: cx, y: cy + 72,
        'text-anchor': 'middle',
        fill: 'rgba(240,236,228,0.18)',
        'font-family': 'DM Sans, sans-serif',
        'font-size': '12',
        'letter-spacing': '0',
      }, { pointerEvents: 'none' })
      hint.textContent = 'Search or Suggest to begin'
      svg.appendChild(hint)
    }

    // ── nodes ──
    for (const contact of this.contacts) {
      const stage = STAGES[contact.status]
      if (!stage) continue

      const r        = RING_R[stage.ring]
      const angleDeg = stableHash(contact.name + (contact.id ?? '')) % 360
      const rad      = angleDeg * Math.PI / 180
      const nx       = cx + r * Math.cos(rad)
      const ny       = cy + r * Math.sin(rad)
      const delay    = (stableHash(contact.name) % 20) * 0.15

      const g = document.createElementNS(NS, 'g')
      g.style.cursor = 'pointer'
      g.style.transition = 'transform 0.6s ease'

      // subtle pulse halo
      const halo = svgEl('circle', { cx: nx, cy: ny, r: 24, fill: 'rgba(184,115,51,0.09)' })
      halo.style.animation = `orbit-pulse 3s ease-in-out ${delay}s infinite`
      g.appendChild(halo)

      // node body
      const node = svgEl('circle', {
        cx: nx, cy: ny, r: 16,
        fill: COLORS.bg, stroke: COLORS.accent, 'stroke-width': '1.5',
      }, { filter: 'drop-shadow(0 0 4px rgba(184,115,51,0.45))' })
      g.appendChild(node)

      // initials label
      const lbl = svgEl('text', {
        x: nx, y: ny + 5,
        'text-anchor': 'middle',
        fill: COLORS.text,
        'font-family': 'Courier Prime, monospace',
        'font-size': '11',
        'font-weight': '700',
      }, { pointerEvents: 'none', userSelect: 'none' })
      lbl.textContent = initials(contact.name)
      g.appendChild(lbl)

      g.addEventListener('mouseenter', () => {
        node.style.filter = 'drop-shadow(0 0 10px rgba(184,115,51,0.9))'
        node.setAttribute('stroke', COLORS.text)
      })
      g.addEventListener('mouseleave', () => {
        node.style.filter = 'drop-shadow(0 0 4px rgba(184,115,51,0.45))'
        node.setAttribute('stroke', COLORS.accent)
      })
      g.addEventListener('click', () => {
        const live = (window.ORBIT_CONTACTS || []).find(c => c.id === contact.id) || contact
        document.dispatchEvent(new CustomEvent('orbit:node-selected', { detail: { ...live } }))
      })

      g.addEventListener('touchstart', e => {
        e.preventDefault()
        const touch = e.touches[0]
        dragTarget = { g, contact }
        dragStartClient = { x: touch.clientX, y: touch.clientY }
      }, { passive: false })

      svg.appendChild(g)
    }

    this.container.appendChild(svg)
  }
}
