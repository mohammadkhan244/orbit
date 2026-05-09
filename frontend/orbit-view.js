import { OrbitCanvas } from './orbit-canvas.js'
import { SidePanel } from './side-panel.js'

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
    }
  `
  document.head.appendChild(s)
}

async function init() {
  const container = document.getElementById('orbit-view')
  if (!container) return

  injectStyles()

  const res = await fetch('/data/mockContacts.json')
  let contacts = await res.json()

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
    contacts = contacts.map(c => c.name === id ? { ...c, status: newStatus } : c)
    canvas.update(contacts)
    updateProgress(contacts)
  })

  document.addEventListener('orbit:notes-updated', e => {
    const { id, notes } = e.detail
    contacts = contacts.map(c => c.name === id ? { ...c, notes } : c)
  })
}

init()
