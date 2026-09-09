# CONSOLIDATE-PROMPT.md

Paste the block below into **any other site-building chat** to merge that project's
reusable learnings into this shared documentation set.

Use it at the end of a build, once the project's decisions have settled. It uses absolute
paths, so it works from any working directory.

---

```
Consolidate the reusable learnings from this chat into our shared design/engineering
documentation.

DOCS LOCATION (absolute — use these paths regardless of your working directory):
  /Users/burakbaykara/Desktop/testing/blind-by-glamour/docs/README.md
  /Users/burakbaykara/Desktop/testing/blind-by-glamour/docs/DESIGN-PRINCIPLES.md
  /Users/burakbaykara/Desktop/testing/blind-by-glamour/docs/TECHNICAL-PLAYBOOK.md
  /Users/burakbaykara/Desktop/testing/blind-by-glamour/docs/PROMPT-TEMPLATE.md

STEP 1 — READ FIRST, ALL OF THEM.
Read all four files completely before writing anything. You are merging into an existing
system, not starting one. Do not skim: much of what you are about to add may already be
there under different wording.

STEP 2 — DECIDE WHAT QUALIFIES.
Include only learnings that will transfer to a DIFFERENT project:
  - A rule that failed SILENTLY — no error, no build failure, just a wrong result.
  - A design decision the client approved or rejected, WITH the reason.
  - A bug whose fix generalizes, plus the wrong-but-plausible alternative it rules out.
  - A measured number that makes a subjective quality checkable.
  - A verification technique that caught something a screenshot would not.

EXCLUDE project-specific trivia: this project's palette values, its copy, its component
names, its section order, its asset URLs, its file paths. Those belong in that project's
own docs. If a value is useful only as an illustration, present it explicitly as a worked
example, not as a default.

STEP 3 — MERGE ADDITIVELY.
  - Enhance existing rules rather than duplicating them. If a rule is already there and
    you have sharper evidence, a measured number, or a new failure mode, STRENGTHEN THAT
    ENTRY IN PLACE.
  - Add a new section only when the learning genuinely has no home.
  - Never delete or weaken an existing rule because this project did not need it. A rule
    that did not come up here is not a rule that was disproven.
  - Match the existing voice: numbers not adjectives, failure mode stated first, the
    wrong-but-plausible alternative named explicitly.
  - Mark anything you did not verify as (unverified).

Route by file:
  DESIGN-PRINCIPLES.md  — aesthetic rules, palette/type/motion/layout/voice, scope
                          discipline, and the banned "default AI design" list.
  TECHNICAL-PLAYBOOK.md — anything that fails silently: scroll architecture, media
                          scrubbing, stacking contexts, SSR/rest state, measurement,
                          verification.
  PROMPT-TEMPLATE.md    — improvements to how work is commissioned: a new section the
                          template should have, a new entry for the invariant library, a
                          sharper acceptance check.
  README.md             — the project log and the "Last updated" line.

STEP 4 — RECONCILE CONTRADICTIONS EXPLICITLY.
If something you learned CONTRADICTS an existing rule, do not silently overwrite it and do
not quietly append a second opinion. State both, and say WHEN EACH APPLIES. For example:
"Use X when <condition>; on <this kind of project> Y was correct instead, because
<reason>." A contradiction is usually a missing condition, not a wrong rule.

Call out every contradiction in your final summary, even the ones you resolved.

STEP 5 — UPDATE THE README.
  - Add this project to the project log: name, one line on what it was, and what it
    contributed to the docs.
  - Update the "Last updated" line at the bottom.

STEP 6 — DO NOT COMMIT.
Leave all changes uncommitted for review. Do not run git commit, git push, or create a
branch.

STEP 7 — FINISH WITH AN AUDIT LIST.
End your reply with a flat, skimmable list so the changes can be reviewed without
diffing:
  ADDED       — new rules, with the file and section each landed in
  ENHANCED    — existing rules you strengthened, and what evidence you added
  RECONCILED  — contradictions found, and the condition under which each version applies
  SKIPPED     — learnings you judged too project-specific, and why

If nothing from this chat qualifies, say so plainly and change nothing. An honest "no
transferable learnings" is a valid outcome and is better than padding the docs.
```
