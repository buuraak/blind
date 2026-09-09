# PROMPT-ORIGINAL.md — the commissioning prompt, verbatim

This is the exact prompt that produced the reference build. It is archived unedited as
the worked example for [`PROMPT-TEMPLATE.md`](PROMPT-TEMPLATE.md), which generalizes
its structure.

Everything below the rule is the original text, unmodified. Nothing in it is a
recommendation for a *new* project — the values are specific to this one. Read it for
the **shape**: invariants first, then layers, then tokens, then verbatim DOM and copy,
then coordinate and beat tables, then the engine spec, then a fixed-parameter dump,
then explicit negative constraints.

---

# Recreate this site as a single HTML file: BLIND BY GLAMOUR — scroll-scrubbed luxury eyewear hero

Build a single self-contained `index.html` that reproduces the project below **exactly** — same layout, visuals, motion, and interaction. Pure HTML/CSS/JS in one file: no build step, no framework, no bundler, **no libraries at all** (no GSAP, no Lenis, no Framer Motion — the source uses a hand-rolled `requestAnimationFrame` loop and nothing else). No importmap is needed. All CSS goes in one `<style>` block, all JS in one `<script>` block placed before `</body>`. Hardcode every value given here as a fixed constant.

## 0. READ THIS FIRST — non-negotiable invariants

These six constraints are what break in naive reproductions. Read them before any detail.

1. **A `220vh` spacer `<div>` is the only thing in normal flow — everything visible is `position: fixed`.**
   The page has no scrolling content. `.scroll-spacer { height: 220vh }` is **literal and load-bearing**: it exists solely to create scroll distance. Never "correct" it to `100vh`, `min-height`, or delete it as empty markup. Scroll progress is read from the **window**:
   ```js
   const max = document.documentElement.scrollHeight - window.innerHeight;
   rawProgress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
   ```
   Bind to `window` / `window.scrollY`, never to a nested container. `html, body` must stay free of `overflow` (any value but `visible`) and free of height caps. If the target builder wraps output in a framework root (Google AI Studio → React `#root`, v0, Bolt, etc.), **strip the default scaffold CSS** — the Vite starter's `body{display:flex;place-items:center;min-height:100vh}` + `#root{max-width:1280px;margin:0 auto;padding:2rem;text-align:center}` will center, pad and clip the page and kill the scroll. Mount markup directly under the root with no wrapping height/overflow/flex container.

2. **`mix-blend-mode: difference` only works on elements that are direct children of `<body>`.**
   This is the single most fragile part of the design and was arrived at by debugging, not by preference. WebKit/Safari silently drops `mix-blend-mode` when the element is trapped inside an ancestor with `overflow: hidden` or an ancestor promoted to its own compositing layer (`will-change`). Therefore:
   - `.hero` **must not** have `overflow: hidden` and **must not** have `will-change`. Both were deliberately removed. Do not "helpfully" add them back — nothing needs clipping (`.hero-bg-video` is `inset:0` + `object-fit:cover`, which crops inside itself; there is no border-radius).
   - Every blended element — `.site-header`, `.hero-title`, `.hero-footer`, `.add-btn` — is a **direct child of `<body>`**, so its blend backdrop is the root stacking context (i.e. `.hero` and its video underneath). Do not nest them into wrappers "for layout"; a wrapper with `position:fixed` creates a stacking context and the blend then composites against the wrapper's own (empty) content instead of the video.
   - `.product` is deliberately **not** blended (design decision — the product card and its photo must render in true colors).

3. **Double-difference is required on both pill buttons or their labels are invisible.**
   The outer element is `background: #fff; color: #fff; mix-blend-mode: difference`, and a nested `<span>` carries `color: #fff; mix-blend-mode: difference` a second time. The outer blend inverts the white pill against the video; the inner blend inverts the white label back, so the label reads as the original video pixel and stays legible on any frame. Applied to `.add-btn` / `.add-btn__label` and `.shop-now` / `.shop-now__label`. Removing either layer breaks legibility.

4. **The page must be correct at first paint with JavaScript disabled.**
   Every element has a real static CSS rested state; JS only animates *from* it.
   - `.hero { margin: 30vh 0 0 0 }` is in **CSS**, not written by JS. JS lerps that margin to `0`.
   - `.add-btn` **must ship a static CSS `left`** (see §"Layout & sections" — `calc(38rem + 7rem * var(--card-scale, 1))`). The original source omits it and computes `left` in JS every frame; reproduce the JS sync as source-of-truth **but keep the CSS value too**, because without it a `position: fixed` element with no `left` collapses to the left edge. The two agree exactly (verified: 539.8px at scale 1, 615.3px at scale 1.9, at 1440×900).
   - `.product` and `.add-btn` carry `opacity: 0` in CSS. That is **intentional**, not a bug — the card is scroll-revealed at 18% progress. Accept that with JS off they never appear; do not "fix" it to `opacity: 1`.

5. **The hero video is never played — it is scrubbed.**
   `.hero-bg-video` has **no `autoplay`, no `loop`, no `controls`** — only `muted playsinline preload="auto"`. On `loadedmetadata` the script calls `video.pause()` and seeds `video.currentTime = 0.001`. From then on only `currentTime` is ever assigned, through an RAF lerp with a deadband and seek throttling (see §"Interactions & animation loop"). Never call `.play()` on it. The *brand* video in the header is the opposite: it autoplays and loops normally, plus a JS `play().catch(() => {})` safety net.

6. **`--card-scale` is a root-level custom property written by JS each frame; the fallback `1` is load-bearing.**
   `document.documentElement.style.setProperty('--card-scale', …)`, consumed as `calc(7rem * var(--card-scale, 1))` on `.product-thumb` (and in the `.add-btn` `left` fallback). If the var is missing before the first frame, the `, 1` default keeps the layout correct.

**Also mandatory:** the root font-size is fluid — `html { font-size: clamp(11px, 0.833vw, 16px) }` — and **every** dimension below is in `rem`, so the whole design scales with viewport width. Micro-UI text has a hard pixel floor expressed as `max(11px, Xrem)`. Do not convert any `rem` to a fixed `px` (the two `px` blocks that *are* fixed — `.brand-frame` / `.brand` — are called out explicitly and must stay `px`).

## Structure & layers

