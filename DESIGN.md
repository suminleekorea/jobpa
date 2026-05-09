---
version: alpha
name: jobpa
description: >
  JobPA is a dark, focused career-strategy dashboard. The visual language borrows
  Linear's near-black depth and tight editorial spacing with Notion's clean Inter
  typography and restrained card geometry. The result is a premium productivity
  tool that feels handcrafted — not AI-generated. Surfaces are dark, text is
  crisp off-white, and the single accent color (indigo-blue) drives all
  interactive affordances.

colors:
  # Core palette
  background:      "#0a0b0d"   # near-black page background
  surface:         "#111318"   # card / panel background
  surface-raised:  "#181c23"   # elevated card (hover, modal)
  border:          "#ffffff12" # hairline divider (near-transparent white)
  border-strong:   "#ffffff22" # slightly visible border for cards

  # Text
  text-primary:    "#f0f1f3"   # headings, primary body
  text-secondary:  "#8b8f9a"   # muted labels, metadata
  text-tertiary:   "#4e5260"   # placeholder, disabled

  # Accent — indigo-blue (single brand color)
  accent:          "#5b6af0"   # primary CTA, active nav, links
  accent-hover:    "#4a58e0"
  accent-subtle:   "#5b6af014" # tinted backgrounds for badges/chips
  accent-border:   "#5b6af030"

  # Semantic
  success:         "#22c55e"
  success-subtle:  "#22c55e14"
  warning:         "#f59e0b"
  warning-subtle:  "#f59e0b14"
  error:           "#ef4444"
  error-subtle:    "#ef444414"

typography:
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
  fontFeature: "ss01, ss02, cv01, cv03"

  headline-display:
    fontSize: 48px
    lineHeight: 52px
    letterSpacing: -1.2px
    fontWeight: 600

  headline-lg:
    fontSize: 32px
    lineHeight: 38px
    letterSpacing: -0.64px
    fontWeight: 600

  headline-md:
    fontSize: 20px
    lineHeight: 28px
    letterSpacing: -0.2px
    fontWeight: 600

  headline-sm:
    fontSize: 16px
    lineHeight: 24px
    letterSpacing: -0.1px
    fontWeight: 600

  body-lg:
    fontSize: 15px
    lineHeight: 24px
    letterSpacing: -0.1px
    fontWeight: 400

  body-md:
    fontSize: 14px
    lineHeight: 20px
    letterSpacing: 0px
    fontWeight: 400

  body-sm:
    fontSize: 13px
    lineHeight: 18px
    letterSpacing: 0px
    fontWeight: 400

  label-lg:
    fontSize: 14px
    lineHeight: 20px
    letterSpacing: 0.1px
    fontWeight: 500

  label-md:
    fontSize: 13px
    lineHeight: 18px
    letterSpacing: 0.1px
    fontWeight: 500

  label-sm:
    fontSize: 12px
    lineHeight: 16px
    letterSpacing: 0.2px
    fontWeight: 500

rounded:
  none: 0px
  xs:   3px
  sm:   6px
  md:   10px
  lg:   14px
  xl:   20px
  full: 9999px

spacing:
  xs:  4px
  sm:  8px
  md:  16px
  lg:  24px
  xl:  40px
  2xl: 64px
  3xl: 96px

