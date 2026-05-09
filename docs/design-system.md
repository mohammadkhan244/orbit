# ORBIT — Design System

## Color System (strict — no exceptions)

```js
background:  #0a0a0a
text:        #f0ece4
accent:      #b87333  // firelight copper
```

Rgba variants only for opacity. No green. No purple. No other hues.

---

## Typography

- Display / headers / labels: **Courier Prime**
- Body / UI text: **DM Sans**
- No Inter, no Roboto, no system fonts

---

## Layout

- Two-column: left sidebar (tracker/nav), right main panel (active view)
- Dark, editorial, minimal
- No generic SaaS patterns

---

## Orbital Visualization

- Central circle: small, copper glow, labeled "ORBIT"
- 4 concentric rings expanding outward
- Ring labels: Conversation / Replied / Reached Out / Identified
- Nodes: small circles, initials or first name
- Node state — default: subtle copper glow, hover: brighter pulse
- Side panel: slides in from right on node click

---

## Progress Bar

- Top of Orbit view
- Label: "X / 100 conversations"
- Color: copper (#b87333)

---

## Empty State

- Rings visible, no nodes
- Center text: "Add your first moonshot."

---

## Motion Principles

- Nodes pulse subtly — CSS animation, not JS-driven
- Side panel: slide-in transition only
- No gratuitous animation
- Performance over spectacle