```
<body>                                    background #fff, overscroll-behavior:none
  <header class="site-header">      fixed  z-50  blend:difference  4 columns, never re-positions
    ├ .brand-frame > video.brand           130×56 px window over a 168×56 px video (dual-axis crop)
    ├ p.tagline-hero                       exits 1st  (blur-lift-fade)
    ├ nav.menu > ul                        SHOP/BRANDS/SERVICES/EVENTS/ABOUT US, column
    │   └ li.menu-primary > a.menu-word    SHOP (span __a) stacked over MENU (span __b, absolute)
    └ .account                             "CART (0)" · "SIGN IN" — never animates
  <h1 class="hero-title">           fixed  z-40  blend:difference  sits ABOVE the video frame
  <section class="hero">            fixed  z-10  inset:0, margin-top 30vh → 0, bg #000
    └ video.hero-bg-video           abs    z-0   inset:0, object-fit:cover, SCRUBBED not played
  <div class="hero-footer">         fixed  z-20  blend:difference  (group blend — holds CTA only)
    └ .cta                                 copy + SHOP NOW pill, right-aligned, exits with the title
  <article class="product">         fixed  z-20  NO blend, opacity:0 → enters at 18%, thumb scales to 1.9×
    ├ .product-thumb > img                 white frame; photo object-fit:contain, true colors
    └ .product-info                        h2 top, .desc, .price pushed to bottom (margin-top:auto)
  <button class="add-btn">          fixed  z-20  blend:difference, opacity:0, left synced to .product
    └ span.add-btn__label                  "+" with a SECOND blend (double-difference)
  <div class="scroll-spacer">       flow         height:220vh — the sole scroll driver
  <script>
```

Section background: `.hero` is `background-color: #000` (a dark fallback while the remote video loads), the page `<body>` is `#fff`.

## What it is

A one-screen luxury-eyewear brand hero — "Blind by Glamour", a fictional atelier selling art-object frames — that behaves like a scroll-driven film rather than a page. At rest you see a white editorial layout: a small chrome wordmark video top-left, a dense uppercase tagline, a vertical menu, account links, an oversized headline in the white air above a letterboxed video frame that occupies the bottom 70% of the viewport, and a right-aligned block of brand copy over a white SHOP NOW pill. Nothing scrolls in the conventional sense — the entire page is fixed and a tall invisible spacer converts scroll distance into a timeline.

Scrolling drives three overlapping movements. First the header dismantles itself: the tagline and the menu items lift, blur and fade out one at a time from the bottom of the list upward (ABOUT US, then EVENTS, SERVICES, BRANDS, finally SHOP), and once SHOP is gone the word MENU rises into the same slot from below. Simultaneously the video frame grows upward from its 30vh inset to fill the entire viewport, while the headline and the right-hand CTA both lift, blur and dissolve with the identical curve — they read as a linked pair. Underneath all of it the video itself is being scrubbed frame-by-frame from the very first pixel of scroll, smoothed by a lerp so the seek never stutters. Once the headline and CTA are gone, a product card fades up out of the blur in the bottom-left — a white-framed photo of the frames, the model name, a spec paragraph, a price — and from then to the end of the scroll that card's thumbnail grows to 1.9× its size while the title stays pinned to the top of the frame and the price is pushed to the bottom, so the card visually opens up as you go. A circular white `+` button tracks the card's right edge the whole way.

The visual signature is `mix-blend-mode: difference`. The header, the headline, the CTA block and the `+` button are all painted pure white and inverted against whatever is beneath them, so text is automatically legible on the white page at rest and on any frame of the video at full-bleed — black on white, white on dark, with no JS colour switching. The two pill buttons use the effect twice over, nested, so their labels punch back through their own inverted fill. Typography is one Helvetica family doing everything: a single medium-weight display line at 2.5rem with tight negative tracking, and everything else 11px bold uppercase with open tracking, plus one word of the headline set in Georgia italic as the only typographic gesture on the page. No accent colour, no shadows, no borders, no radii beyond a 6px card corner and one pill.

## Page shell & libraries

- **No build step, no framework, no bundler, no libraries.** One `index.html`. Everything below is hand-written CSS and vanilla JS. The entire animation engine is one `requestAnimationFrame` loop.
- **Document head:**
  ```html
  <!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Blind by Glamour</title>
  </head>
  ```
- **Fonts: system only, no webfont loading.** `--font-sans: "Helvetica Neue", Helvetica, Arial, sans-serif` and `--font-serif-italic: Georgia, "Times New Roman", serif`. Do not add a Google Fonts `<link>`.
- **Script placement:** the source loads `<script src="script.js" defer>` as the last element in `<body>`. Inline it as `<script>` in the same position; keep the boot guard:
  ```js
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  ```
- **CSS reset (exact):**
  ```css
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    overscroll-behavior: none;              /* kill macOS rubber-band; required */
    background: var(--bg);
    color: var(--ink);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  body { min-height: 100dvh; }
  img { display: block; max-width: 100%; }
  button, a { font: inherit; color: inherit; }
  ul { list-style: none; }
  ```
  Note `overscroll-behavior: none` lives in the same `html, body` rule as the reset, not bolted on separately. There are no `::selection`, `:focus`, or `::-webkit-scrollbar` rules in the source — do not invent any. Browser default focus outlines are left intact.
- **Fluid root (critical):**
  ```css
  html { font-size: clamp(11px, 0.833vw, 16px); }
  ```
  Resolved: **1920px → 16px** (upper clamp), **1440px → 11.9952px**, **1280px → 11px** (lower clamp; `0.833vw` = 10.66px would go under the floor). Every `rem` below scales off this.

## Global CSS / tokens

```css
:root {
  --bg: #fff;
  --surface: #fff;          /* declared but UNUSED in the source — keep it, all fills are literal #fff */
  --ink: #000;
  --ink-inverse: #fff;

  --font-sans: "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-serif-italic: Georgia, "Times New Roman", serif;

  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;

  --radius-sm: 0.375rem;
  --radius-pill: 999px;

  --fs-ui: max(11px, 0.6875rem);     /* micro-UI, floored at 11px */
  --fs-brand: max(11px, 0.75rem);    /* small display (SHOP NOW), floored at 11px */
}
```

