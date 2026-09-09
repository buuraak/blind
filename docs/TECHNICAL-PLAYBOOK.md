# TECHNICAL-PLAYBOOK.md

Engineering rules for scroll-driven, video-scrubbed, blend-mode sites.

**Every rule here fails silently.** No console error, no build failure, no type error —
just a page that is subtly or catastrophically wrong. That is why they need writing down:
none of them are discoverable from the code, and each has a plausible alternative that
looks more correct than the right answer.

Each entry gives the **failure mode**, the **wrong-but-plausible alternative**, and the
**evidence** — measured numbers from the reference build. For that project's specific
values see [`ARCHITECTURE.md`](ARCHITECTURE.md) and [`../CLAUDE.md`](../CLAUDE.md).

---

## 1. Scroll architecture

### 1.1 The spacer is the pacing dial

In a fully-fixed layout, one empty element in normal flow creates all the scroll
distance. Because every animation is normalized against it, **its height is the single
control for the pace of the entire piece** — it scales the media scrub and the
choreography together and preserves their relative rhythm.

```css
.scroll-spacer { height: 450vh; pointer-events: none; }
```

**Failure mode:** too short and the piece flies past unread. The client's report was that
the video *"plays a bit too fast"* — but the video was correct; the whole film was
crammed into ~900px of scroll.

**Wrong-but-plausible:** slow the video down independently (reduce the scrub range, or
map to a fraction of duration). That desynchronises the video from the choreography and
truncates the footage.

**Evidence.** Measure **pixels of scroll per source frame** and target **15–25**:

| | 220vh | 450vh |
|---|---|---|
| Total scroll | 1035px | 3020px |
| **Px per video frame** | 6.3 | **18.3** |
| Frames burned per 200px flick | 32 of 145 | **11 of 145** |

```js
const pxPerFrame = (scrubEndProgress * maxScroll) / sourceFrameCount;
```

**Never delete the spacer as empty markup.** It has no content by design.

### 1.2 Scope every scroll progress to a track

**Failure mode:** a bare `useScroll()` normalizes over *total document height*. Add any
section below and every earlier animation stretches across the whole page — the hero
headline would not finish exiting until the footer.

**Wrong-but-plausible:** it works perfectly while the fixed hero and its spacer are the
only content, so it survives until the first new section is added.

```js
// wrong once the page grows
const { scrollYProgress } = useScroll();

// right — self-contained, independent of anything added later
const trackRef = useRef(null);
const { scrollYProgress } = useScroll({
  target: trackRef,
  offset: ["start start", "end end"],
});
```

This also converts a "spacer hack" into a real pin track. Verify the fix changed nothing:
sample the same normalized points before and after and diff.

### 1.3 Pin-and-slide-over

The signature move: one layer holds still while the next travels over it.

**Mechanism** — a tall track holds a pinned layer; the next section is pulled up into that
track with a negative margin, given a higher `z-index` and an **opaque background**.

```css
.track  { position: relative; z-index: 1; height: 440vh; }
.pin    { position: sticky; top: 0; height: 100vh; overflow: hidden; }
.next   { position: relative; z-index: 2; margin-top: -100vh; background: var(--bg); }
```

**Failure mode without the negative margin:** the next section arrives exactly as the pin
releases, so they scroll together — the incoming section *pushes* rather than *covers*.
The visual difference is large and the code difference is one property.

**Wrong-but-plausible:** fade the pinned layer out as the next arrives. Reads as a gap,
not a transition. Let the incoming layer physically cover it.

**Evidence** — through the whole overlap window the pin does not move:

| through window | pin top | incoming top |
|---|---|---|
| 0% | 0 | 863 |
| 25% | 0 | 647 |
| 50% | 0 | 431 |
| 75% | 0 | 216 |
| 100% | 0 | 0 |

### 1.4 Reserve a dead zone when a track is also an overlap window

If the last 100vh of a track is used for the slide-over, the animation must finish
*before* that window opens, or it plays out underneath the covering layer.

```js
const TRACK_VH = 440, OVERLAP_VH = 100;
const ANIM_FRACTION = (TRACK_VH - OVERLAP_VH) / TRACK_VH;   // 0.773
const animProgress = useTransform(scrollYProgress, v => Math.min(1, v / ANIM_FRACTION));
```

**Wrong-but-plausible:** extend the track and let the animation stretch across it. The
animation then runs 30% slower than designed for no reason the viewer can perceive.

### 1.5 Constants duplicated across JS and CSS must be labelled

Any value that exists in both a stylesheet and a script is a silent desync waiting to
happen — changing one produces no error, just wrong timing.

