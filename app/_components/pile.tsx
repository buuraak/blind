"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

/**
 * Cards start stacked in a tight pile at centre and scatter OUTWARD to the edges as
 * you scroll, physically uncovering the statement underneath. The reveal is the
 * point — the type is not faded in, it is exposed by the cards moving off it.
 *
 * `from` is the stacked position, `to` the scattered one. Both are percentages of the
 * card's OWN size: Motion interpolates % on transforms reliably, and it keeps the
 * composition proportional at any viewport where vw would drift.
 */
const CARDS = [
  { img: "/frames/frame-01.jpg", from: { x: -20, y: -12, r: -10 }, to: { x: -142, y: -70, r: -17 } },
  { img: "/frames/frame-04.jpg", from: { x: 14, y: 8, r: 7 },      to: { x: 134, y: -78, r: 13 } },
  { img: "/frames/frame-02.jpg", from: { x: -8, y: 16, r: -4 },    to: { x: -152, y: 68, r: 10 } },
  { img: "/frames/frame-05.jpg", from: { x: 22, y: -6, r: 12 },    to: { x: 146, y: 74, r: -14 } },
  { img: "/frames/frame-03.jpg", from: { x: -16, y: 4, r: 3 },     to: { x: -174, y: -4, r: -7 } },
  { img: "/frames/frame-06.jpg", from: { x: 6, y: -18, r: -8 },    to: { x: 168, y: 14, r: 9 } },
];

/** The scatter occupies the middle of the track; the ends hold for entry and exit. */
const SCATTER_START = 0.16;
const SCATTER_END = 0.82;

/**
 * The last 100vh of the track is not animation — it is the window in which the footer
 * slides up over the still-pinned pile, exactly as .content slides over the fixed hero.
 * The pile's own animation is remapped to finish before that window opens, so it plays
 * out at its intended pace rather than being stretched across the overlap.
 * Must stay in sync with `.pile` height and `.site-footer` margin-top in globals.css.
 */
const TRACK_VH = 440;
const OVERLAP_VH = 100;
const ANIM_FRACTION = (TRACK_VH - OVERLAP_VH) / TRACK_VH; // 0.773
/** Slight per-card delay so the pile comes apart as a cascade, not a single pop. */
const STAGGER = 0.035;

const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function PileCard({
  card,
  index,
  progress,
  reduced,
}: {
  card: (typeof CARDS)[number];
  index: number;
  progress: MotionValue<number>;
  reduced: boolean;
}) {
  const start = SCATTER_START + index * STAGGER;
  const end = SCATTER_END;

  const t = useTransform(progress, (p) => {
    const raw = clamp01((p - start) / (end - start));
    return reduced ? raw : easeOutCubic(raw);
  });

  const lerp = (a: number, b: number, v: number) => a + (b - a) * v;

  const x = useTransform(t, (v) => `${lerp(card.from.x, card.to.x, v)}%`);
  const y = useTransform(t, (v) => `${lerp(card.from.y, card.to.y, v)}%`);
  const rotate = useTransform(t, (v) => lerp(card.from.r, card.to.r, v));

  return (
    <motion.figure
      className="pile-card"
      /* zIndex descends so the card on top of the stack is the first to peel away,
         which is what makes the pile read as coming apart rather than dissolving. */
      style={{ x, y, rotate, zIndex: CARDS.length - index }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={card.img}
        alt=""
        draggable={false}
        width={900}
        height={506}
        loading="lazy"
        decoding="async"
      />
    </motion.figure>
  );
}

export function Pile({ reduced = false }: { reduced?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  /* Rescale so the whole animation completes within the first ANIM_FRACTION of the
     track, leaving the tail as a dead zone the footer slides over. */
  const animProgress = useTransform(scrollYProgress, (v) =>
    Math.min(1, v / ANIM_FRACTION)
  );

  /* Spring-damped so a hard flick glides the pile apart instead of snapping it open.
     Deliberately light: Lenis already smooths the scroll itself (lerp 0.055), so a
     heavy spring stacks a second lag on top and the pile stops feeling connected to
     the wheel. Everything downstream reads from this spring. */
  const p = useSpring(animProgress, {
    damping: 30,
    stiffness: 220,
    mass: 0.6,
  });

  /* The statement is at full strength almost immediately. It is not faded in — the
     cards are sitting on top of it, and the scatter uncovers it. */
  const lineOpacity = useTransform(p, [0.02, 0.14], [0, 1]);

  /* No group fade-out: the footer now slides over the pile and covers it, the same
     way .content covers the fixed hero. Fading it first made the cards vanish into
     white before the footer arrived, which read as a gap rather than a transition. */

  return (
    <section className="pile" ref={trackRef} aria-labelledby="pile-heading">
      <div className="pile-pin">
        <header className="section-head pile-head">
          <h2 id="pile-heading" className="section-label">
            SELECTED WORKS
          </h2>
          <span className="section-count">SIX FRAMES</span>
        </header>

        <div className="pile-stage">
          <motion.p className="pile-line" style={{ opacity: lineOpacity }}>
            Made to be <span className="italic">looked through.</span>
          </motion.p>

          <div className="pile-cards">
            {CARDS.map((c, i) => (
              <PileCard
                key={c.img + i}
                card={c}
                index={i}
                progress={p}
                reduced={reduced}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