components:
  button:
    primary:
      backgroundColor: "{colors.accent}"
      color: "#ffffff"
      borderRadius: "{rounded.md}"
      padding: "8px 16px"
      minHeight: 36px
      fontSize: 14px
      fontWeight: 500
      letterSpacing: -0.1px
      border: none
      boxShadow: "0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
      hover:
        backgroundColor: "{colors.accent-hover}"
    secondary:
      backgroundColor: "{colors.surface-raised}"
      color: "{colors.text-primary}"
      borderRadius: "{rounded.md}"
      padding: "8px 16px"
      minHeight: 36px
      fontSize: 14px
      fontWeight: 500
      border: "1px solid {colors.border-strong}"
      boxShadow: "0 1px 2px rgba(0,0,0,0.3)"
    ghost:
      backgroundColor: transparent
      color: "{colors.text-secondary}"
      borderRadius: "{rounded.md}"
      padding: "8px 12px"
      minHeight: 36px
      fontSize: 14px
      fontWeight: 500
      border: none
      hover:
        backgroundColor: "{colors.border}"
        color: "{colors.text-primary}"

  card:
    backgroundColor: "{colors.surface}"
    borderRadius: "{rounded.lg}"
    border: "1px solid {colors.border-strong}"
    padding: "20px 24px"
    boxShadow: "0 1px 3px rgba(0,0,0,0.4)"

  input:
    backgroundColor: "{colors.surface-raised}"
    color: "{colors.text-primary}"
    borderRadius: "{rounded.md}"
    border: "1px solid {colors.border-strong}"
    padding: "8px 12px"
    fontSize: 14px
    minHeight: 36px
    placeholder:
      color: "{colors.text-tertiary}"
    focus:
      border: "1px solid {colors.accent}"
      boxShadow: "0 0 0 3px {colors.accent-subtle}"

  badge:
    borderRadius: "{rounded.full}"
    padding: "2px 8px"
    fontSize: 12px
    fontWeight: 500
    letterSpacing: 0.2px

  sidebar:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.border}"
    width: 240px
    navItem:
      borderRadius: "{rounded.md}"
      padding: "7px 10px"
      fontSize: 14px
      fontWeight: 500
      color: "{colors.text-secondary}"
      active:
        backgroundColor: "{colors.accent-subtle}"
        color: "{colors.accent}"
        border: "1px solid {colors.accent-border}"

---

# Overview

JobPA's design system is built for **focused, sustained use** — a career dashboard
users return to daily. The visual language is dark and editorial, drawing from
Linear's high-contrast depth and Notion's typographic clarity.

**Design principles:**
1. **Quiet confidence** — no flashy gradients, no glows. Depth through subtle
   borders and layered surfaces.
2. **Typography-first** — Inter at tight tracking. Hierarchy through size and
   weight, not color.