There is no spacing scale beyond `--space-4/5/6`, no colour beyond black/white, no accent, no shadow token, no easing/duration tokens in CSS (all motion is JS-driven). `--card-scale` is **not** declared in `:root` — it is only ever written by JS onto `document.documentElement`, and every consumer supplies the `, 1` fallback.

Resolved token values at the three reference widths:

| Token | @1280 (root 11px) | @1440 (root 11.9952px) | @1920 (root 16px) |
|---|---|---|---|
| `--space-4` (1rem) | 11px | 12.0px | 16px |
| `--space-5` (1.5rem) | 16.5px | 18.0px | 24px |
| `--space-6` (2rem) | 22px | 24.0px | 32px |
| `--radius-sm` (0.375rem) | 4.13px | 4.5px | 6px |
| `--fs-ui` | 11px | 11px | 11px |
| `--fs-brand` | 11px | 11px | 12px |

Note `--fs-brand` is the only token where the floor stops mattering at 1920 — it becomes 12px there, restoring a 1px hierarchy over `--fs-ui`. Reproduce the `max()` expressions verbatim; do not hardcode 11px.

## Shared components / primitives

Skip — the site has no reusable UI primitives. The only shared code is three pure math helpers and two style-application functions in the script; they are specified in §"Interactions & animation loop".

## Layout & sections (in order)

### 1) Site header — `.site-header`

DOM:
```html
<header class="site-header">
  <div class="brand-frame">
    <video class="brand" autoplay muted loop playsinline preload="auto">
      <source src="…hf_20260723_195927_….mp4" type="video/mp4">
    </video>
  </div>
  <p class="tagline-hero">WITH EVERY PROFILE WE PICKED, WE STRIVE TO AWAKEN THE VISION, AND GIVE THE BEST</p>
  <nav class="menu" aria-label="Primary">
    <ul>
      <li class="menu-primary">
        <a href="#" class="menu-word">
          <span class="menu-word__a">SHOP</span>
          <span class="menu-word__b" aria-hidden="true">MENU</span>
        </a>
      </li>
      <li class="menu-secondary"><a href="#">BRANDS</a></li>
      <li class="menu-secondary"><a href="#">SERVICES</a></li>
      <li class="menu-secondary"><a href="#">EVENTS</a></li>
      <li class="menu-secondary"><a href="#">ABOUT US</a></li>
    </ul>
  </nav>
  <div class="account">
    <a href="#">CART (0)</a>
    <a href="#">SIGN IN</a>
  </div>
</header>
```

```css
.site-header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 50;
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: var(--space-6);
  padding: var(--space-5) var(--space-6);      /* 1.5rem 2rem */
  background: transparent;
  color: #fff;
  mix-blend-mode: difference;
  pointer-events: none;
}
.site-header a, .site-header button { pointer-events: auto; }
```
The header is a four-column `space-between` flex row aligned to the top. It never moves or re-lays-out — only its children fade individually. `pointer-events: none` on the container with `auto` restored on links means the large transparent header never eats clicks over the video.

**Brand video — dual-axis crop, the one place `px` is intentional:**
```css
.brand-frame {
  display: block;
  width: 130px; height: 56px;                  /* layout box the flex header sees */
  overflow: hidden;
  pointer-events: none;
}
.brand {
  display: block;
  width: 168px; height: 56px;                  /* render box, wider than the frame */
  object-fit: cover;
  margin-left: -19px;                          /* (168 − 130) / 2 — centres the render in the frame */
  border: none; outline: none;
}
```
The math, because it is not obvious: the source video is **1470×630** (aspect 2.3333). The render box `168×56` has aspect 3.0, which is **wider** than the content, so `object-fit: cover` scales to fill the width — 168 wide × 72 tall — and clips **8px off the top and 8px off the bottom**. The 130px-wide `overflow: hidden` wrapper then clips **19px off each side**. Net visible: the central `130×56` of a `168×72` render, cropped on both axes, undistorted. These five numbers (130, 56, 168, 56, −19) are `px` on purpose and must **not** be converted to `rem` — they do not scale with the fluid root.

**Tagline:**
```css
.tagline-hero {
  font-size: var(--fs-ui);
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  max-width: 21.25rem;                         /* 254.9px @1440 — wraps to 2 lines */
  will-change: opacity, transform, filter;
}
```
Copy verbatim, no `<br>`, natural wrap: `"WITH EVERY PROFILE WE PICKED, WE STRIVE TO AWAKEN THE VISION, AND GIVE THE BEST"`.

**Menu:**
```css
.menu ul { display: flex; flex-direction: column; gap: 2px; }   /* literal 2px, not a rem token */
.menu a {
  font-size: var(--fs-ui); font-weight: 700; line-height: 1.55;
  letter-spacing: 0.02em; text-transform: uppercase; text-decoration: none;
}
.menu-secondary { will-change: opacity, transform, filter; }
.menu-word { position: relative; display: inline-block; text-decoration: none; }
.menu-word__b { position: absolute; inset: 0; opacity: 0; pointer-events: none; }
```
`SHOP` (`__a`) sits in normal flow; `MENU` (`__b`) is absolutely stacked on top of it at `opacity: 0` and is revealed only after SHOP has fully exited. `aria-hidden="true"` on `__b`.

**Account:**
```css
.account {
  display: flex; gap: var(--space-5);
  font-size: var(--fs-ui); font-weight: 700;
  letter-spacing: 0.02em; text-transform: uppercase;
}
.account a { text-decoration: none; }
```
Copy: `"CART (0)"`, `"SIGN IN"`. **The account block and the brand video are the only header elements that never animate** — no JS ever touches them.

**Scroll animation applied to this section** — all driven by `headerP = remap(p, 0, 0.126)`, each item with its own sub-window; see the beat table in §"Interactions & animation loop". Exit order is deliberately **bottom-of-the-list first**: tagline → ABOUT US → EVENTS → SERVICES → BRANDS → SHOP, then MENU enters.

### 2) Hero video frame — `.hero`

```html
<section class="hero">
  <video class="hero-bg-video" muted playsinline preload="auto">
    <source src="…hf_20260723_172008_….mp4" type="video/mp4">
  </video>
</section>
```