| JS | CSS |
|---|---|
| `TRACK_VH = 440` | `.pile { height: 440vh }` |
| `OVERLAP_VH = 100` | `.site-footer { margin-top: -100vh }` |

Comment both sides pointing at each other. Better where practical: write the value from
JS as a custom property so one side owns it.

```js
// track height follows measured travel instead of being guessed
style={{ "--travel": `${travel}px` }}
```
```css
.track { height: calc(100vh + var(--travel, 120vh)); }
```

---

## 2. The video scrub engine

A scrubbed video is not a played video. Never call `.play()`; only ever assign
`currentTime`.

```js
video.addEventListener("loadedmetadata", () => {
  try { video.pause(); video.currentTime = 0.001; } catch {}
});
video.addEventListener("seeked", () => { seeking = false; });
```

### 2.1 Encode for scrubbing — this is the whole problem

**Failure mode:** a normally-encoded MP4 has sparse keyframes, so every seek decodes
forward from the nearest one. The reference source had **1 keyframe across 145 frames** —
the entire 6 seconds was a single GOP, so every seek decoded from the start.

**Wrong-but-plausible — and this is the important one:** blame the JavaScript. The
animation loop measured **120fps, 8.3ms median, zero frames over 16.7ms** while the video
was visibly stuttering. Disabling the blend modes and the blurs changed nothing. The main
thread was never the bottleneck.

**Diagnose by measuring seek cost and update rate, not frame rate:**

```js
// seek cost
const t0 = performance.now();
video.addEventListener("seeked", () => console.log(performance.now() - t0), { once: true });
video.currentTime = 3.5;

// actual update rate + how far behind the scroll it is
let presented = 0;
const cb = () => { presented++; video.requestVideoFrameCallback(cb); };
video.requestVideoFrameCallback(cb);
```

**Fix — re-encode all-intra (`-g 1`, every frame a keyframe):**

```bash
ffmpeg -i source.mp4 -c:v libx264 -g 1 -crf 21 -preset slow \
  -pix_fmt yuv420p -profile:v high -movflags +faststart -an out.mp4
```

**Evidence:**

| | original (single GOP) | all-intra 1080p | all-intra 720p |
|---|---|---|---|
| Median seek | 23.9ms | **5.3ms** | 2.9ms |
| Worst seek | 33.4ms | 10.2ms | 5.7ms |
| File size | 11.9MB | **8.8MB** | 5.1MB |

End to end, with the guards relaxed:

| | before | after |
|---|---|---|
| Video updates during scroll | 18.4 Hz | **105 Hz** |
| Median lag behind scroll | 0.274s | **0.077s** |
| Worst lag | 1.313s | **0.079s** |

All-intra is *larger per second of footage* but was smaller here than the original, and
it is the only reason scrubbing is smooth. Verify the encode landed:

```bash
ffprobe -v error -select_streams v:0 -skip_frame nokey \
  -show_entries frame=pts_time -of csv=p=0 out.mp4 | wc -l   # == frame count
```

### 2.2 The seek gate: one in flight, cleared only by `seeked`

```js
if (!seeking && Math.abs(target - video.currentTime) > DEADBAND) {
  seeking = true;
  try { video.currentTime = target; } catch { seeking = false; }
}
```

**Failure mode:** without the gate, assigning `currentTime` faster than the decoder can
service it queues seeks and the decoder stalls — the video freezes while scroll continues.

The flag must be cleared **by the `seeked` event only**. Clearing it on a timer, or
optimistically after assignment, reintroduces the stall because it lies about whether the
decoder is free.

**`DEADBAND`** suppresses sub-perceptual corrections. Size it at roughly **half a source
frame** — at 24fps (41.7ms/frame), `0.02s`.

### 2.3 Tune the follow to the encode, and remove guards the encode made obsolete

The lerp coefficient `K` sets how tightly the video follows scroll.

```js
scrubCurrent += (scrubTarget - scrubCurrent) * K;
if (Math.abs(scrubTarget - scrubCurrent) < 0.0001) scrubCurrent = scrubTarget;
```

Defensive guards written for a slow decoder become the bottleneck once it is fast. The
reference build carried `K = 0.1` **plus a 30ms timer throttle**; both existed only to
protect 24ms seeks. After re-encoding: `K = 0.3`, **throttle deleted entirely** — seeks
paced by the in-flight flag alone.

**Diagnostic that distinguishes the two failures:** measure median *and* worst lag
separately. Uniform lag across median/p95/worst is intentional smoothing. A wide spread
is stuttering. Before the fix: median `0.274s`, worst `1.313s` — a 4.8× spread, which is
what the client felt. After: `0.077 / 0.077 / 0.079` — flat.

