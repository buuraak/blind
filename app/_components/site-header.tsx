"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, type MotionStyle, type MotionValue } from "motion/react";
import { BrandMark } from "./logos";

/**
 * The site header, in two variants from one piece of markup.
 *
 * It used to live inside blind-by-glamour.tsx, wired directly to the hero's scroll
 * progress — which meant no other route could have a header at all. The animation is
 * now injected: pass `animation` and every item takes its scroll-driven style (the
 * home page's staggered exit, the SHOP→MENU cross-fade, the white plate fading in as
 * Act 2 arrives); omit it and the header is a plain solid bar, which is what every
 * route that isn't the film needs.
 *
 * The four-column rhythm (brand / tagline / menu / account) is load-bearing — see the
 * 130×56 note on `.brand`. The static variant drops the tagline, which is hero copy,
 * and `space-between` closes the gap on its own.
 */
/**
 * `style` is the third case: a header floating over full-screen video, where it must
 * start transparent with white type and resolve to the solid bar as the film scrolls
 * away. The product page passes animated `background` and `color` — `color` alone
 * flips the whole bar, since the links inherit it and the brand mark paints with
 * `fill: currentColor`.
 */
export type HeaderAnimation = {
  background: MotionValue<string>;
  tagline: MotionStyle;
  shop: MotionStyle;
  menu: MotionStyle;
  brands: MotionStyle;
  services: MotionStyle;
  events: MotionStyle;
  aboutUs: MotionStyle;
};

const SECONDARY = [
  { key: "brands", label: "BRANDS" },
  { key: "services", label: "SERVICES" },
  { key: "events", label: "EVENTS" },
  { key: "aboutUs", label: "ABOUT US" },
] as const;

export function SiteHeader({
  animation,
  style,
}: {
  animation?: HeaderAnimation;
  style?: MotionStyle;
}) {
  const hero = animation !== undefined;
  /* The solid plate is the fallback only. When a caller drives the background itself
     the class would win nothing useful and fight the animated value. */
  const solid = !hero && style === undefined;

  /* The mobile panel's state belongs here rather than to a caller: every route that
     renders a header needs it, and no caller has any reason to read it. */
  const [navOpen, setNavOpen] = useState(false);
  const close = () => setNavOpen(false);

  return (
    <motion.header
      className={solid ? "site-header site-header--solid" : "site-header"}
      style={hero ? { background: animation.background } : style}
    >
      {/* On the film the mark is inert (it is the page you are on, and `.brand` sets
          pointer-events: none). Everywhere else it is the way back. */}
      {hero ? (
        <BrandMark className="brand" />
      ) : (
        <Link href="/" aria-label="Blind by Glamour — home">
          <BrandMark className="brand brand--link" />
        </Link>
      )}

      {hero && (
        <motion.p className="tagline-hero" style={animation.tagline}>
          WITH EVERY PROFILE WE PICKED, WE STRIVE TO AWAKEN THE VISION, AND GIVE
          THE BEST
        </motion.p>
      )}

      <nav className="menu" aria-label="Primary">
        <ul>
          <li className="menu-primary">
            <a href="#" className="menu-word">
              <motion.span
                className="menu-word__a"
                style={hero ? animation.shop : undefined}
              >
                SHOP
              </motion.span>
              {/* The cross-fade only exists on the film, where the list beneath it
                  has already exited and MENU has something to stand for. */}
              {hero && (
                <motion.span
                  className="menu-word__b"
                  aria-hidden="true"
                  style={animation.menu}
                >
                  MENU
                </motion.span>
              )}
            </a>
          </li>
          {SECONDARY.map((item) => (
            <motion.li
              key={item.key}
              className="menu-secondary"
              style={hero ? animation[item.key] : undefined}
            >
              <a href="#">{item.label}</a>
            </motion.li>
          ))}
        </ul>
      </nav>

      <div className="account">
        <a href="#">CART (0)</a>
        <a href="#">SIGN IN</a>
      </div>

      {/* Mobile only (CSS-toggled at 768px). The desktop nav above keeps its
          scroll-driven SHOP -> MENU morph untouched; below the breakpoint that
          choreography has nowhere to land, so the header collapses to brand +
          toggle and everything else moves into the panel. */}
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={navOpen}
        aria-controls="mobile-nav"
        onClick={() => setNavOpen((v) => !v)}
      >
        {navOpen ? "CLOSE" : "MENU"}
      </button>

      <div
        id="mobile-nav"
        className={navOpen ? "mobile-nav is-open" : "mobile-nav"}
        hidden={!navOpen}
      >
        <ul>
          {["SHOP", "BRANDS", "SERVICES", "EVENTS", "ABOUT US"].map((l) => (
            <li key={l}>
              <a href="#" onClick={close}>
                {l}
              </a>
            </li>
          ))}
        </ul>
        <div className="mobile-nav__account">
          <a href="#" onClick={close}>
            CART (0)
          </a>
          <a href="#" onClick={close}>
            SIGN IN
          </a>
        </div>
      </div>
    </motion.header>
  );
}