```css
.hero {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  z-index: 10;
  margin: 30vh 0 0 0;              /* CSS rest state — JS lerps margin-top to 0 */
  background-color: #000;
  /* NO overflow, NO will-change — see invariant 2 */
}
.hero-bg-video {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  border: none; outline: none;
  object-fit: cover;
  z-index: 0;
}
```
At rest the frame is a full-width letterbox occupying the bottom **70vh** (30vh of white air above it). It is edge-to-edge horizontally with **no border-radius, no border, no inset** on the left/right/bottom. Because the video is `inset: 0` + `object-fit: cover`, its content is always centred **inside the frame** and re-crops naturally as the frame grows — that reframing is the parallax feel; there is no separate parallax transform.

Scroll animation: `hero.style.marginTop = lerp(0.3 * window.innerHeight, 0, a)` in px, where `a = easeOutCubic(remap(p, 0, 0.18))`. The video's `currentTime` scrub is specified in §"Interactions & animation loop".

### 3) Hero title — `.hero-title`

```html
<h1 class="hero-title">
  Frame your face&rsquo;s <span class="italic">refined</span> expression.
</h1>
```
Rendered text, verbatim including the right single quote: `"Frame your face’s refined expression."` — one line, no `<br>`, no `max-width`.

```css
.hero-title {
  position: fixed;
  z-index: 40;
  left: var(--space-6); right: var(--space-6);
  bottom: calc(70vh + var(--space-5));         /* 24px above the frame's top edge; 647.99px @1440×900 */
  color: var(--ink-inverse);
  mix-blend-mode: difference;
  pointer-events: none;
  font-size: 2.5rem;                           /* 30.0px @1440, 40px @1920 */
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.01em;
  will-change: opacity, transform, filter;
}
.hero-title .italic {
  font-family: var(--font-serif-italic);
  font-style: italic;
  font-weight: 400;
}
```
**Source quirk, reproduce as-is:** `styles.css` declares `.hero-title` **twice** — an early rule containing only `will-change: opacity, transform, filter;` and a later rule with everything else. The merged result is what is written above; keeping one merged rule is fine, keeping the duplicate is equally fine. The positioning is bottom-anchored to the frame line (`70vh`), not top-anchored to the header, so it stays 24px above the video edge regardless of header height.

Scroll animation: exits on the **Phase A** curve, identical to `.cta` — `opacity 1 → 0`, `translateY 0 → −32px`, `blur 0 → 12px`, `pointer-events: none` once `a > 0.98`.

### 4) Hero footer / CTA — `.hero-footer` > `.cta`

```html
<div class="hero-footer">
  <div class="cta">
    <p class="cta-copy">WE BELIEVE IN THE SEAMLESS RESTORATION OF ARTIST&rsquo;S POETRY AND METICULOUS DEDICATION, THEREBY WE PROTECT THE COUTURE OF EVERY ARTISAN AND CRAFT.</p>
    <a class="shop-now" href="#"><span class="shop-now__label">SHOP NOW</span></a>
  </div>
</div>
```

```css
.hero-footer {
  position: fixed; z-index: 20;
  left: var(--space-6); right: var(--space-6); bottom: var(--space-6);
  display: flex; align-items: flex-end; gap: var(--space-5);
  color: var(--ink-inverse);
  pointer-events: none;
  mix-blend-mode: difference;                  /* GROUP blend — stable, never animated */
}
.hero-footer a, .hero-footer button { pointer-events: auto; }

.cta {
  display: flex; flex-direction: column; align-items: flex-end;
  gap: var(--space-4);
  text-align: right;
  margin-left: auto;
}
.cta-copy {
  font-size: var(--fs-ui); font-weight: 700; line-height: 1.55;
  letter-spacing: 0.02em; text-transform: uppercase;
}
.shop-now {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 3rem;                            /* 36px @1440 */
  padding: 0 2.5rem;                           /* 0 30px @1440 */
  background: #fff;
  color: #fff;                                 /* white-on-white by design — inner blend reveals it */
  border-radius: var(--radius-pill);
  font-size: var(--fs-brand); font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase; text-decoration: none;
}
.shop-now__label { color: #fff; mix-blend-mode: difference; }   /* the second inversion */
```
The blend lives on the **container**, not on `.cta`. That is deliberate: `.cta` is transformed and faded every frame, and a `mix-blend-mode` on an element that also gets `transform`/`filter` drops out mid-animation. Putting the group blend on the never-animated `.hero-footer` keeps the inversion stable for the whole exit.

`.cta-copy` has **no `max-width`** — it wraps against the flex container width and lands on 2 lines at 1440. There is **no hover, focus, or active state defined** anywhere in the source for `.shop-now` (or any other control); do not invent one.

Scroll animation: exits on the Phase A curve, in lockstep with `.hero-title` (same `opacity`, same `translateY`, same `blur`, same `pointer-events` cutoff).

### 5) Product card — `.product`

```html
<article class="product">
  <div class="product-thumb">
    <img src="…encrypted-tbn0.gstatic.com/…" alt="Portrait Fleuris 1005 eyewear frame">
  </div>
  <div class="product-info">
    <h2>Portrait, Fleuris 1005</h2>
    <p class="desc">A HAND-CUT, ACETATE FRAME, AND FLORAL INLAY LENS THAT PROTECTS AND HELPS FOCUS EACH EYE WHILE YOU BLINK.</p>
    <span class="price">$4,650.00</span>
  </div>
</article>
```

```css
.product {
  position: fixed; z-index: 20;
  left: var(--space-6); bottom: var(--space-6);
  display: flex; align-items: stretch;
  gap: var(--space-4);
  flex-shrink: 0;
  color: var(--ink-inverse);       /* white text — explicit, not inherited (it is a body-level element) */
  opacity: 0;                      /* intentional: revealed by scroll at 18% */
  /* NO mix-blend-mode — the card and photo render in true colors */
}
.product-thumb {
  position: relative;
  width:  calc(7rem * var(--card-scale, 1));   /* 84px @scale 1 → 159.5px @scale 1.9, at 1440 */
  height: calc(7rem * var(--card-scale, 1));
  flex-shrink: 0;
  align-self: stretch;
  background: #fff;
  border-radius: var(--radius-sm);
}
.product-thumb img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: contain;
  padding: 0.375rem;
}
.product-info { display: flex; flex-direction: column; }
.product-info h2 {
  font-size: 1.375rem;             /* 16.49px @1440 */
  font-weight: 500; line-height: 1.15; letter-spacing: -0.01em;
  margin-bottom: 0.625rem;
}
.desc {
  font-size: var(--fs-ui); font-weight: 700; line-height: 1.5;
  letter-spacing: 0.02em; text-transform: uppercase;
  max-width: 34rem;                /* 407.8px @1440 — wraps to exactly 2 lines */
  margin-bottom: 0.875rem;
}
.price {
  display: inline-block;
  font-size: 1.375rem; font-weight: 400; letter-spacing: -0.01em;
  margin-top: auto;                /* pins the price to the bottom as the card grows */
}
```
The growth behaviour: `align-items: stretch` makes `.product-info` match the thumbnail's height, and `margin-top: auto` on `.price` pushes the price to the bottom of that stretched column. So as `--card-scale` rises from 1 to 1.9 the square thumbnail grows, the info column stretches with it, `h2` + `.desc` stay pinned to the top and `.price` slides down — the card visually opens. **Text size never changes**; only the frame and the gap grow.

