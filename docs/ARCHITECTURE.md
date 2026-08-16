# Architecture & handoff

How the scroll system works, why it is built this way, and what breaks if you change
it. Read alongside [`../CLAUDE.md`](../CLAUDE.md) (invariants) and
[`DESIGN.md`](DESIGN.md) (visual system).

---

## 1. Shape of the page

Two acts. Act 1 is a pinned film; Act 2 is a document that slides over it.

```
<body>                                    ← blended elements MUST be direct children
  header.site-header      fixed  z-100    docks to a white plate as Act 2 arrives
  h1.hero-title           fixed  z-40     blend: difference
  section.hero            fixed  z-10     constant bounds; .hero-window animates inside
  div.hero-footer         fixed  z-20     blend: difference (group)
  article.product         fixed  z-20     NOT blended — true colours
  button.add-btn          fixed  z-20     blend: difference
  div.scroll-spacer       flow   450vh    hero pin track — the only Act 1 flow element
  main.content            flow   z-60     opaque; slides over the fixed hero
    ├ section.collection
    ├ section.pile        z-1    440vh    sticky pin + card scatter
    └ footer.site-footer  z-2   -100vh    slides over the pinned pile
```

Nothing in Act 1 is in normal flow except the spacer. The hero is permanently fixed;
scroll distance comes entirely from the spacer's height.

---

## 2. The pin-and-slide-over pattern

Used twice, identically. It is the page's signature move.

**Mechanism:** a tall track holds a pinned layer; the next section is pulled up into
that track with a negative margin, given a higher `z-index` and an opaque background,
and therefore travels over the stationary layer.

| | Act 1 → Act 2 | Pile → Footer |
|---|---|---|
| Pinned layer | `.hero` (`position: fixed`) | `.pile-pin` (`position: sticky`) |
| Track | `.scroll-spacer` 450vh | `.pile` 440vh |
| Overlapping layer | `.content` z-60 | `.site-footer` z-2 |
| Pulled up by | flow position after spacer | `margin-top: -100vh` |

Verified for the footer: through the whole window the pile's pin sits at
`top: 0` while the footer travels `863 → 647 → 431 → 216 → 0`. The pile does not
move; the footer covers it.

**If you add a section that should slide over something**, copy this. Do not fade the
underlying layer out first — an earlier version faded the pile before the footer
arrived and it read as a gap rather than a transition.

---

## 3. Timeline

All progress values are normalized `0…1` **within a scoped track**, never the document.

### Act 1 — hero (`.scroll-spacer`, 450vh)

| Beat | Window | Change |
|---|---|---|
| Frame expand | `[0, 0.18]` | `.hero-window` top `30vh → 0` |
| Headline + CTA exit | `[0, 0.18]` | opacity `1→0`, y `0→−32`, blur `0→12` |
| Header dismantle | `[0, 0.126]` | per-item, bottom-of-list first |
| MENU enters | `[0.9, 1.0]` of header window | after SHOP clears |
| Product + `+` enter | `[0.18, 0.36]` | opacity `0→1`, blur `12→0` |
| Card scale | `[0.36, 0.88]` | `--card-scale` `1 → 1.9` |
| Video scrub | `[0, 0.88]` | `currentTime 0 → duration` |
| Video hold | `[0.88, 1]` | last frame |

Header exit windows (inside the `[0, 0.126]` sub-track), stagger `0.08`, span `0.45`:
tagline `[0, 0.45]`, ABOUT US `[0.08, 0.53]`, EVENTS `[0.16, 0.61]`,
SERVICES `[0.24, 0.69]`, BRANDS `[0.32, 0.77]`, SHOP `[0.4, 0.85]`.

**Pacing dial:** `.scroll-spacer` height. Everything is normalized, so changing it
scales the video scrub and the choreography together and preserves their relative
rhythm. At 450vh the video consumes ~18px of scroll per source frame, inside the
comfortable 15–25 range. At the original 220vh it was 6.3px/frame, which read as "too
fast" — a 200px flick burned 32 of the video's 145 frames.

### Act 2 — pile (`.pile`, 440vh)

340vh of animation + 100vh of overlap. `ANIM_FRACTION = 340/440 = 0.773` remaps
progress so the animation finishes before the footer's window opens.

Cards start **stacked at centre** and scatter **outward** to the edges, physically
uncovering the statement beneath. The statement is not faded in — it is exposed.
`zIndex` descends so the top card peels away first, which is what makes it read as a
pile coming apart rather than dissolving.

---

## 4. The video scrub

