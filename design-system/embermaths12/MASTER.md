# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Ember Maths12
**Generated:** 2026-08-11 21:03:30
**Updated:** 2026-08-11 — Black & Gold brand overrides from README
**Category:** Online Course/E-learning (CAPS Grade 12 Mathematics)
**Design Dials:** Variance 5/10 (Balanced / Modern) | Motion 6/10 (Standard) | Density 3/10 (Spacious)

---

## Global Rules

### Color Palette (Black & Gold Elegance — project source of truth)

| Role | Hex | CSS / Tailwind |
|------|-----|----------------|
| White | `#FFFFFF` | `--ember-white` / `ember-white` |
| Light gray | `#E5E5E5` | `--ember-gray` / `ember-gray` |
| Gold (CTA) | `#FCA311` | `--ember-gold` / `ember-gold` |
| Navy (primary) | `#14213D` | `--ember-navy` / `ember-navy` |
| Black | `#000000` | `--ember-black` / `ember-black` |
| Muted text | `#6B7280` | `--muted` |
| Surface | `#F7F7F8` | `--surface` |
| Border | `#D4D4D8` | `--border` |
| Success | `#0F766E` | `--success` |
| Danger | `#B91C1C` | `--danger` |

**Color Notes:** README Black & Gold Elegance overrides skill teal/amber defaults. Gold CTAs on navy use navy text for contrast.

### Typography

- **Heading Font:** Fraunces (`next/font` — `--font-fraunces` / `font-display`)
- **Body Font:** Outfit (`next/font` — `--font-outfit` / `font-sans`)
- **Mood:** academic elegance, modern South African CAPS school — not playful kids type
- **Do not** load fonts via external `@import` / Google Fonts links; use `next/font`

### Spacing Variables

*Density: 3/10 — Spacious*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `24px` / `1.5rem` | Standard padding |
| `--space-lg` | `32px` / `2rem` | Section padding |
| `--space-xl` | `48px` / `3rem` | Large gaps |
| `--space-2xl` | `64px` / `4rem` | Section margins |
| `--space-3xl` | `96px` / `6rem` | Hero padding |

### Shadow Depths (Soft UI Evolution)

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(20,33,61,0.06)` | Subtle lift |
| `--shadow-md` | `0 4px 12px rgba(20,33,61,0.08)` | Interactive cards |
| `--shadow-lg` | `0 10px 24px rgba(20,33,61,0.12)` | Hover elevation |
| `--shadow-xl` | `0 20px 40px rgba(20,33,61,0.16)` | Featured surfaces |

---

## Component Specs

### Buttons

```css
.btn-primary {
  background: #FCA311;
  color: #14213D;
  padding: 12px 24px;
  min-height: 44px;
  border-radius: 8px;
  font-weight: 700;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:focus-visible {
  outline: 2px solid #FCA311;
  outline-offset: 3px;
}

.btn-secondary {
  background: transparent;
  color: #FFFFFF;
  border: 1px solid rgba(255,255,255,0.3);
  padding: 12px 24px;
  min-height: 44px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-secondary:hover {
  border-color: #FCA311;
  color: #FCA311;
}
```

### Interactive cards (roles only — not decorative)

```css
.card-interactive {
  background: #FFFFFF;
  border: 1px solid #D4D4D8;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: border-color 200ms ease, box-shadow 200ms ease;
  cursor: pointer;
}

.card-interactive:hover {
  border-color: #FCA311;
  box-shadow: var(--shadow-md);
}
```

---

## Style Guidelines

**Style:** Soft UI Evolution + Black & Gold brand

**Keywords:** subtle depth, accessibility-focused, improved shadows, CAPS academic, navy/gold elegance

**Key Effects:** Soft shadows, 200–300ms transitions, focus visible, WCAG AA+, Lucide outline icons

### Page Pattern

**Pattern Name:** Hero + Features + CTA (Feature-Rich)

- **CTA Placement:** Above fold + final contact CTA
- **Section Order:** Hero → CAPS rhythm → Features → Join roles → Mission → Contact/CTA → Footer
- **Signature visual:** Full-bleed navy hero with term/week CAPS rhythm diagram as dominant product anchor

### Brand mark

`Ember Maths` + gold `12` → **Ember Maths12**

Demo emails (`*@ember12.za`), password (`ember12`), and storage keys stay unchanged.

---

## Motion

CSS-only (no GSAP dependency):

- Hero rise-in: 0.7–0.8s ease-out
- Feature stagger: ~0.06s delay steps via animation-delay
- Glow on primary CTA: soft gold pulse
- Scroll reveal: fade + 12px translateY, 300–400ms
- Always honor `@media (prefers-reduced-motion: reduce)`

---

## Anti-Patterns (Do NOT Use)

- ❌ Emojis as icons — use Lucide SVG
- ❌ Missing `cursor-pointer` on clickables
- ❌ Cards in hero / decorative card grids
- ❌ Low contrast muted-on-muted text
- ❌ Instant state changes (use 150–300ms)
- ❌ Invisible focus / `outline-none` without replacement
- ❌ Teal/playful kids fonts (Baloo, Comic Neue)
- ❌ Purple-on-white or cream+terracotta AI-default looks

---

## Pre-Delivery Checklist

- [ ] No emojis used as icons (use Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150–300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] Mobile nav available (not desktop-only)
- [ ] Skip-to-main link present
- [ ] No horizontal scroll on mobile