### 2.4 Smooth-scroll libraries make the worst case worse

Adding Lenis on top of an unfixed scrub left the median unchanged but tripled the worst
case (`0.455s → 1.313s`), because inertia keeps scrolling after input stops and the video
has further to chase. Fix the decode before adding scroll smoothing.

---

## 3. `mix-blend-mode` and stacking contexts

`mix-blend-mode` composites against its **backdrop** — everything painted below it *in
the same stacking context*. Break the context and the blend silently composites against
the wrong thing.

### 3.1 Blended elements must be direct children of `<body>`

**Failure mode:** any wrapper between the element and `<body>` — or any ancestor with
`overflow: hidden`, `transform`, `filter`, `will-change`, or `contain` — creates a new
stacking context. The element then blends against that wrapper's (empty) content instead
of the media. White elements go invisible. **No error, in any browser.**

**Wrong-but-plausible:** wrapping sections in a layout div. Standard practice everywhere
else; fatal here.

Framework specifics:
- Root layout must render `<body>{children}</body>` with **no wrapper**.
- The page must return the component directly, or a **fragment** — fragments and context
  providers emit no DOM and are safe.
- Verify third-party wrappers before trusting them. `<ReactLenis root>` renders
  `root ? children : <div><div>…</div></div>` — safe **only** with `root`. Check the
  compiled source rather than assuming:

```bash
grep -oE 'jsx\("div"' node_modules/<pkg>/dist/*.mjs
```

Runtime audit:

```js
[".a", ".b"].map(s => {
  const el = document.querySelector(s);
  return `${s} parent=${el.parentElement.tagName} blend=${getComputedStyle(el).mixBlendMode}`;
});
// every parent must be BODY
```

### 3.2 Never put `overflow` on `html` or `body`

Scaffolds ship this. Next's default `globals.css` had `overflow-x: hidden` on both — it
caps the scroll *and* kills `mix-blend-mode` in WebKit. **Delete generated stylesheets
wholesale rather than editing them.**

### 3.3 Do not add `overflow` or `will-change` to a blend backdrop

Both promote the element to its own compositing layer and break blending on descendants
and siblings. If a comment says an element deliberately lacks them, it is load-bearing.

### 3.4 Double-difference for legible labels on a blended pill

A blended white pill inverts against the video; its label needs a **second** inversion to
punch back through.

```css
.pill        { background: #fff; color: #fff; mix-blend-mode: difference; }
.pill__label { color: #fff;                   mix-blend-mode: difference; }
```

Remove either layer and the label disappears.

### 3.5 Put a group blend on an element that never animates

A `mix-blend-mode` on an element that also receives `transform` or `filter` drops out
mid-animation. Put the blend on a stable parent and animate the child.

### 3.6 Blending is not always the right answer for chrome

`difference` against bright media yields muddy mid-greys exactly where persistent
navigation lives. The reference build's header was switched to solid ink — **visually
identical at rest**, since white under `difference` over a white page already resolves to
`255−255 = 0`.

Two consequences follow, and both must be handled:
1. **Every section that scrolls under the header must be light**, or a dark band erases
   the nav.
2. **The header must dock** — fade to an opaque plate as content arrives, or ink-on-ink
   type overlaps into mush. `difference` used to solve that for free.

---

## 4. SSR and rest state

### 4.1 Values that live only in `animate` are absent from server HTML

**Failure mode:** `animate` / `whileInView` are applied on the client *after* mount. The
server emits no value, CSS defaults win, and an element intended to start hidden renders
at `opacity: 1` and flashes on load.

**Wrong-but-plausible:** it looks correct in the browser because the animation corrects it
within a frame — the flash is easy to miss, and invisible if a dev tool suspends rAF.

```jsx
// wrong — server renders it visible
<motion.div animate={{ opacity: active ? 1 : 0 }} />

// right — the hidden state is in the server HTML
<motion.div initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.88 }} />
```

**Verify against the server, not the browser:**

```bash
curl -s http://localhost:3000 | grep -o 'class="your-class"[^>]*'
# must already contain style="opacity:0;…"
```

This bit twice in one build. The second time it was only caught because a suspended rAF
froze the flash permanently and made it visible — the environment's quirk surfaced a real
defect.

### 4.2 The rest state belongs in CSS

Every element should have a correct static rest state in the stylesheet; scripts animate
*from* it, never *into* it. The page must be correct at first paint with JS disabled.

Corollary — **ship a static fallback for anything a script positions every frame.** A
`position: fixed` element with no `left` collapses to the left edge before JS runs. Ship
both and make them agree:

