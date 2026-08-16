# Blind by Glamour — brand & design guide

A fictional luxury eyewear atelier selling art-object frames. The site behaves like a
scroll-driven film rather than a page.

The governing instinct is **restraint**. Every element that felt "loud" in review was
removed or muted. When a choice is between adding something and taking something
away, take it away.

---

## 1. Palette

| Token | Value | Use |
|---|---|---|
| `--bg` | `#fff` | every surface |
| `--ink` | `#000` | all type |
| `--ink-inverse` | `#fff` | type over the video |
| `--surface` | `#fff` | declared, unused |

**That is the entire palette.** There is no accent, no grey token, no tint, no
gradient, no shadow.

### Tone comes from opacity, never from a new colour

```css
opacity: 0.5;                    /* muted UI type */
rgba(0, 0, 0, 0.14);             /* hairline rules */
rgba(0, 0, 0, 0.05);             /* filled input */
```

Established opacity steps: **0.4–0.45** (column heads), **0.5–0.6** (secondary type,
legal), **0.85–0.9** (footer links at rest), **0.13** (the footer wordmark).

### This rule has been broken twice

Once with a fully black footer, once with a warm grey ground (`#edecea`). Both were
rejected. Both had a written rationale that sounded reasonable at the time — "black is
our equivalent of the reference's coral" — and both were still additions nobody asked
for.

**If a surface seems to need a colour, ask. Do not choose one and justify it.**

The only permitted dark surface is `.hero-window`'s `#000`, which is a fallback behind
the video, not a design colour.

---

## 2. Typography

Two system families. No webfonts, no `next/font`.

```css
--font-sans:         "Helvetica Neue", Helvetica, Arial, sans-serif;
--font-serif-italic: Georgia, "Times New Roman", serif;
```

### The one-italic-gesture rule

Georgia italic is the **only** typographic gesture on the site and it is spent
deliberately, never decoratively. It appears on:

- `refined` in the hero headline
- the `Blind` wordmark
- `looked through.` in the pile statement
- `looking.` in the footer headline
- the hovered row name in the collection index
- the giant footer watermark

That is the pattern: **one italic clause per statement, never a whole line.** It is
what ties the logo, the headline, and every section together. Do not add a second
accent typeface, weight, or style to compete with it.

### Fluid root

```css
html { font-size: clamp(11px, 0.833vw, 16px); }
```

Resolves to 11px at ≤1320px, 16px at ≥1920px. **Every** dimension is in `rem` so the
whole design scales with viewport width. Do not convert `rem` to fixed `px`.

Two exceptions, both intentional: the `130 × 56` brand-mark box, and micro-UI type
floored with `max(11px, …)` so it never becomes unreadable.

### Scale

| Role | Size | Weight | Tracking |
|---|---|---|---|
| Hero headline | `2.5rem` | 500 | `-0.01em` |
| Pile statement | `6.5rem` | 500 | `-0.03em` |
| Footer headline | `4rem` | 500 | `-0.03em` |
| Collection row | `3.25rem` | 500 | `-0.02em` |
| Product name / price | `1.375rem` | 500 / 400 | `-0.01em` |
| Micro-UI (`--fs-ui`) | `max(11px, 0.6875rem)` | 700 | `+0.02em`–`+0.14em` |
| Pill label (`--fs-brand`) | `max(11px, 0.75rem)` | 700 | `+0.06em` |

Display type is **medium (500) with negative tracking**. UI type is **bold (700)
uppercase with open tracking**. Those are the only two registers — nothing sits
between them.

---

## 3. Spacing & shape

```css
--space-4: 1rem;   --space-5: 1.5rem;   --space-6: 2rem;
--radius-sm: 0.375rem;   --radius-pill: 999px;
```

`--space-6` (2rem) is the page gutter everywhere. Radii are only ever `--radius-sm`
(image corners) or `--radius-pill` (buttons and inputs). Nothing else is rounded.

---

## 4. Motion

### One easing function

```ts
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
```

No cubic-bezier, no CSS transitions on scroll-driven properties. The one exception is
the `[0.22, 1, 0.36, 1]` curve on discrete `whileInView` reveals, which is the same
shape expressed for Motion's tween API.

### One vocabulary: blur-lift-fade

Every entrance and exit on the site is the same three properties moving together —
opacity, a small `y` translation, and a blur that resolves to sharp. Reusing it is
what makes separate sections read as one film.

| Gesture | Opacity | Y | Blur |
|---|---|---|---|
| Header item exit | `1 → 0` | `0 → −12px` | `0 → 8px` |
| MENU enter | `0 → 1` | `+6 → 0` | `6 → 0px` |
| Headline / CTA exit | `1 → 0` | `0 → −32px` | `0 → 12px` |
| Product enter | `0 → 1` | — | `12 → 0px` |
| Footer reveal | `0 → 1` | `+22 → 0` | `10 → 0px` |

Entrances are **softer and shorter** than exits (`+6` vs `−12`), and rise from below
rather than dropping from above.

Clear the filter string entirely below ~0.005 rather than writing `blur(0px)`, so no
filter layer is kept alive at rest.

### Stagger

Sequences cascade rather than firing together. Header exits run **bottom-of-the-list
first** (ABOUT US → EVENTS → SERVICES → BRANDS → SHOP), stagger `0.08`, span `0.45`.
The pile scatters with stagger `0.035`; the footer reveals with `0.08`.

### Do not stack two smoothing layers

Lenis already smooths the scroll (`lerp: 0.055`). A heavy spring on top of that reads
as disconnected from the wheel, not smooth. The pile's spring is deliberately light
(`damping 30 / stiffness 220 / mass 0.6`) and only takes the edge off a hard flick.

### Reduced motion

`prefers-reduced-motion` does **not** disable the site. It drops the easing to linear
and removes every blur. Opacity and translation amplitudes are unchanged.

---

## 5. Voice

Editorial, spare, slightly oblique. Copy is either a full sentence with a period, or
uppercase micro-type — never sentence-case UI labels.

Product language is atelier language: `HANDCUT`, `ACETATE`, `ONE OF ONE`,
`ATELIER SERIES`. Model names are French nouns with a four-digit reference
(`Fleuris 1005`, `Orchidée 2200`).

Statements lean on the double meaning of sight: *"Frame your face's refined
expression."*, *"Made to be looked through."*, *"The right amount of looking."* If you
write new copy, that is the register to hit.

---

## 6. Component patterns

**Pills** — `min-height: 3rem`, `padding: 0 2.5rem`, `border-radius: 999px`, solid
`--ink` with `--ink-inverse` label. Over the video they use double-`difference`
(see `docs/ARCHITECTURE.md`).

**Section head** — a `space-between` row of an uppercase label and a muted count:
`THE COLLECTION` / `SIX FRAMES · 2026`. Every Act 2 section opens with one.

**Hairlines** — `1px solid rgba(0,0,0,0.14)`. The only divider treatment.

**Hover** — a typographic or tonal event, never a colour change. Rows switch to
Georgia italic; links move between opacity steps.

**Images** — always `object-fit: cover` in a `--radius-sm` box, no border, no shadow.

---

## 7. Layout

Full-bleed, gutter `--space-6`. Nothing is centre-constrained by a max-width container
— sections use the whole viewport width and rely on generous emptiness instead.

The page is **~9 viewport heights** end to end. Two pinned sections (hero, pile) is
the ceiling; a third would read as a queue rather than a rhythm.
