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
  }

  mount(contacts) {
    this.contacts = contacts
    injectStyles()
    this._ro.observe(this.container)
  }

  update(contacts) {
    this.contacts = contacts
    this._render()
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
    this.svg = svg

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
    svg.appendChild(svgEl('circle', { cx, cy, r: 40, fill: 'rgba(184,115,51,0.06)' },
      { filter: 'drop-shadow(0 0 12px rgba(184,115,51,0.5))' }))

    const centerCircle = svgEl('circle', {
      cx, cy, r: 20,
      fill: COLORS.bg, stroke: COLORS.accent, 'stroke-width': '1.5',
    }, { filter: 'drop-shadow(0 0 6px rgba(184,115,51,0.65))' })
    svg.appendChild(centerCircle)

    const centerLabel = svgEl('text', {
      x: cx, y: cy + 4,
      'text-anchor': 'middle',
      fill: COLORS.accent,
      'font-family': 'Courier Prime, monospace',
      'font-size': '8',
      'letter-spacing': '2',
    }, { pointerEvents: 'none' })
    centerLabel.textContent = 'ORBIT'
    svg.appendChild(centerLabel)

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
        document.dispatchEvent(new CustomEvent('orbit:node-selected', { detail: { ...contact } }))
      })

      svg.appendChild(g)
    }

    this.container.appendChild(svg)
  }
}