```css
left: calc(38rem + 7rem * var(--card-scale, 1));   /* static fallback */
```
```js
addBtn.style.left = product.getBoundingClientRect().right + rootPx + "px";  /* source of truth */
```

Verified equal at 539.8px (scale 1) and 615.3px (scale 1.9).

Custom properties written by JS need a fallback at every consumer: `var(--card-scale, 1)`.

---

## 5. Measure, don't guess

Repeatedly, a plausible fixed value was wrong and a measured one was right. When a number
controls layout, compute it at runtime.

### 5.1 Text cannot be fitted with `vw`

Glyph width depends on font metrics, so a fixed `vw` font-size either overflows or leaves
a gap. A wordmark at `40vw` clipped its first and last letter.

```js
mark.style.fontSize = "100px";
const w = mark.getBoundingClientRect().width;
mark.style.fontSize = `${(100 * avail) / w}px`;
```

Set it imperatively (no state, no second render), re-run under a `ResizeObserver`, and
keep a sane `vw` value in CSS as the pre-JS default. Result: available `708px`, rendered
`708px`.

### 5.2 Measure travel; don't infer it from a track height

A horizontal-scroll section's travel is `rail.scrollWidth - window.innerWidth` — it
shrinks as the viewport widens, so a fixed `vh` track cannot stay proportional.

Guessed: 1980px of vertical scroll for 743px of travel — **ratio 0.38**, which read as
sluggish. Measured and fed back into the track height: **ratio 1.00**.

### 5.3 Elements are the size they compute to, not the size they look

A fixed header measured **129px**, not the ~92px its logo suggested — hidden menu items
still hold layout height (`opacity: 0`, not `display: none`). Clearance values derived
from the visible design were too small.

Measure with `getBoundingClientRect()`; never derive clearance from a visual estimate.

---

## 6. Verification

### 6.1 Verify in a real browser

The recommended harness is **`playwright-cli`** — a real engine with a real frame loop,
where animations actually run and console errors surface.

> The reference build's measurements were taken through an embedded preview pane's JS
> bridge, which is why §6.2 matters so much. Its rAF suspension made several animations
> unobservable and produced at least one false diagnosis. Prefer a real browser.

### 6.2 Know when `requestAnimationFrame` is suspended

Embedded preview panes suspend rAF when hidden. Consequences:

- **Motion values and springs freeze mid-flight.** A screenshot forces exactly one frame,
  so a heavily-damped spring needs dozens of screenshots to settle and will otherwise
  appear stuck at its start value.
- **Scroll-linked reads are stale** unless a frame is forced first.
- **Screenshots may composite `position: fixed` layers offset by `scrollY`**, producing
  screenshots that look catastrophically broken while `getBoundingClientRect()` reads
  perfectly correct.

A frozen animation is not a broken one, and a stale reading is not a bug — **but neither
is a verified one.** If the environment will not render, report the behaviour as
unverified rather than inferring it.

### 6.3 Correct layout does not imply correct paint

The hardest bug in the reference build: a white band where video should be. Geometry
measured correct at **every one of 481 stress-test frames**. It was a compositing failure
— the compositor presenting a full-screen `position: fixed` layer at its new position
with a **stale raster of its old size**, because the layer was being resized every frame.

**Fix:** never resize a full-screen fixed layer. Keep its bounds constant and animate an
ordinary absolutely-positioned child inside it.

```css
.fixed-layer { position: fixed; inset: 0; }              /* bounds never change */
.window      { position: absolute; inset: 0; top: 30vh; } /* `top` is animated */
```

Two process lessons, both learned the hard way:

- **`getBoundingClientRect()` returning correct values does not exonerate the code.** It
  was cited twice to dismiss a real user-visible bug as an artifact.
- **A user reporting a visual bug you cannot reproduce is still a real bug.** Chase the
  paint path — layer bounds, compositing, stacking — not just the geometry.

### 6.4 Diff against a reference when porting

When re-implementing something that already works, sample the same normalized scroll
points in both and diff every value. A port of the reference build to a framework was
verified this way: **180 values across 9 scroll positions, zero differences** — then
**171 values** again after a structural fix, confirming a refactor changed nothing.

```js
const targets = [0, 0.06, 0.126, 0.18, 0.36, 0.62, 0.88, 1];
// at each: computed opacity/transform/filter + getBoundingClientRect of key elements
```

This is far stronger evidence than a screenshot comparison, and it catches regressions a
screenshot cannot.

### 6.5 Always finish with

```bash
npx tsc --noEmit && npm run build
```

Plus a palette audit (§Design) and an SSR rest-state check (§4.1).