Measured widths at **1440×900** (useful for self-checking): `.product-info` is a constant **407.8px** (the `.desc` `max-width` of 34rem is the binding constraint), thumbnail **84px → 159.5px**, so total card width **503.8px → 579.4px**, and its right edge sits at **527.8px → 603.3px**.

Scroll animation: enter only — `opacity 0 → 1` and `blur 12px → 0` across `p ∈ [0.18, 0.36]`. No translate. `--card-scale` then runs `1 → 1.9` across `p ∈ [0.36, 0.88]`.

### 6) Add-to-cart button — `.add-btn`

```html
<button type="button" class="add-btn" aria-label="Add to cart">
  <span class="add-btn__label" aria-hidden="true">+</span>
</button>
```

```css
.add-btn {
  position: fixed; z-index: 20;
  bottom: var(--space-6);
  left: calc(38rem + 7rem * var(--card-scale, 1));   /* STATIC FALLBACK — see below */
  width: 3.375rem; height: 3.375rem;                 /* 40.48px @1440 */
  border: none; border-radius: 50%;
  background: #fff;
  color: #fff;
  font-size: 1.625rem;                               /* 19.49px @1440 */
  cursor: pointer;
  padding: 0;
  display: inline-flex; align-items: center; justify-content: center;
  mix-blend-mode: difference;
  opacity: 0;
  will-change: opacity, transform, filter;
}
.add-btn__label {
  display: inline-flex; align-items: center; justify-content: center;
  color: #fff;
  mix-blend-mode: difference;                        /* the second inversion */
  padding-bottom: 0.1875rem;                         /* optical centring of the "+" glyph */
}
```

**About the `left` value (hardening — read this).** The original source ships **no** `left` in CSS and assigns it in JS on every frame:
```js
const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
addBtn.style.left = product.getBoundingClientRect().right + rootPx + 'px';
```
i.e. *the card's right edge plus one `1rem` gap*. Reproduce that JS sync — it is the source of truth and it survives content changes. But **also ship the static CSS value above**, because a `position: fixed` element with no `left` falls back to its static position at the left edge and the button lands on top of the card whenever JS has not run yet.

The CSS expression is derived, not guessed: card left `2rem` + thumb `7rem × scale` + inner gap `1rem` + info `34rem` + outer gap `1rem` = `38rem + 7rem × scale`. Verified against the JS output at 1440×900: **45rem = 539.8px** at scale 1, **51.3rem = 615.3px** at scale 1.9 — exact match to the JS-computed values.

Scroll animation: enters together with `.product` (`opacity 0 → 1`, `blur 12px → 0` across `[0.18, 0.36]`), gets `pointer-events: none` while `enterP < 0.02`, and its `left` is re-synced every frame.

### 7) Scroll spacer — `.scroll-spacer`

```html
<div class="scroll-spacer" aria-hidden="true"></div>
```
```css
.scroll-spacer { height: 220vh; pointer-events: none; }
```
The only element in normal document flow. At a 900px-tall viewport it makes the document **1980px** tall, giving **1080px** of scrollable distance. Empty by design — do not remove it as dead markup, do not give it content.

## Interactions & animation loop

One `requestAnimationFrame` loop drives everything. There are no CSS transitions or keyframes anywhere in the source — every animated value is written to `element.style` each frame, so motion tracks the scrollbar 1:1 with no lag.

### Setup

```js
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

Element handles (bail out early if the three structural ones are missing):
```js
const hero, heroTitle, video, tagline, secondaryItems /* NodeList→Array of .menu-secondary */,
      wordA /* .menu-word__a */, wordB /* .menu-word__b */, cta, product, addBtn, spacer;
if (!hero || !video || !spacer) return;
```

### Constants

```js
const A_END          = 0.18;              // end of Phase A (frame expand + title/CTA exit)
const B_END          = 0.88;              // end of the video scrub; [0.88, 1] holds the last frame
const HEADER_A_END   = A_END * 0.7;       // = 0.126 — header finishes before the frame does
const PRODUCT_ENTER  = [A_END, A_END + 0.18];        // = [0.18, 0.36]
const SCALE_WINDOW   = [A_END + 0.18, B_END];        // = [0.36, 0.88]
const MENU_ENTER     = [0.90, 1.00];      // normalized inside HEADER_A_END, for wordB
const K              = 0.1;               // video scrub lerp coefficient
const DEADBAND       = 0.02;              // seconds; below this no seek is issued
```

Per-item header exit windows — **normalized inside `headerP`**, stagger `0.08`, span `0.45`. The array index comment matters: DOM order is BRANDS, SERVICES, EVENTS, ABOUT US, so the reversed visual order is produced by indexing backwards.
```js
const EXIT_WINDOWS = {
  tagline:  [0.00, 0.45],
  aboutUs:  [0.08, 0.53],   // secondaryItems[3]
  events:   [0.16, 0.61],   // secondaryItems[2]
  services: [0.24, 0.69],   // secondaryItems[1]
  brands:   [0.32, 0.77],   // secondaryItems[0]
  shop:     [0.40, 0.85],   // wordA
};
```

### Helper formulas — reproduce these, not their products

```js
const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);

function remap(p, inMin, inMax) {
  if (inMax === inMin) return 0;
  return Math.min(1, Math.max(0, (p - inMin) / (inMax - inMin)));
}

