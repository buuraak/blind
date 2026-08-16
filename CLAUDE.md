@AGENTS.md

# Blind by Glamour — agent rules

A scroll-driven single-page site for a fictional luxury eyewear atelier. Read
[`docs/DESIGN.md`](docs/DESIGN.md) before touching anything visual and
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) before touching anything that scrolls.

Everything below was learned by breaking it first. Each rule exists because the
obvious alternative silently fails — usually without an error.

---

## 1. Hard invariants — breaking these produces no error, just a broken page

### 1.1 Blended elements must be direct children of `<body>`

`.hero-title`, `.hero-footer` and `.add-btn` use `mix-blend-mode: difference`. The
blend composites against the **root stacking context**. Any wrapper element between
them and `<body>` — or any ancestor with `overflow: hidden`, `transform`, `filter`,
or `will-change` — creates a new stacking context, and they blend against that
wrapper's empty content instead of the video. Every white element goes invisible.

- `app/layout.tsx` renders `<body>{children}</body>`. **Do not add a wrapper div.**
- `app/page.tsx` returns the client component directly, not wrapped.
- `<ReactLenis root>` is safe: with `root` it renders `children` inside a context
  provider and emits no DOM. Without `root` it wraps in two divs and breaks this.
- Fragments and context providers are safe. Elements are not.

### 1.2 Never put `overflow` on `html` or `body`

The Next scaffold's default `globals.css` shipped `overflow-x: hidden` on both. It
caps the scroll and kills `mix-blend-mode` in WebKit. The stylesheet was deleted
wholesale, not edited. If you regenerate it, delete it again.

### 1.3 Never resize a full-screen `position: fixed` layer every frame

`.hero` is fixed and must keep **constant bounds**. It previously animated
`margin-top` while pinned `top:0; bottom:0`, which recomputed its height each frame;
the compositor then presented it at its new position with a stale raster of its old
size, painting the video as a 70vh band with a white gap beneath.

The size animation lives on `.hero-window`, an ordinary absolutely-positioned child
whose `top` animates `30vh → 0`. Same box, same crop, stable fixed layer.

`.hero` also must not have `overflow` or `will-change` — both break the blend.

### 1.4 Motion: values that live only in `animate` are absent from SSR

`animate` / `whileInView` are applied on the client after mount. The server emits no
value and CSS defaults win — so an element intended to start hidden renders at
`opacity: 1` and flashes on load. This has bitten twice (the collection peek image,
the footer reveal).

**Always pair with `initial`.** Verify with:

```bash
curl -s http://localhost:3000 | grep -o 'class="your-class"[^>]*'
```

The SSR HTML must already carry `style="opacity:0;…"`.

### 1.5 Scroll progress must be scoped to a track

A bare `useScroll()` normalizes over **total document height**. Add any section and
every hero animation stretches across the whole page. Always scope:

```ts
useScroll({ target: trackRef, offset: ["start start", "end end"] })
```

### 1.6 Coupled constants — change both or the timing desyncs silently

| JS | CSS | Meaning |
|---|---|---|
| `TRACK_VH = 440` in `pile.tsx` | `.pile { height: 440vh }` | pile track |
| `OVERLAP_VH = 100` in `pile.tsx` | `.site-footer { margin-top: -100vh }` | footer slide-over window |

---

## 2. Design rules

Full detail in [`docs/DESIGN.md`](docs/DESIGN.md). The two that get broken most:

### 2.1 Never invent a colour

The palette is `#fff` and `#000`. Tone comes from **black at reduced opacity**
(`rgba(0,0,0,·)` or `opacity`), never from a new hex value. There is no accent, no
grey token, no tint.

This was violated twice — once with a black footer, once with a warm grey ground —
each time with a plausible-sounding rationale attached. **If a surface seems to need
a colour, ask. Do not pick one and justify it.**

Audit before finishing:

```bash
grep -nE '#[0-9a-fA-F]{3,6}' app/globals.css | grep -viE '#fff|#000'
```

### 2.2 `easeOutCubic` is the only easing

`1 - Math.pow(1 - p, 3)`. No springs on scroll-linked values except where documented,
no cubic-bezier, no CSS transitions on scroll-driven properties. Entrances and exits
share one blur-lift-fade vocabulary — see `docs/DESIGN.md` §Motion.

---

## 3. Measure, don't guess

Repeatedly in this codebase a plausible fixed value was wrong and a measured one was
right:

- **Text cannot be fitted with `vw`.** A wordmark sized `40vw` overflowed and clipped
  its first and last glyph, because glyph width depends on font metrics.
  `site-footer.tsx` measures at a 100px reference and scales to the exact fit.
- **The fixed header is ~129px, not the ~92px the brand mark suggests** — hidden menu
  items still hold layout height (`opacity: 0`, not `display: none`). Pinned sections
  need ~12rem of top clearance.
- **Horizontal-scroll travel must be measured**, not assumed from a `vh` track.

When a number controls layout, compute it at runtime or verify it with
`getBoundingClientRect()`.

---

## 4. Verification

Never claim something works without measuring it. `getBoundingClientRect`, computed
styles, and the SSR HTML are the sources of truth.

**The preview pane suspends `requestAnimationFrame` when hidden.** Consequences:

- Motion values and springs freeze mid-flight; a screenshot forces exactly one frame.
- Scroll-linked reads taken without forcing a frame are stale.
- Screenshots may composite `position: fixed` layers offset by `scrollY`.

A stale reading is not a bug and a frozen animation is not a broken one — but do not
report either as verified. If the pane will not render, say the behaviour is
unverified rather than inferring it.

Correct layout does **not** imply correct paint. A white-band bug survived several
rounds of "the geometry measures fine" before being diagnosed as a compositing issue.

Before finishing any change:

```bash
npx tsc --noEmit && npm run build
```

---

## 5. Assets

The hero video is **self-hosted and all-intra** (`-g 1`), because the original was a
single 6-second GOP — one keyframe — making every scrub seek cost 24–33ms. Do not
replace it with a normally-encoded file; scrubbing will regress to ~19Hz.

Regenerate with the command in [`README.md`](README.md).

---

## 6. Scope

Do what was asked. Do not add sections, colours, copy, or dependencies that were not
requested — several rounds of this project were spent removing things the user had
not asked for. When a design decision is genuinely open, ask rather than deciding and
writing a justification.
