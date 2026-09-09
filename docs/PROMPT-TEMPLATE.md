# PROMPT-TEMPLATE.md

A fill-in template for commissioning a site build from an AI agent, generalized from the
prompt that produced the reference build. That prompt is archived verbatim as
[`PROMPT-ORIGINAL.md`](PROMPT-ORIGINAL.md) — read it as the worked example.

Fill every `{{PLACEHOLDER}}`. Delete sections that genuinely do not apply; do not delete
§0.

---

## Why this structure beats "make it beautiful"

"Make it beautiful, editorial, premium" produces the average of everything the model has
seen, which is exactly the generic output you are trying to avoid. Adjectives cannot be
checked, so nothing can fail. This structure works because of five properties:

**1. Numbers, not adjectives.** "Tight tracking" is unfalsifiable; `letter-spacing:
-0.01em` is either right or wrong. Every subjective quality has a numeric proxy — replace
the adjective with the number and the model stops interpreting.

**2. Copy verbatim.** Given as prose to paraphrase, an agent will "improve" it into
marketing voice. Given in a fenced block marked verbatim — including typographic
apostrophes — it reproduces exactly. Copy is design.

**3. Rest state stated explicitly.** Most spec failures are not the animation, they are
what the page looks like *before* it runs. State the static CSS rest state and say that
scripts animate *from* it. This also makes the page correct at first paint with JS off.

**4. Negative constraints, with reasons.** An agent will "helpfully" add `overflow:
hidden`, invent a hover state, or add a breakpoint. Each of those is a plausible
improvement, so it survives review unless forbidden. Say **"do not add X"** and say why —
the reason is what stops it being re-added later.

**5. A checklist to verify against.** Give measured values at named viewport sizes so
correctness is testable rather than argued. `.info` is `407.8px` at 1440 either matches or
it does not.

**Invariants go first.** Put the handful of constraints that break in naive
reproductions at the very top, before any detail, and say that is what they are. Detail
buried on page four gets skimmed.

---

# Recreate this site as {{DELIVERABLE — e.g. "a single self-contained index.html" / "a Next.js App Router page"}}: {{PROJECT NAME}} — {{ONE-LINE DESCRIPTION}}