function lerp(a, b, t) { return a + (b - a) * t; }
```

### Scroll → progress

```js
let rawProgress = 0;
function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  rawProgress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}
window.addEventListener('scroll', onScroll, { passive: true });
```
The listener only stores the number; all writes happen in the RAF loop.

### Measure / resize

```js
let restingMarginTop = 0;
function measure() {
  restingMarginTop = 0.3 * window.innerHeight;
  if (window.scrollY === 0) hero.style.marginTop = restingMarginTop + 'px';
}
let resizeT;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(measure, 120);     // debounced 120ms
});
```

### The two style-application primitives

```js
// Blur-lift-fade EXIT. Used for the tagline, the four secondary menu items, and SHOP.
function applyExit(el, window, headerP) {
  const raw = remap(headerP, window[0], window[1]);
  const p = prefersReduced ? raw : easeOutCubic(raw);
  el.style.opacity   = String(1 - p);
  el.style.transform = `translateY(${-12 * p}px)`;
  el.style.filter    = prefersReduced || p < 0.005 ? '' : `blur(${8 * p}px)`;
}

// ENTER from below. Used only for MENU (wordB).
function applyEnter(el, window, headerP) {
  const raw = remap(headerP, window[0], window[1]);
  const p = prefersReduced ? raw : easeOutCubic(raw);
  el.style.opacity   = String(p);
  el.style.transform = `translateY(${6 * (1 - p)}px)`;
  el.style.filter    = prefersReduced || 1 - p < 0.005 ? '' : `blur(${6 * (1 - p)}px)`;
}
```
Note the asymmetry, it is intentional: the exit travels **−12px** with **8px** of blur, the enter travels only **+6px** with **6px** of blur — the entrance is softer than the exit, and it rises *from below* rather than dropping from above. The `< 0.005` guards clear the `filter` string entirely rather than writing `blur(0px)`, which avoids keeping a filter layer alive at rest.

### The frame loop

`applyStyles(now)` runs every frame and re-queues itself with `requestAnimationFrame(applyStyles)` as its last statement. In order:

```js
const p = rawProgress;
const aRaw = remap(p, 0, A_END);
const a = prefersReduced ? aRaw : easeOutCubic(aRaw);
const headerP = remap(p, 0, HEADER_A_END);      // NOT eased here — easing is applied per-item inside applyExit/applyEnter
```

1. **Frame expand** — `hero.style.marginTop = lerp(restingMarginTop, 0, a) + 'px'`.

2. **Title + CTA exit** (one shared triplet, applied to both elements):
   ```js
   const contentOpacity = 1 - a;
   const contentY       = -32 * a;
   const contentBlur    = prefersReduced ? 0 : 12 * a;
   ```
   applied as `opacity`, `transform: translateY(${contentY}px)`, `filter: contentBlur > 0.05 ? blur(${contentBlur}px) : ''`, and `pointerEvents = a > 0.98 ? 'none' : ''`. `.cta` is wrapped in an `if (cta)` guard.

3. **Product + button enter:**
   ```js
   const enterRaw = remap(p, PRODUCT_ENTER[0], PRODUCT_ENTER[1]);
   const enterP   = prefersReduced ? enterRaw : easeOutCubic(enterRaw);
   const enterBlur = prefersReduced ? 0 : 12 * (1 - enterP);
   const enterFilter = enterP < 1 && enterBlur > 0.05 ? `blur(${enterBlur}px)` : '';
   [product, addBtn].forEach((el) => {
     if (!el) return;
     el.style.opacity = String(enterP);
     el.style.filter  = enterFilter;
   });
   if (addBtn) addBtn.style.pointerEvents = enterP < 0.02 ? 'none' : '';
   ```
   No `translateY` on this pair — it is a pure fade-out-of-blur.

4. **Button position sync** (every frame, unconditionally):
   ```js
   if (addBtn && product) {
     const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
     addBtn.style.left = product.getBoundingClientRect().right + rootPx + 'px';
   }
   ```
   `rootPx` is re-read each frame rather than cached, because the fluid root changes with viewport width.

5. **Card scale:**
   ```js
   const scaleRaw = remap(p, SCALE_WINDOW[0], SCALE_WINDOW[1]);
   const scaleP   = prefersReduced ? scaleRaw : easeOutCubic(scaleRaw);
   document.documentElement.style.setProperty('--card-scale', String(1 + 0.9 * scaleP));
   ```

6. **Header exits, then the MENU enter** — called in this exact order:
   ```js
   applyExit(tagline,            EXIT_WINDOWS.tagline,  headerP);
   applyExit(secondaryItems[3],  EXIT_WINDOWS.aboutUs,  headerP);   // each guarded by if (secondaryItems[n])
   applyExit(secondaryItems[2],  EXIT_WINDOWS.events,   headerP);
   applyExit(secondaryItems[1],  EXIT_WINDOWS.services, headerP);
   applyExit(secondaryItems[0],  EXIT_WINDOWS.brands,   headerP);
   applyExit(wordA,              EXIT_WINDOWS.shop,     headerP);
   applyEnter(wordB,             MENU_ENTER,            headerP);
   ```
   The `[0.85 → 0.90]` gap between SHOP finishing and MENU starting is a deliberate beat of emptiness in the menu slot.

7. **Video scrub** (the only part that uses the `now` timestamp):
   ```js
   const duration = video.duration || 0;
   if (duration > 0) {
     const bRaw = remap(p, 0, B_END);
     scrubTarget = bRaw * duration;

     scrubCurrent += (scrubTarget - scrubCurrent) * K;              // K = 0.1
     if (Math.abs(scrubTarget - scrubCurrent) < 0.0001) scrubCurrent = scrubTarget;

     if (!seeking &&
         Math.abs(scrubCurrent - video.currentTime) > DEADBAND &&   // 0.02s
         now - lastSeekTs > 30) {                                   // 30ms throttle
       seeking = true;
       lastSeekTs = now;
       try { video.currentTime = scrubCurrent; } catch (_) { seeking = false; }
     }
   }
   ```
   **The scrub window starts at `p = 0`, not at `A_END`** — the video begins moving on the very first pixel of scroll, concurrently with the frame expand. (A stale comment in the source calls this "Phase B"; the behaviour above is what actually runs.) State is held in four module-level variables: `scrubTarget = 0`, `scrubCurrent = 0`, `seeking = false`, `lastSeekTs = 0`. The `seeked` listener clears the flag:
   ```js
   video.addEventListener('loadedmetadata', () => {
     try { video.pause(); video.currentTime = 0.001; } catch (_) {}
   });
   video.addEventListener('seeked', () => { seeking = false; });
   ```
   Three guards must all be present or the decoder stalls: the `seeking` flag (one seek in flight at a time), the `DEADBAND` (ignore sub-20ms corrections), and the `30ms` minimum interval between seeks.

### Beat table (normalized units)

Phase A / global beats, in `p` (0–1 of total scroll):

| Beat | Window in `p` | From → To | Ease |
|---|---|---|---|
| Frame expand (`.hero` margin-top) | `[0, 0.18]` | `0.3 × innerHeight` → `0` px | easeOutCubic |
| Hero title exit | `[0, 0.18]` | opacity `1→0`, y `0→−32px`, blur `0→12px` | easeOutCubic |
| CTA exit | `[0, 0.18]` | identical to the title | easeOutCubic |
| Product + `+` enter | `[0.18, 0.36]` | opacity `0→1`, blur `12→0px` | easeOutCubic |
| Card scale (`--card-scale`) | `[0.36, 0.88]` | `1 → 1.9` | easeOutCubic |
| Video scrub | `[0, 0.88]` | `currentTime 0 → duration` | linear + lerp `K=0.1` |
| Video hold | `[0.88, 1]` | last frame, static | — |

Header beats, in `headerP` (0–1 across `p ∈ [0, 0.126]`) — all exits are `opacity 1→0`, `y 0→−12px`, `blur 0→8px`; the single enter is `opacity 0→1`, `y +6→0px`, `blur 6→0px`:

| Element | Window in `headerP` | Direction |
|---|---|---|
| `.tagline-hero` | `[0.00, 0.45]` | exit |
| `ABOUT US` (`secondaryItems[3]`) | `[0.08, 0.53]` | exit |
| `EVENTS` (`secondaryItems[2]`) | `[0.16, 0.61]` | exit |
| `SERVICES` (`secondaryItems[1]`) | `[0.24, 0.69]` | exit |
| `BRANDS` (`secondaryItems[0]`) | `[0.32, 0.77]` | exit |
| `SHOP` (`.menu-word__a`) | `[0.40, 0.85]` | exit |
| `MENU` (`.menu-word__b`) | `[0.90, 1.00]` | enter |

### Boot

```js
function boot() {
  measure();
  onScroll();
  requestAnimationFrame(applyStyles);
  const brandVideo = document.querySelector('video.brand');
  if (brandVideo) brandVideo.play().catch(() => {});   // autoplay safety net for the header logo
}
```
The `play().catch(() => {})` is required — the `autoplay` attribute alone is unreliable for a remote video, and the swallowed rejection avoids an unhandled promise error when a browser blocks it.

### Reduced motion

`prefers-reduced-motion: reduce` **does not disable the site** — the structural motion (frame expand, video scrub, card scale, all fades) still runs. It changes exactly two things: every eased progress falls back to its raw linear value (`easeOutCubic` is skipped), and every `blur()` is dropped (`contentBlur = 0`, `enterBlur = 0`, and both `applyExit`/`applyEnter` write an empty `filter`). Opacity and `translateY` amplitudes are unchanged.

## The loader / reveal

Skip — the site has no loader. First paint is the full resting layout: white page, header with the looping brand video, headline at 2.5rem above the frame, the video frame filling the bottom 70vh with `#000` behind it until the remote MP4 paints, and the CTA block bottom-right. The product card and `+` button are present in the DOM at `opacity: 0` and are revealed only by scroll.