3. **Single accent** — indigo-blue (#5b6af0) is the only saturated color. It
   marks every interactive element: buttons, active nav, links, focus rings.
4. **Functional density** — dashboards show data. Use compact spacing (8-16px)
   inside cards; reserve larger gaps (40px+) for section separation.

---

# Colors

## Background layers (darkest → lightest)
| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#0a0b0d` | Page root, sidebar fill |
| `surface` | `#111318` | Cards, panels, table rows |
| `surface-raised` | `#181c23` | Hover states, modals, inputs |

## Text
| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#f0f1f3` | Headings, primary body |
| `text-secondary` | `#8b8f9a` | Labels, metadata, captions |
| `text-tertiary` | `#4e5260` | Placeholders, disabled |

## Accent
Use `#5b6af0` for **all** interactive affordances: buttons, active nav, links,
focus rings, progress bars. Never introduce a second saturated color.

## Semantic
- Success: `#22c55e` (green) — completed tasks, offers, positive stats
- Warning: `#f59e0b` (amber) — pending, caution
- Error: `#ef4444` (red) — rejection, destructive actions

---

# Typography

Use **Inter** loaded from Google Fonts. Enable OpenType features `ss01 ss02 cv01 cv03`
for cleaner punctuation and numerals.

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

body {
  font-family: 'Inter', system-ui, sans-serif;
  font-feature-settings: "ss01", "ss02", "cv01", "cv03";
  -webkit-font-smoothing: antialiased;
}
```

**Hierarchy rules:**
- Page titles: `headline-lg` (32px, 600, -0.64px tracking)
- Section headings: `headline-md` (20px, 600)
- Card titles: `headline-sm` (16px, 600)
- Body text: `body-lg` (15px, 400)
- Metadata / labels: `label-md` (13px, 500)
- Captions / timestamps: `body-sm` (13px, 400, `text-secondary`)

---

# Layout

## Dashboard shell
```
┌─────────────────────────────────────────────────────┐
│  Sidebar (240px fixed)  │  Main content area         │
│  ─────────────────────  │  ─────────────────────     │
│  Logo + nav items       │  Page header (title + CTA) │
│  ─────────────────────  │  Content grid / list       │
│  User profile (bottom)  │                            │
└─────────────────────────────────────────────────────┘
```

- Sidebar: `surface` background, `border` right edge, 240px wide
- Main: `background` fill, 24px horizontal padding, 32px top padding
- Max content width: 960px (centered within main area)

## Spacing rhythm
- Between page sections: `xl` (40px)
- Between cards in a grid: `md` (16px)
- Inside card padding: `lg` (24px)
- Between label and value: `sm` (8px)
- Icon-to-text gap: `xs` (4px) or `sm` (8px)

---

# Components

## Buttons
- **Primary**: indigo fill, white text, 10px radius, 36px height
- **Secondary**: raised surface, primary text, border, 10px radius
- **Ghost**: transparent, secondary text — for low-priority actions
- All buttons: Inter 14px / 500 weight, -0.1px tracking
- Minimum tap target: 36px height

## Cards
- Background: `surface` (`#111318`)
- Border: 1px `border-strong` (`#ffffff22`)
- Radius: 14px
- Padding: 20px 24px
- Subtle box-shadow for depth

## Inputs & Selects
- Background: `surface-raised`
- Border: 1px `border-strong`
- Focus: indigo border + 3px indigo glow ring
- Placeholder: `text-tertiary`
- Height: 36px (compact) or 40px (comfortable)

## Badges / Status chips
- Pill shape (full radius)
- Semantic color fill at 8% opacity + matching text
- 12px / 500 weight
- Examples:
  - Applied: indigo subtle
  - Interview: amber subtle
  - Offer: green subtle
  - Rejected: red subtle

## Navigation (Sidebar)
- Item: 14px / 500, `text-secondary` default
- Active: `accent-subtle` background, `accent` text, `accent-border` border
- Hover: `border` background (near-transparent white)
- Icon: 16px, same color as text
- Section labels: 11px / 500 / uppercase / `text-tertiary`

## Data tables
- Header row: `surface-raised` background, `text-secondary`, `label-md`
- Body rows: `surface` background, `text-primary`, `body-md`
- Row hover: `surface-raised`
- Row border: 1px `border` bottom

---

# Elevation & Depth

Depth is expressed through **surface layering**, not shadows.

| Layer | Token | Usage |
|-------|-------|-------|
| Base | `background` | Page root |
| Raised | `surface` | Cards, panels |
| Floating | `surface-raised` | Dropdowns, tooltips, modals |

Box shadows are minimal:
- Cards: `0 1px 3px rgba(0,0,0,0.4)`
- Buttons: `0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)`
- Modals: `0 8px 32px rgba(0,0,0,0.6)`

Never use colored glows or dramatic neon effects.

---

# Motion

Keep animations functional and fast:
- Micro-interactions: 120ms ease-out
- Panel/modal open: 180ms ease-out
- Page transitions: 200ms ease-in-out
- No bounce, spring, or playful easing in a productivity tool

---

# Do / Don't

**Do:**
- Use Inter with tight tracking on headings
- Layer surfaces (background → surface → surface-raised)
- Use indigo as the single accent color
- Keep cards flat with subtle borders
- Use semantic colors sparingly for status only

**Don't:**
- Add gradients to backgrounds or cards
- Use multiple accent colors
- Use heavy drop shadows
- Use rounded corners larger than 14px on cards
- Use all-caps body text
- Add decorative illustrations or AI-style blob shapes
