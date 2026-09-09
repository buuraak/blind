# DESIGN-PRINCIPLES.md

The general aesthetic system for editorial, cinematic, restrained sites — the qualities
that made the reference build not look AI-generated.

Project-independent. Every rule is stated so it applies to any future site; values from
the reference build appear as **worked examples**, not as defaults to copy. For that
project's actual values see [`DESIGN.md`](DESIGN.md).

> **Source of authority.** Everything here was either approved or explicitly rejected by
> the client during the reference build. Where something is a judgement call that was
> never put to the test, it is marked *(unverified)*.

---

## 1. The governing instinct: subtract

Every element that read as "loud" in review was removed or muted. Not one review note in
the reference build asked for *more*.

What was cut after being built: an inverted marquee band ("ugly … remove that whole
component"), a horizontal-scroll lookbook, a group fade-out before a transition, and two
invented background colours. Roughly a third of what was built was removed.

**When choosing between adding something and taking something away, take it away.** If a
section needs an explanation to justify it, it is decoration.

---

## 2. Palette

### The rule

**Two colours. Everything else is opacity.**

Pick a ground and an ink. That is the palette. Tone comes from the ink at reduced
opacity, never from new hex values. No accent, no grey token, no tint, no gradient, no
shadow.

```css
/* worked example — reference build */
--bg:  #fff;
--ink: #000;

/* tone, always derived */
opacity: 0.5;              /* secondary type */
rgba(0, 0, 0, 0.14);       /* hairline rules */
rgba(0, 0, 0, 0.05);       /* filled input */
```

### Fix your opacity steps and reuse them

Ad-hoc opacity is how a two-colour palette turns into a mush of greys. Define ~4 steps
and use only those.

| Step | Role | Reference build |
|---|---|---|
| Faint | large background graphics | `0.13` |
| Muted | column heads, labels | `0.40–0.45` |
| Secondary | supporting type, legal | `0.50–0.60` |
| Near-full | links at rest | `0.85–0.90` |

### Never invent a colour — ask

This is the rule that was broken most, and the failure mode is specific enough to name.

It was violated twice in the reference build. First a fully black footer, justified as
*"the page has no accent colour, so black is our equivalent of the reference's coral."*
Then a warm grey ground (`#edecea`), justified as *"a tonal panel, not a black slab and
not more white page."* Both were rejected. The client's words: **"again don't invent
colors."**

Both rationales were coherent. That is the trap: **the failure is not picking a bad
colour, it is picking one and attaching a justification**, which makes it survive review
as a considered decision rather than an unrequested addition.

> **If a surface seems to need a colour, ask. Do not choose one and explain it.**

Audit before finishing:

```bash
grep -nE '#[0-9a-fA-F]{3,6}' path/to/styles.css | grep -viE '#fff|#000'
```

A dark surface is permitted only as a **functional fallback** — e.g. behind a video that
has not painted yet — never as a design surface.

---

## 3. Typography

### Two registers, nothing between them

Almost all AI-generated type systems fail by having four or five sizes at four or five
weights, all sitting mid-scale. Use exactly two registers with a hard gap between them:

| Register | Weight | Case | Tracking | Purpose |
|---|---|---|---|---|
| **Display** | medium (500) | sentence | **negative** (`−0.01` to `−0.03em`) | headlines, statements, prices |
| **Micro-UI** | bold (700) | UPPERCASE | **open** (`+0.02` to `+0.14em`) | labels, nav, meta, legal |

Negative tracking on display and open tracking on micro-UI is most of the "editorial"
feel. Body copy at 400 weight and normal tracking is the register to avoid — it is what
makes a page look like a template.

Worked example — the whole reference build, one family (Helvetica Neue):

| Role | Size | Weight | Tracking |
|---|---|---|---|
| Hero headline | `2.5rem` | 500 | `−0.01em` |
| Section statement | `6.5rem` | 500 | `−0.03em` |
| Product name / price | `1.375rem` | 500 / 400 | `−0.01em` |
| Micro-UI | `max(11px, 0.6875rem)` | 700 | `+0.02` to `+0.14em` |

### The one-gesture rule

Choose **one** typographic gesture — a second family, an italic, a single weight — and
spend it deliberately on one clause per statement. Never a whole line, never decoratively.

In the reference build it is Georgia italic, and it appears on exactly one clause in each
place it is used: `refined` in the hero headline, `looked through.` in the pile
statement, `looking.` in the footer headline, the `Blind` wordmark, and the hovered row
name in the collection index.

That single repeated gesture is what makes the logo, the headline and every section read
as one system. **Do not add a second accent** — a display face plus an italic plus a mono
plus a bold is four gestures and reads as none.

### Fluid sizing, one root

Scale the whole design from a single fluid root and express every dimension in `rem`.
Media queries then become unnecessary.

```css
html { font-size: clamp(11px, 0.833vw, 16px); }   /* worked example */
```

Two permitted exceptions:
- **A hard floor on micro-UI** so it never becomes unreadable: `max(11px, 0.6875rem)`.
- **Genuinely fixed boxes** — e.g. a logo's layout box — which stay `px` and are called
  out as intentional.

### Fit text by measuring, never by `vw`

A `vw` font-size cannot fit text to a container: glyph width depends on font metrics, so
any fixed value either overflows or leaves a gap. In the reference build a wordmark set
at `40vw` clipped its first and last letter. Measure at a reference size and scale by the
ratio. See [`TECHNICAL-PLAYBOOK.md`](TECHNICAL-PLAYBOOK.md) §6 for the implementation.

---

## 4. Spacing, shape, layout

**One gutter value, used everywhere.** A three-step scale is enough for a whole site;
the reference build used `1rem / 1.5rem / 2rem` with `2rem` as the universal page gutter.

**Radii are binary.** Small (images/cards) or full pill (buttons/inputs). Nothing else is
rounded. No `border-radius` on sections, headers, or containers.

**Full-bleed, not centre-constrained.** Sections use the whole viewport width and rely on
emptiness for rhythm. A `max-width: 1200px; margin: 0 auto` container is the single most
recognisable "default AI layout" move.

**Hairlines are the only divider.** One weight, ink at low opacity, e.g.
`1px solid rgba(0,0,0,0.14)`. No thick rules, no boxed cards, no drop shadows.

**Page length.** The reference build is ~9 viewport heights with two pinned sections. Two
pins is the practical ceiling — a third reads as a queue rather than a rhythm.
*(Unverified as a general limit; it is one project's judgement.)*

---

## 5. Motion

### One easing function

Pick one and use it everywhere. The reference build uses `easeOutCubic`:

```js
const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);
```

No cubic-bezier zoo, no per-element curves, no CSS transitions on scroll-driven
properties (they fight the scroll and introduce lag the user reads as jank).

### One entrance/exit vocabulary

Define a single three-property gesture and reuse it for **every** reveal and exit on the
site. That reuse is what makes separate sections read as one film instead of a stack of
components.

The reference vocabulary — **blur-lift-fade**: opacity, a small `y` translation, and a
blur that resolves to sharp, all moving together.

| Gesture | Opacity | Y | Blur |
|---|---|---|---|
| Item exit | `1 → 0` | `0 → −12px` | `0 → 8px` |
| Item enter | `0 → 1` | `+6 → 0` | `6 → 0px` |
| Major exit (headline) | `1 → 0` | `0 → −32px` | `0 → 12px` |
| Section reveal | `0 → 1` | `+22 → 0` | `10 → 0px` |

**Entrances are softer and shorter than exits**, and rise from below rather than dropping
from above (`+6` in vs `−12` out). This asymmetry is deliberate and worth copying.

Clear the filter string entirely below a small threshold (~`0.005`) rather than writing
`blur(0px)`, so no filter layer is kept alive at rest.

### Stagger, don't synchronise

Sequences cascade. Give each item its own window inside the parent's progress, offset by
a fixed stagger.

Worked example — header dismantle, stagger `0.08`, span `0.45`, deliberately
**bottom-of-the-list first** so the menu unbuilds from its base:

```
tagline  [0.00, 0.45]    ABOUT US [0.08, 0.53]    EVENTS [0.16, 0.61]
SERVICES [0.24, 0.69]    BRANDS   [0.32, 0.77]    SHOP   [0.40, 0.85]
```

A deliberate gap between one element finishing and the next starting is a legitimate
beat, not dead time.

### Reveal by uncovering, not by fading

When one layer should replace another, move something physically. Fading the outgoing
layer out first leaves a visible gap.

Two cases from the reference build:
- Cards **scatter outward from a stack** to uncover the statement beneath. The statement
  is never faded in — it is exposed. `z-index` descends so the top card peels first,
  which is what makes it read as a pile coming apart rather than dissolving.
- The footer **slides over** the pinned section above it. An earlier version faded that
  section out first and the client's read was that it looked like a gap.

### Never stack two smoothing layers

A smooth-scroll library and a spring on the same value compound into lag the user reads
as *disconnected*, not smooth. Pick one place to smooth.

Reference build: Lenis does the smoothing (`lerp: 0.055`); the one spring on top of it is
deliberately light (`damping 30 / stiffness 220 / mass 0.6`) and only takes the edge off
a hard flick. A first attempt at `damping 42 / stiffness 130` felt disconnected.

### Reduced motion softens — it does not disable

`prefers-reduced-motion` should keep the structure and remove the discomfort:

- **Drop** eased curves to linear, and remove every blur.
- **Keep** opacity, translation amplitudes, and all structural motion.

A scroll-driven site that switches off entirely under reduced motion is broken, not
accessible.

---

## 6. Interaction

**Hover is a typographic or tonal event, never a colour change.** Rows switch to the
italic gesture; links move between fixed opacity steps. There is no hover colour because
there is no third colour.

**Do not invent states that were not asked for.** The reference commission explicitly
said no hover, focus, or active states beyond what was specified, and no `::selection` or
scrollbar styling. Browser default focus outlines were left intact deliberately.

---

## 7. Voice and copy

Editorial, spare, slightly oblique. Copy is either **a full sentence with a period** or
**uppercase micro-type**. Sentence-case UI labels are the tell of a template.

**Write in the product's own vocabulary.** Reference build: `HANDCUT`, `ACETATE`,
`ONE OF ONE`, `ATELIER SERIES`; model names as a noun plus a four-digit reference
(`Fleuris 1005`).

**Let statements carry a double meaning tied to the product.** *"Frame your face's
refined expression."* · *"Made to be looked through."* · *"The right amount of looking."*
Each works literally for eyewear and figuratively as brand voice. That is the register to
hit — not a slogan, not a feature claim.

**Copy is verbatim.** When copy is specified, reproduce it exactly, including typographic
apostrophes (`’`, not `'`). Do not paraphrase, expand, or "improve" it.

---

## 8. Scope discipline

Build what was asked. Nothing else.

Multiple rounds of the reference build were spent removing things that were added without
being requested — a component, two background colours, a fade. Each addition cost a
review cycle and a removal cycle.

- Do not add sections, colours, copy, dependencies, or states that were not requested.
- When a design decision is genuinely open, **ask**. Do not decide and write a
  justification — a justification is what lets an unrequested change pass review.
- Presenting 3–4 concrete options and letting the client pick works well. The logo was
  chosen this way: four directions, shown on both light and dark, chosen in one message.

---

## 9. Banned list — the "default AI design" moves

Every one of these was either caught in review or explicitly forbidden in the
commissioning brief for the reference build.

**Colour**
- Inventing a background colour for a section, then justifying it
- An accent colour nobody asked for
- Gradients, mesh backgrounds, glows, neon
- Drop shadows and elevation systems
- Introducing a grey token instead of using ink-at-opacity

**Layout**
- A centred `max-width` container as the default page wrapper
- Card grids with borders, shadows, and rounded corners on everything
- Rounding every surface — sections, headers, containers
- Icon + heading + paragraph "feature" triplets
- Adding breakpoints and a separate mobile layout where a fluid root would do

**Typography**
- Four-plus sizes all sitting mid-scale at the same weight
- Multiple accent faces (a display face *and* an italic *and* a mono)
- Sentence-case UI labels
- Default tracking everywhere — no negative on display, no open on micro-UI
- Sizing text to a container with `vw` instead of measuring it

**Motion**
- A different easing curve per element
- CSS transitions on scroll-linked properties
- Synchronised reveals where everything appears at once
- Stacking a smooth-scroll library and a spring on the same value
- Disabling all motion under `prefers-reduced-motion` instead of softening it
- Fading a layer out before a transition instead of covering it

**Process**
- Adding components, states, or copy that were not requested
- "Helpfully" adding `overflow: hidden` or `will-change` to an element that was
  deliberately left without them
- Inventing hover/focus/selection styling where none was specified
- Paraphrasing copy that was given verbatim