## Fixed parameters (bake these in)

**Palette**
- `--bg: #fff`, `--ink: #000`, `--ink-inverse: #fff`, `--surface: #fff` (declared, unused)
- `.hero` fallback background: `#000`
- Every button/frame fill: literal `#fff`. No greys, no accent, no rgba, no gradients, no shadows anywhere in the source.

**Typography**
- Families: `"Helvetica Neue", Helvetica, Arial, sans-serif`; `Georgia, "Times New Roman", serif` (the `refined` italic only)
- Root: `clamp(11px, 0.833vw, 16px)`
- `--fs-ui: max(11px, 0.6875rem)` · `--fs-brand: max(11px, 0.75rem)`
- `.hero-title`: 2.5rem / 500 / line-height 1.05 / letter-spacing −0.01em
- `.hero-title .italic`: Georgia italic / 400
- `.product-info h2`: 1.375rem / 500 / 1.15 / −0.01em / margin-bottom 0.625rem
- `.price`: 1.375rem / 400 / −0.01em / margin-top auto
- `.tagline-hero`: `--fs-ui` / 700 / 1.45 / +0.01em / uppercase / max-width 21.25rem
- `.menu a`: `--fs-ui` / 700 / 1.55 / +0.02em / uppercase
- `.account`: `--fs-ui` / 700 / +0.02em / uppercase
- `.desc`: `--fs-ui` / 700 / 1.5 / +0.02em / uppercase / max-width 34rem / margin-bottom 0.875rem
- `.cta-copy`: `--fs-ui` / 700 / 1.55 / +0.02em / uppercase / no max-width
- `.shop-now`: `--fs-brand` / 700 / +0.06em / uppercase
- `.add-btn`: 1.625rem; `.add-btn__label` padding-bottom 0.1875rem

**Spacing & sizing**
- `--space-4: 1rem` · `--space-5: 1.5rem` · `--space-6: 2rem`
- Header padding: `1.5rem 2rem`; header gap `2rem`; menu `<ul>` gap **2px** (literal)
- `.account` gap `1.5rem`
- `.hero` margin `30vh 0 0 0`
- `.hero-title`: `left/right: 2rem`, `bottom: calc(70vh + 1.5rem)`
- `.hero-footer`: `left/right/bottom: 2rem`, gap `1.5rem`
- `.product`: `left/bottom: 2rem`, gap `1rem`
- `.product-thumb`: `calc(7rem * var(--card-scale, 1))` square, radius `--radius-sm` (0.375rem); image `padding: 0.375rem`, `object-fit: contain`
- `.add-btn`: `3.375rem` square, `border-radius: 50%`, `bottom: 2rem`, `left: calc(38rem + 7rem * var(--card-scale, 1))`
- `.shop-now`: `min-height: 3rem`, `padding: 0 2.5rem`, `border-radius: 999px`
- `.brand-frame`: **130px × 56px**, `overflow: hidden` · `.brand`: **168px × 56px**, `object-fit: cover`, `margin-left: −19px` — all five stay `px`
- `.scroll-spacer`: `220vh`

