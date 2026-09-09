"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "motion/react";
import { FRAMES, frameHref } from "../_data/frames";

/**
 * Collection index. Rows of oversized type; hovering one reveals its frame image
 * trailing the cursor on a spring, and swaps the model name to the Georgia italic
 * used by the wordmark and the headline — so hover is a typographic event, not just
 * a color change.
 *
 * The image is a single element that swaps `src`, not one per row: only one is ever
 * visible, and reusing the node keeps the spring's position continuous as you move
 * between rows.
 */
export function CollectionIndex() {
  const [active, setActive] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  // Lag is the whole effect — the image chases the cursor rather than pinning to it.
  const x = useSpring(mouseX, { damping: 28, stiffness: 180, mass: 0.6 });
  const y = useSpring(mouseY, { damping: 28, stiffness: 180, mass: 0.6 });

  const onMove = (e: React.MouseEvent) => {
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box) return;
    mouseX.set(e.clientX - box.left);
    mouseY.set(e.clientY - box.top);
  };

  return (
    /* `id` is the target of the product page's ← THE COLLECTION link. */
    <section
      id="collection"
      className="collection"
      aria-labelledby="collection-heading"
    >
      <header className="section-head">
        <h2 id="collection-heading" className="section-label">
          THE COLLECTION
        </h2>
        <span className="section-count">SIX FRAMES · 2026</span>
      </header>

      <div
        className="collection-list"
        ref={wrapRef}
        onMouseMove={onMove}
        onMouseLeave={() => setActive(null)}
      >
        {FRAMES.map((f, i) => (
          <Link
            key={f.slug}
            href={frameHref(f.slug)}
            className="collection-row"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
          >
            <span className="collection-index-num">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className={
                active === i ? "collection-name is-active" : "collection-name"
              }
            >
              {f.name}
            </span>
            <span className="collection-ref">{f.ref}</span>
            <span className="collection-price">{f.price}</span>
          </Link>
        ))}

        <motion.div
          className="collection-peek"
          aria-hidden="true"
          style={{ x, y }}
          /* `initial` is required, not decorative: values that live only in `animate`
             are applied on the client after mount, so SSR emitted no opacity and CSS
             defaulted it to 1 — the image flashed in the corner on every page load
             before animating away. This puts opacity:0 in the server-rendered HTML. */
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{
            opacity: active === null ? 0 : 1,
            scale: active === null ? 0.88 : 1,
          }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={FRAMES[active ?? 0].img}
            alt=""
            draggable={false}
            width={900}
            height={506}
            loading="lazy"
            decoding="async"
          />
        </motion.div>
      </div>
    </section>
  );
}
