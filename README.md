# Blind by Glamour

A scroll-driven single-page site for a fictional luxury eyewear atelier. The page
behaves like a film: a pinned hero whose video is scrubbed frame-by-frame by scroll,
followed by a collection index, a card pile that scatters to reveal a statement, and a
fullscreen footer that slides over it.

```bash
npm install
npm run dev          # http://localhost:3000
```

| | |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) · React 19.2 · TypeScript |
| Animation | [`motion`](https://motion.dev) 12 (free core — Motion+ is not required) |
| Smooth scroll | [`lenis`](https://lenis.darkroom.engineering) 1.3 |
| Styling | One hand-written stylesheet, `app/globals.css`. No Tailwind, no CSS-in-JS |
| Fonts | System only — Helvetica Neue / Georgia. No webfonts |

Tailwind was deliberately not used: the design depends on exact `clamp()`, `max()` and
`rem` values that utility classes would obscure.

---

## Documentation

Read these before making changes. Most of the important constraints are invisible in
the code — they exist because the obvious alternative silently fails.

| Doc | Read it when |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | **Always.** Hard invariants, verification requirements, scope rules |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Touching anything visual — palette, type, motion vocabulary, voice |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Touching anything that scrolls — timeline, pin patterns, video scrub |

**The three that break most often:**

1. Blended elements must be **direct children of `<body>`** — no wrapper divs in
   `layout.tsx` or `page.tsx`.
2. **Never invent a colour.** The palette is `#fff` and `#000`; tone comes from black
   at reduced opacity.
3. Motion values in `animate` are **absent from SSR** — always pair with `initial`, or
   the element flashes on load.

---

## Structure

```
app/
  layout.tsx                    <body>{children}</body> — no wrapper (see CLAUDE.md §1.1)
  page.tsx                      returns the client component directly
  globals.css                   the entire stylesheet, sectioned 1-10
  _components/
    blind-by-glamour.tsx        Act 1 + composition root: hero timeline, video RAF, Lenis
    logos.tsx                   BrandMark — SVG, fill: currentColor
    collection-index.tsx        rows + cursor-following hover peek
    pile.tsx                    pinned card scatter
    site-footer.tsx             fullscreen footer, measured wordmark, staggered reveal
public/
  hero-scrub-1080.mp4           all-intra re-encode — see Assets
  frames/frame-0{1..6}.jpg      stills extracted from the hero video
```

---

## Assets

### Hero video

Self-hosted and **all-intra**. The original source was a single 6-second GOP — one
keyframe across 145 frames — so every scrub seek cost 24–33ms and the video trailed
the scroll by up to 1.3s. Re-encoding with `-g 1` took seeks to ~5ms:

| | before | after |
|---|---|---|
| Video updates during scroll | 18.4 Hz | **105 Hz** |
| Median lag behind scroll | 0.274s | **0.077s** |

Regenerate from a source clip:

```bash
ffmpeg -i source.mp4 -c:v libx264 -g 1 -crf 21 -preset slow \
  -pix_fmt yuv420p -profile:v high -movflags +faststart -an \
  public/hero-scrub-1080.mp4
```

`-g 1` is the load-bearing flag: every frame becomes a keyframe. The file gets larger
per second of footage but is still smaller than the original here (8.8MB vs 11.9MB),
and it is the only reason scrubbing is smooth. **Do not swap in a normally-encoded
file.**

### Stills

Extracted from the hero video so the imagery is genuinely from the same shoot:

```bash
i=1; for t in 0.4 1.3 2.2 3.1 4.0 5.2; do
  ffmpeg -ss "$t" -i public/hero-scrub-1080.mp4 -frames:v 1 \
    -vf "scale=900:-2" -q:v 3 "public/frames/frame-0$i.jpg"
  i=$((i+1))
done
```

Note they all come from one continuous close-up, so they read as repetition in a
grid. The card pile works *because* overlapping them at angles turns that into a
collage. Real product photography would be a straight upgrade.

---

## Tuning

Single values that control the feel:

| What | Where | Now |
|---|---|---|
| Whole-film pacing | `.scroll-spacer` height | `450vh` |
| Scroll glide length | Lenis `lerp` | `0.055` |
| Scroll distance per notch | Lenis `wheelMultiplier` | `0.72` |
| Video follow tightness | `K` in `blind-by-glamour.tsx` | `0.3` |
| Pile track / overlap | `TRACK_VH` / `OVERLAP_VH` | `440` / `100` |

`TRACK_VH` and `OVERLAP_VH` are **duplicated in `globals.css`** (`.pile` height,
`.site-footer` margin-top). Change both or the timing desyncs with no error.

---

## Verification

```bash
npx tsc --noEmit && npm run build
```

Palette audit — should return nothing:

```bash
grep -nE '#[0-9a-fA-F]{3,6}' app/globals.css | grep -viE '#fff|#000'
```

SSR check for any scroll-revealed element — must already carry `opacity:0`:

```bash
curl -s http://localhost:3000 | grep -o 'class="footer-headline"[^>]*'
```

---

## Deployment

Statically prerendered (`○ Static`). The 8.8MB video ships from `/public`, so serve it
from a CDN with byte-range support — that is what makes seeking cheap.

Browser floor is inherited from Next 16: Chrome/Edge/Firefox 111+, Safari 16.4+.