**Motion** (constants + formulas — do not pre-multiply)
- `A_END 0.18` · `B_END 0.88` · `HEADER_A_END 0.126` · `PRODUCT_ENTER [0.18, 0.36]` · `SCALE_WINDOW [0.36, 0.88]` · `MENU_ENTER [0.90, 1.00]`
- `EXIT_WINDOWS`: tagline `[0.00,0.45]`, aboutUs `[0.08,0.53]`, events `[0.16,0.61]`, services `[0.24,0.69]`, brands `[0.32,0.77]`, shop `[0.40,0.85]` — stagger `0.08`, span `0.45`
- Easing: `easeOutCubic(p) = 1 − (1 − p)³`. **This is the only easing in the project** — there is no cubic-bezier, no spring, no CSS transition anywhere.
- Exit amplitudes: `opacity 1→0`, `translateY 0→−12px`, `blur 0→8px`, filter cleared when `p < 0.005`
- Enter amplitudes: `opacity 0→1`, `translateY +6→0px`, `blur 6→0px`, filter cleared when `1 − p < 0.005`
- Title/CTA exit amplitudes: `opacity 1→0`, `translateY 0→−32px`, `blur 0→12px`, filter cleared when `blur ≤ 0.05`, `pointer-events: none` when `a > 0.98`
- Product/`+` enter: `opacity 0→1`, `blur 12→0px`, `pointer-events: none` when `enterP < 0.02`
- Card scale: `1 + 0.9 × scaleP` → max **1.9**
- Video scrub: lerp `K = 0.1`; snap when `|target − current| < 0.0001`; `DEADBAND = 0.02s`; seek throttle `30ms`; `seeking` flag cleared on the `seeked` event; prime with `currentTime = 0.001` on `loadedmetadata`
- Resize debounce: `120ms`
- `restingMarginTop = 0.3 × window.innerHeight`

**Scroll ranges** (each reproduced independently even where two coincide)
- Global progress: `scrollY / (documentElement.scrollHeight − innerHeight)`, clamped `[0, 1]`
- Phase A: `remap(p, 0, 0.18)` → eased
- Header window: `remap(p, 0, 0.126)` → **not** eased at this level
- Product enter: `remap(p, 0.18, 0.36)` → eased
- Card scale: `remap(p, 0.36, 0.88)` → eased
- Video: `remap(p, 0, 0.88)` → linear, then lerped

**Copy verbatim**
- `<title>`: `"Blind by Glamour"`
- Tagline: `"WITH EVERY PROFILE WE PICKED, WE STRIVE TO AWAKEN THE VISION, AND GIVE THE BEST"`
- Menu: `"SHOP"` · `"MENU"` · `"BRANDS"` · `"SERVICES"` · `"EVENTS"` · `"ABOUT US"`
- Account: `"CART (0)"` · `"SIGN IN"`
- Headline: `"Frame your face’s refined expression."` (`&rsquo;`, with `refined` wrapped in `<span class="italic">`)
- Product: `"Portrait, Fleuris 1005"`
- Description: `"A HAND-CUT, ACETATE FRAME, AND FLORAL INLAY LENS THAT PROTECTS AND HELPS FOCUS EACH EYE WHILE YOU BLINK."`
- Price: `"$4,650.00"`
- CTA copy: `"WE BELIEVE IN THE SEAMLESS RESTORATION OF ARTIST’S POETRY AND METICULOUS DEDICATION, THEREBY WE PROTECT THE COUTURE OF EVERY ARTISAN AND CRAFT."` (`&rsquo;`)
- CTA button: `"SHOP NOW"`
- Add button: label `"+"`, `aria-label="Add to cart"`, `aria-hidden="true"` on the inner span
- Image alt: `"Portrait Fleuris 1005 eyewear frame"`
- `aria-label="Primary"` on `<nav>`, `aria-hidden="true"` on `.scroll-spacer` and on `.menu-word__b`
- Every `href` is `"#"`

**Breakpoints**
None. The source contains **zero media queries** — the only responsive mechanism is the fluid root `clamp()` and `vh`/`vw` units. Do not add breakpoints, do not add a mobile layout.

## Assets

| Kind | URL | Used by |
|---|---|---|
| Video (MP4) | `https://d8j0ntlcm91z4.cloudfront.net/user_3GJaYKPxdnQG0Q9O26lu6DPmcHu/hf_20260723_195927_ed99d7a6-2edd-42cb-ae51-494cc41a854d.mp4` | `.brand` — header wordmark. Native **1470×630**. Autoplays, muted, loops, playsinline, `preload="auto"`. |
| Video (MP4) | `https://d8j0ntlcm91z4.cloudfront.net/user_3GJaYKPxdnQG0Q9O26lu6DPmcHu/hf_20260723_172008_6f130e07-eb0a-4962-b1ec-ade50ddca91e.mp4` | `.hero-bg-video` — the scrubbed hero. Native **1920×1080**, duration **6.041667s**. `muted playsinline preload="auto"` **only** — no autoplay, no loop. |
| Image (PNG) | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUlRtRVj5FKnv5Y3ORh7yQ2gX21cFWOcqdSIlsrbdC96_SsVulylOGkEM&s=10` | `.product-thumb img` — the eyewear frame photo. |
| Font | System stack only — `"Helvetica Neue", Helvetica, Arial, sans-serif` and `Georgia, "Times New Roman", serif` | All text; Georgia italic for `refined` |

Both videos are cross-origin (CloudFront) and carry **no `crossorigin` attribute** — that is correct and must stay that way: adding `crossorigin="anonymous"` would require CORS headers the CDN does not send and would break playback. No `fetchpriority` is specified in the source.

**Serving note:** the page must be opened over HTTP (e.g. `npx serve`), not via `file://` — a `file://` origin blocks the remote video loads in Chrome and Safari.
