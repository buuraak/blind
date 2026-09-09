# Team documentation — building sites that don't look AI-generated

Shared, project-independent guidance for commissioning and building editorial, cinematic,
restrained websites with AI agents.

Everything here was extracted from real builds: decisions a client approved or rejected,
corrections given in review, and bugs whose fixes generalize. Nothing is aspirational —
if a rule is here, something broke without it.

---

## The five documents

| Doc | What it covers | Read it when |
|---|---|---|
| **[DESIGN-PRINCIPLES.md](DESIGN-PRINCIPLES.md)** | The aesthetic system: palette philosophy, the two typographic registers, spacing and layout, the motion vocabulary, voice, scope discipline — and a **banned list** of "default AI design" moves | Before any visual work; when reviewing whether something looks generic |
| **[TECHNICAL-PLAYBOOK.md](TECHNICAL-PLAYBOOK.md)** | Engineering rules that **fail silently**: scroll architecture, video scrubbing, `mix-blend-mode` stacking traps, SSR rest state, measure-don't-guess, verification | Before any scroll-driven, media-scrubbed, or blend-mode work; when something is visually wrong with no error |
| **[PROMPT-TEMPLATE.md](PROMPT-TEMPLATE.md)** | A fill-in template for commissioning a build, with a copy-from library of battle-tested invariants | At the start of a new project, writing the brief |
| **[PROMPT-ORIGINAL.md](PROMPT-ORIGINAL.md)** | The commissioning prompt for the reference build, archived verbatim | As the worked example when filling the template |
| **[CONSOLIDATE-PROMPT.md](CONSOLIDATE-PROMPT.md)** | A prompt to paste into other build chats so they merge their learnings back here | At the end of any other build |

### Not general — project-specific, stays authoritative for this codebase

`DESIGN.md`, `ARCHITECTURE.md`, and `../CLAUDE.md` describe **this** project only.
The general docs cross-reference them for worked examples; they are not templates.

---

## The short version

If you read nothing else:

1. **Two colours plus fixed opacity steps.** Never invent a third. If a surface seems to
   need a colour, **ask** — do not pick one and justify it.
2. **Two typographic registers**, with a hard gap between them: display at medium weight
   with negative tracking, micro-UI at bold uppercase with open tracking. Nothing between.
3. **One easing function and one entrance/exit vocabulary**, reused everywhere. That reuse
   is what makes separate sections read as one piece.
4. **Numbers, not adjectives**, in every brief. Adjectives cannot fail; numbers can.
5. **Subtract.** Roughly a third of the reference build was removed in review, and not one
   note asked for more.
6. **Correct layout does not imply correct paint** — and a bug you cannot reproduce is
   still a bug.

---

## Using this on a new project

1. **Write the brief** from [PROMPT-TEMPLATE.md](PROMPT-TEMPLATE.md). Fill every
   `{{PLACEHOLDER}}`; copy applicable entries from its invariant library into §0. Use
   [PROMPT-ORIGINAL.md](PROMPT-ORIGINAL.md) as the worked example of the finished shape.
2. **Seed the repo's agent rules.** Create a `CLAUDE.md` at the project root pointing at
   these docs and listing that project's own hard invariants. `../CLAUDE.md` is the model.
3. **Build**, keeping [TECHNICAL-PLAYBOOK.md](TECHNICAL-PLAYBOOK.md) open for anything
   involving scroll, scrubbed media, blend modes, or SSR reveals.
4. **Review against** [DESIGN-PRINCIPLES.md](DESIGN-PRINCIPLES.md) §9, the banned list.
   Run the palette audit and the SSR rest-state check.
5. **Verify with numbers**, not screenshots — sample the same normalized scroll points and
   diff. See the playbook §6.
6. **Consolidate**: paste [CONSOLIDATE-PROMPT.md](CONSOLIDATE-PROMPT.md) into that chat so
   its learnings come back here.

---

## Project log

Builds these docs are distilled from.

### Blind by Glamour — *reference build*

Scroll-driven single-page site for a fictional luxury eyewear atelier. A pinned hero whose
video is scrubbed frame-by-frame by scroll, a collection index with a cursor-following
hover reveal, a card pile that scatters to uncover a statement, and a fullscreen footer
that slides over it. Next.js 16 · React 19 · Motion · Lenis. Started as a single
self-contained `index.html`, then ported.

**Contributed:** the two-colour-plus-opacity palette rule and the "never invent a colour —
ask" discipline (broken twice here); the two typographic registers and the one-gesture
rule; the blur-lift-fade motion vocabulary with asymmetric enter/exit; spacer-as-pacing-dial
and the px-per-frame metric; the pin-and-slide-over pattern; the all-intra video encode
story with before/after measurements; `mix-blend-mode` stacking-context traps and
double-difference; the SSR `initial` rule; measure-don't-guess (text fitting, travel,
element height); "correct layout does not imply correct paint"; and the banned list.

---

Last updated: 2026-08-29 — initial pass, distilled from the Blind by Glamour build.