Build {{DELIVERABLE}} that reproduces the project below **exactly** — same layout,
visuals, motion, and interaction. {{STACK CONSTRAINTS: build step? framework? bundler?
libraries permitted or forbidden — be explicit, e.g. "no libraries at all (no GSAP, no
Lenis) — the source uses a hand-rolled requestAnimationFrame loop and nothing else"}}.
Hardcode every value given here as a fixed constant.

## 0. READ THIS FIRST — non-negotiable invariants

These {{N}} constraints are what break in naive reproductions. Read them before any
detail.

> **How to fill this.** List only things that fail *silently* — no error, just a wrong
> page. For each: state the rule, then **why** it exists, then the specific wrong thing an
> agent would otherwise do. Aim for 4–6. Pull ready-made entries from the
> **Invariant library** at the end of this file.

1. **{{INVARIANT 1 — one bold sentence}}**
   {{Why it exists. What breaks without it. The specific plausible-but-wrong alternative
   to forbid, named explicitly.}}

2. **{{INVARIANT 2}}** …

**Also mandatory:** {{cross-cutting rules — e.g. fluid root + every dimension in `rem`;
which values are intentionally `px` and must stay `px`}}.

## Structure & layers

> **How to fill this.** One ASCII tree of every element in DOM order, annotated with
> positioning, z-index, blend mode, and a few words on behaviour. This is the single most
> useful block in the whole prompt — it fixes the DOM shape before any prose is read.

```
<body>                                    {{page background, overscroll behaviour}}
  <{{el}} class="{{class}}">        {{pos}}  {{z}}  {{blend}}   {{behaviour}}
    ├ {{child}}                            {{note}}
    └ {{child}}                            {{note}}
  <div class="{{spacer}}">          flow         height:{{N}}vh — the sole scroll driver
  <script>
```

## What it is

> **How to fill this.** Two or three paragraphs of plain prose: what the page looks like
> at rest, then what scrolling does, then the visual signature. This is the only place
> adjectives are allowed — it gives the agent intent to resolve ambiguity against. Name
> the *feeling* ("behaves like a scroll-driven film rather than a page").

{{PROSE}}

## Page shell & libraries

- **{{Build constraints restated}}**
- **Document head:** {{exact `<head>` block}}
- **Fonts:** {{exact stacks. If system-only, say so and add: "Do not add a Google Fonts
  link."}}
- **Script placement:** {{where, and any boot guard, verbatim}}
- **CSS reset (exact):** {{full reset block}}
  {{Note anything unusual and why it must stay. Add: "There are no `::selection`,
  `:focus`, or scrollbar rules in the source — do not invent any."}}
- **Fluid root (critical):**
  ```css
  html { font-size: clamp({{MIN}}, {{PREFERRED}}vw, {{MAX}}); }
  ```
  Resolved: {{width → px at each reference width}}.

## Global CSS / tokens

```css
:root {
  {{--token: value;  /* note unused tokens explicitly so they are not "cleaned up" */}}
}
```

{{State what does NOT exist: "no spacing scale beyond X, no colour beyond Y, no accent,
no shadow token, no easing tokens in CSS."}}

Resolved token values at the reference widths:

| Token | @{{W1}} (root {{px}}) | @{{W2}} | @{{W3}} |
|---|---|---|---|
| {{--token}} | {{px}} | {{px}} | {{px}} |

> **Why this table.** It turns `rem` arithmetic into checkable numbers and catches a
> wrong root font-size immediately.

## Shared components / primitives

{{List reusable primitives, or write "Skip — the site has no reusable UI primitives" and
say where the shared logic actually lives.}}

## Layout & sections (in order)

> **How to fill this.** One subsection per section, in DOM order. For each: **DOM
> verbatim** in a fenced block, **CSS verbatim** in a fenced block, then prose for
> anything non-obvious — especially any number that looks arbitrary. Where a value was
> derived, show the derivation; where it was measured, give the measurement and the
> viewport it was measured at.

### {{N}}) {{Section name}} — `.{{class}}`

DOM:
```html
{{VERBATIM MARKUP}}
```

```css
{{VERBATIM CSS}}
```

{{Prose. Explain any non-obvious geometry with its arithmetic — e.g. "the source video is
1470×630; the render box 168×56 has aspect 3.0, so `cover` fills the width and clips 8px
top and bottom; the 130px wrapper then clips 19px each side."}}

Measured at **{{W}}×{{H}}** (for self-checking): {{element}} is **{{px}}**, {{element}}
**{{px}} → {{px}}**.

Scroll animation: {{window in progress, from → to, easing}}.

## Interactions & animation loop

### Setup
{{Feature detection, element handles, early-bail conditions.}}

### Constants
```js
{{VERBATIM CONSTANTS with inline comments explaining each}}
```

### Helper formulas — reproduce these, not their products
```js
{{easing, remap, lerp — as source}}
```
> **Why.** Given resolved outputs, an agent hardcodes a lookup table that breaks at other
> viewport sizes. Give the functions.

### Scroll → progress
```js
{{exact progress calculation and listener options}}
```

### Measure / resize
```js
{{what is re-measured, and the debounce}}
```

### Style-application primitives
```js
{{the 1–3 functions that write styles, verbatim}}
```
{{Call out deliberate asymmetries — e.g. "the exit travels −12px with 8px blur, the enter
only +6px with 6px blur: entrances are softer than exits and rise from below."}}

### The frame loop
{{Numbered list of what happens each frame, **in order**. Order matters where one step
reads layout another step wrote.}}

### Beat table

| Beat | Window in `p` | From → To | Ease |
|---|---|---|---|
| {{beat}} | `[{{a}}, {{b}}]` | {{from → to}} | {{ease}} |

{{Second table for any sub-timeline with its own normalized progress.}}

### Boot
```js
{{boot sequence, including any safety nets and why they are required}}
```

### Reduced motion
{{State exactly what changes and what does NOT. Recommended: softens rather than
disables — drop easing to linear and remove blurs; keep opacity, translation, and all
structural motion.}}

## The loader / reveal

{{Describe it, or "Skip — the site has no loader" and describe first paint instead.}}

## Fixed parameters (bake these in)

> **How to fill this.** A flat dump of every value already stated above. Redundant on
> purpose: it is the checklist an agent verifies against at the end, and it catches
> anything skimmed.

**Palette** — {{every colour; state explicitly what does not exist: "no greys, no accent,
no rgba, no gradients, no shadows anywhere"}}

**Typography** — {{families; root clamp; every size/weight/line-height/tracking/max-width
per class}}

**Spacing & sizing** — {{every spacing token and per-element geometry; flag values that
are intentionally `px`}}

**Motion** — {{every constant and window; state "do not pre-multiply"; name the single
easing function and say it is the only one}}

**Scroll ranges** — {{each remap, and whether it is eased at that level}}

**Copy verbatim** — {{every string, including `<title>`, aria-labels, and hrefs. Use
entities for typographic punctuation.}}

**Breakpoints** — {{list them, or: "None. Zero media queries — the only responsive
mechanism is the fluid root and vh/vw units. Do not add breakpoints or a mobile layout."}}

## Assets

| Kind | URL / path | Used by |
|---|---|---|
| {{kind}} | `{{url}}` | {{selector}} — {{native dimensions, duration, exact attributes}} |

{{Attribute-level notes and why they matter — e.g. "carries no `crossorigin`; adding it
would require CORS headers the CDN does not send and would break playback."}}

**Serving note:** {{e.g. "must be opened over HTTP, not `file://` — a file origin blocks
the remote video loads."}}

## Do not

> **How to fill this.** Every plausible "improvement" you do not want. Each line: the
> action, then the reason. Without a reason it gets re-added later.

- Do not add {{library/framework/dependency}} — {{reason}}.
- Do not add `overflow` or `will-change` to {{element}} — {{reason}}.
- Do not invent hover, focus, `::selection`, or scrollbar styling — none is specified.
- Do not convert `rem` to `px` (except {{the listed exceptions}}).
- Do not add breakpoints or a separate mobile layout.
- Do not paraphrase, expand, or "improve" any copy marked verbatim.
- Do not "correct" {{the deliberately odd thing}} — it is intentional: {{reason}}.
- Do not add sections, colours, or components that are not specified. If something seems
  missing, ask.

## Acceptance checklist

> **How to fill this.** Turn the spec into checks with measured expected values. Prefer
> checks an agent can run itself over ones requiring a human eye.

- [ ] Renders correctly at first paint with JavaScript disabled; rest state matches the CSS
- [ ] {{Blended/structural elements}} are direct children of `<body>`; computed blend is `{{mode}}`
- [ ] `html`/`body` have no `overflow` and no height cap
- [ ] Root font-size resolves to {{px}} @{{W1}}, {{px}} @{{W2}}, {{px}} @{{W3}}
- [ ] Document height is {{N}}vh; scrollable distance is {{px}} at {{H}}px viewport
- [ ] At `p = {{x}}`: {{element}} is {{measured value}}
- [ ] {{Media}} reaches {{end state}} at `p = {{x}}` and holds to `p = 1`
- [ ] All copy matches the verbatim block character-for-character, including `{{’}}`
- [ ] Palette audit returns nothing: `grep -nE '#[0-9a-fA-F]{3,6}' … | grep -viE '{{allowed}}'`
- [ ] Server HTML already contains the hidden rest state for scroll-revealed elements
- [ ] Zero console errors; `npx tsc --noEmit && npm run build` pass

---

## Invariant library — copy from here

Battle-tested entries for §0. Copy the ones that apply, adjusting selectors.

**Spacer-driven scroll**
> A `{{N}}vh` spacer `<div>` is the only thing in normal flow — everything visible is
> `position: fixed`. `.scroll-spacer { height: {{N}}vh }` is **literal and load-bearing**:
> it exists solely to create scroll distance. Never "correct" it to `100vh`,
> `min-height`, or delete it as empty markup. Read progress from the **window**, never a
> nested container. `html, body` must stay free of `overflow` and height caps. If the
> target builder wraps output in a framework root, **strip the default scaffold CSS** —
> starter templates centre, pad, and clip the page and kill the scroll.

**`mix-blend-mode` requires body-level children**
> `mix-blend-mode: difference` only works on elements that are direct children of
> `<body>`. WebKit silently drops it when the element sits inside an ancestor with
> `overflow: hidden` or one promoted to its own compositing layer (`will-change`).
> Therefore `{{blend backdrop}}` **must not** have `overflow: hidden` and **must not**
> have `will-change` — both were deliberately removed; do not add them back. Every
> blended element is a direct child of `<body>` — do not nest them into wrappers "for
> layout".

**Double-difference on blended pills**
> The outer element is `background: #fff; color: #fff; mix-blend-mode: difference`, and a
> nested `<span>` carries `color: #fff; mix-blend-mode: difference` a second time. The
> outer blend inverts the pill against the media; the inner inverts the label back so it
> stays legible on any frame. Removing either layer breaks legibility.

**Correct at first paint without JS**
> Every element has a real static CSS rested state; JS only animates *from* it.
> `{{element}}`'s rest value is in **CSS**, not written by JS. Elements that ship
> `opacity: 0` are **intentional**, not a bug — they are scroll-revealed. Do not "fix"
> them to `opacity: 1`.

**Media is scrubbed, never played**
> `{{video}}` has **no `autoplay`, no `loop`, no `controls`** — only `muted playsinline
> preload="auto"`. On `loadedmetadata` the script pauses it and seeds `currentTime =
> 0.001`. From then on only `currentTime` is assigned, through an RAF lerp with a
> deadband and an in-flight seek gate cleared by the `seeked` event. Never call `.play()`.

**JS-written custom property with a load-bearing fallback**
> `--{{name}}` is written by JS onto `document.documentElement` each frame and consumed as
> `calc({{X}} * var(--{{name}}, {{fallback}}))`. The `, {{fallback}}` default keeps layout
> correct before the first frame — every consumer must supply it.

**Static fallback for a JS-positioned fixed element**
> `{{element}}` must ship a static CSS `{{property}}`. Reproduce the per-frame JS sync as
> source-of-truth **but keep the CSS value too** — a `position: fixed` element with no
> `{{property}}` collapses to the viewport edge before JS runs. The two agree exactly
> (verified: {{value}} at {{state A}}, {{value}} at {{state B}}).
