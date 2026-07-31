"use client";

import { useEffect, useRef } from "react";
import { motion, type Variants } from "motion/react";

const COLUMNS = [
  { head: "NAV", links: ["HOME", "SHOP", "LEARN", "OUR STORY", "SUBSCRIBE"] },
  { head: "SHOP", links: ["ALL FRAMES", "OPTICAL", "SUN", "ONE OF ONE"] },
  { head: "ATELIER", links: ["THE HOUSE", "CRAFT", "STOCKISTS", "PRESS"] },
  { head: "HELP", links: ["FAQS", "CONTACT", "RETURNS", "SHIPPING"] },
  { head: "SOCIALS", links: ["INSTAGRAM", "PINTEREST"] },
];

/**
 * Blur-lift reveal — the page's existing vocabulary run in reverse. `custom` carries
 * the stagger index so the block arrives in sequence rather than all at once.
 */
const reveal: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(10px)" },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

/** Fires once the footer is genuinely on screen, not merely clipping into it. */
const inView = { once: true, amount: 0.3 } as const;

export function SiteFooter() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);

  /**
   * Size the wordmark to fill its container's width exactly.
   *
   * A hardcoded `vw` font-size cannot do this: the width of "Blind" depends on the
   * font's metrics, so any fixed value either overflows (it did — the B and d were
   * cut off at both edges) or leaves a gap. Measuring at a reference size and scaling
   * by the ratio makes it exact, and re-runs on resize. Set imperatively rather than
   * through state so there is no second render or flash.
   */
  useEffect(() => {
    const fit = () => {
      const wrap = wrapRef.current;
      const mark = markRef.current;
      if (!wrap || !mark) return;
      const cs = getComputedStyle(wrap);
      const avail =
        wrap.clientWidth -
        parseFloat(cs.paddingLeft) -
        parseFloat(cs.paddingRight);
      if (avail <= 0) return;
      mark.style.fontSize = "100px";
      const w = mark.getBoundingClientRect().width;
      if (w > 0) mark.style.fontSize = `${(100 * avail) / w}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (wrapRef.current) ro.observe(wrapRef.current);
    // Georgia is a system font, but metrics can settle a tick after first paint.
    const t = setTimeout(fit, 120);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, []);

  return (
    <motion.footer
      className="site-footer"
      aria-labelledby="footer-heading"
      initial="hidden"
      whileInView="show"
      viewport={inView}
    >
      <h2 id="footer-heading" className="sr-only">
        Site footer
      </h2>

      <div className="footer-top">
        <div className="footer-lead">
          <motion.p className="footer-headline" variants={reveal} custom={0}>
            The right amount of <span className="italic">looking.</span>
          </motion.p>
          <motion.p className="footer-sub" variants={reveal} custom={1}>
            JOIN THE LIST FOR 10% OFF YOUR FIRST ORDER
          </motion.p>
          <motion.form
            className="footer-signup"
            variants={reveal}
            custom={2}
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="YOUR EMAIL ADDRESS"
              aria-label="Email address"
              required
            />
            <button type="submit">SUBSCRIBE</button>
          </motion.form>
        </div>

        <nav className="footer-cols" aria-label="Footer">
          {COLUMNS.map((c, i) => (
            <motion.div
              key={c.head}
              className="footer-col"
              variants={reveal}
              custom={2 + i * 0.4}
            >
              <p className="footer-head">{c.head}</p>
              <ul>
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#">{l}</a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </nav>
      </div>

      {/* The wordmark is the footer's primary graphic, not a watermark: full-bleed,
          solid, and cropped by the footer's bottom edge. */}
      <motion.div
        className="footer-wordmark"
        aria-hidden="true"
        variants={reveal}
        custom={4}
        ref={wrapRef}
      >
        <span className="footer-wordmark__serif" ref={markRef}>
          Blind
        </span>
      </motion.div>

      <motion.div className="footer-legal" variants={reveal} custom={5}>
        <span>© 2026 BLIND BY GLAMOUR · ALL RIGHTS RESERVED</span>
        <span className="footer-legal__links">
          <a href="#">PRIVACY POLICY</a>
          <a href="#">TERMS OF SERVICE</a>
        </span>
      </motion.div>
    </motion.footer>
  );
}