The hero video is scrubbed, never played. No `autoplay`, no `loop`. On
`loadedmetadata` it pauses and seeds `currentTime = 0.001`; from then on only
`currentTime` is assigned, inside one RAF loop.

### Why the source is re-encoded

The original CloudFront file had **1 keyframe across 145 frames** — the whole 6s was a
single GOP, so every seek decoded from the start (24–33ms). Combined with a defensive
30ms throttle and a slow lerp, the video updated at **19Hz and trailed the scroll by
up to 1.3s**.

Re-encoding all-intra (`-g 1`, every frame a keyframe) took seeks to ~5ms, which
allowed the guards to be relaxed:

| | before | after |
|---|---|---|
| Video updates | 18.4 Hz | **105 Hz** |
| Median lag | 0.274s | **0.077s** |
| Worst lag | 1.313s | **0.079s** |

Current constants: `K = 0.3` (lerp), `DEADBAND = 0.02s`, **no timer throttle** —
seeks are paced by an in-flight `seeking` flag alone, cleared on the `seeked` event.

**If scrubbing ever feels laggy again, check the encode first.** It is almost never
the JavaScript; the RAF loop measured 120fps with zero dropped frames even when the
video was stuttering.

---

## 5. `mix-blend-mode` details

Four elements blend against the video. Three still do; `.site-header` no longer does.

**Double-difference on pills.** A pill is `background: #fff; color: #fff` with
`mix-blend-mode: difference`, and its label carries a *second* `difference`. The outer
blend inverts the white pill against the video; the inner inverts the label back, so
it reads as the original video pixel and stays legible on any frame. Remove either
layer and the label disappears.

**Why the header stopped blending.** `difference` against a bright video produces
muddy mid-greys exactly where the persistent nav lives. It is now solid `--ink`. At
rest this is visually identical — white under `difference` over a white page already
resolves to `255−255 = 0`.

Two consequences to respect:

1. **Every Act 2 section must be light.** A dark band scrolling under a solid black
   nav erases it. (This is also why the ticker was removed and why the footer is not
   a dark slab.)
2. **The header docks.** It fades to an opaque white plate over the last 7% of the
   hero track, so black nav type and black content type do not overlap into mush —
   something `difference` used to solve for free.

---

## 6. Components

| File | Role |
|---|---|
| `app/layout.tsx` | `<body>{children}</body>` — no wrapper, ever |
| `app/page.tsx` | returns the client component directly |
| `_components/blind-by-glamour.tsx` | Act 1 + composition root; owns the hero timeline, video RAF, Lenis |
| `_components/logos.tsx` | `BrandMark` — SVG, `fill: currentColor` |
| `_components/collection-index.tsx` | rows + cursor-following hover peek |
| `_components/pile.tsx` | pinned card scatter |
| `_components/site-footer.tsx` | fullscreen footer, measured wordmark, staggered reveal |

### Notes worth knowing

**`BrandMark` is SVG, not an image.** It inherits the header's colour through
`fill: currentColor`, which is why recolouring the nav to black recoloured the logo
for free. The video wordmark it replaced could not be recoloured at all.

**`--card-scale` lives on `documentElement`.** `.product-thumb` and `.add-btn`'s
`left` fallback are separate body-level elements, so they need a common ancestor. Both
consumers supply a `, 1` fallback for the pre-JS frame.

**`.add-btn` has a static CSS `left` *and* a per-frame JS sync.** The CSS
(`calc(38rem + 7rem * var(--card-scale, 1))`) keeps it correct before JS runs; the JS
(`product.right + 1rem`) survives content changes. The two agree exactly — verified at
539.8px (scale 1) and 615.3px (scale 1.9).

**The collection peek is one reused image node**, not one per row, so the spring
position stays continuous as the cursor moves between rows.

**The footer wordmark is measured, not sized.** See `CLAUDE.md` §3.

---

## 7. Known limitations

- **The six stills are all from one continuous close-up.** In a filmstrip they read as
  repetition; the card pile works *because* overlapping at angles turns that into a
  collage. Real product photography would improve the collection and pile immediately.
- **The source video is 24fps / 145 frames.** At current pacing you see essentially
  every frame it has, so this is as smooth as scrubbing gets from this file. Slow
  scrolling shows individual frames — that is the footage, not the code.
- **The scroll feel is unverified by measurement.** Lenis `lerp: 0.055` /
  `wheelMultiplier: 0.72` and the reveal timings were set by judgement; the preview
  pane's suspended RAF prevented watching them run at speed.
- **No mobile layout.** There are zero media queries by design — the fluid root and
  `vw`/`vh` units are the only responsive mechanism. Narrow viewports work but were
  never art-directed.
