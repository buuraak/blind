"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import { ReactLenis } from "lenis/react";
import { BrandMark } from "./logos";

/* ---------------------------------------------------------------- constants */

const A_END = 0.18; // end of Phase A (frame expand + title/CTA exit)
const B_END = 0.88; // end of the video scrub; [0.88, 1] holds the last frame
const HEADER_A_END = A_END * 0.7; // 0.126 — header finishes before the frame does
const PRODUCT_ENTER = [A_END, A_END + 0.18] as const; // [0.18, 0.36]
const SCALE_WINDOW = [A_END + 0.18, B_END] as const; //  [0.36, 0.88]
const MENU_ENTER = [0.9, 1.0] as const;
/** Scrub follow tuned for the all-intra encode (~5ms seeks). The original K=0.1 +
 *  30ms throttle existed to protect a single-GOP source whose seeks cost 24-33ms;
 *  with every frame a keyframe the lerp can converge ~3x faster and seeks are paced
 *  purely by the in-flight `seeking` flag (one at a time), no timer. */
const K = 0.3; // video scrub lerp coefficient
const DEADBAND = 0.02; // seconds; ~half a source frame (24fps = 41.7ms/frame)

/** Per-item header exit windows, normalized inside headerP. Stagger 0.08, span 0.45.
 *  Exit order is deliberately bottom-of-the-list first. */
const EXIT_WINDOWS = {
  tagline: [0.0, 0.45],
  aboutUs: [0.08, 0.53],
  events: [0.16, 0.61],
  services: [0.24, 0.69],
  brands: [0.32, 0.77],
  shop: [0.4, 0.85],
} as const;

/** Self-hosted all-intra re-encode of the CloudFront original (1920x1080, 24fps,
 *  145 frames, EVERY frame a keyframe). The original was a single 6s GOP — one
 *  keyframe total — so every seek decoded up to 145 frames from the start
 *  (24-33ms/seek). All-intra brings seeks to ~5ms and the file is smaller (8.8MB
 *  vs 11.9MB). Regenerate with:
 *  ffmpeg -i src.mp4 -c:v libx264 -g 1 -crf 21 -preset slow -pix_fmt yuv420p \
 *    -profile:v high -movflags +faststart -an hero-scrub-1080.mp4 */
const HERO_VIDEO = "/hero-scrub-1080.mp4";
const PRODUCT_IMG =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUlRtRVj5FKnv5Y3ORh7yQ2gX21cFWOcqdSIlsrbdC96_SsVulylOGkEM&s=10";

/* ------------------------------------------------------------------ helpers */

const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

function remap(p: number, inMin: number, inMax: number) {
  if (inMax === inMin) return 0;
  return Math.min(1, Math.max(0, (p - inMin) / (inMax - inMin)));
}

type Window2 = readonly [number, number];

/** Blur-lift-fade EXIT: opacity 1→0, y 0→−12px, blur 0→8px. */
function useExitStyle(
  progress: MotionValue<number>,
  win: Window2,
  reduced: boolean
) {
  const t = useTransform(progress, (p) => {
    const headerP = remap(p, 0, HEADER_A_END);
    const raw = remap(headerP, win[0], win[1]);
    return reduced ? raw : easeOutCubic(raw);
  });
  return {
    opacity: useTransform(t, (v) => 1 - v),
    y: useTransform(t, (v) => -12 * v),
    filter: useTransform(t, (v) =>
      reduced || v < 0.005 ? "none" : `blur(${8 * v}px)`
    ),
  };
}

/** ENTER from below: opacity 0→1, y +6→0px, blur 6→0px. Softer than the exit. */
function useEnterStyle(
  progress: MotionValue<number>,
  win: Window2,
  reduced: boolean
) {
  const t = useTransform(progress, (p) => {
    const headerP = remap(p, 0, HEADER_A_END);
    const raw = remap(headerP, win[0], win[1]);
    return reduced ? raw : easeOutCubic(raw);
  });
  return {
    opacity: t,
    y: useTransform(t, (v) => 6 * (1 - v)),
    filter: useTransform(t, (v) =>
      reduced || 1 - v < 0.005 ? "none" : `blur(${6 * (1 - v)}px)`
    ),
  };
}

/* ---------------------------------------------------------------- component */

export default function BlindByGlamour() {
  const [reduced, setReduced] = useState(false);
  const { scrollYProgress } = useScroll();

  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const productRef = useRef<HTMLElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /* Phase A — frame expand + title/CTA exit, both on the same curve */
  const a = useTransform(scrollYProgress, (p) => {
    const raw = remap(p, 0, A_END);
    return reduced ? raw : easeOutCubic(raw);
  });
  // Animated on .hero-window (an absolutely-positioned child), NOT on the fixed
  // .hero layer — resizing a full-screen fixed layer every frame is what produces
  // the stale-raster white band. `top: 30vh -> 0` yields the identical box.
  const heroWindowTop = useTransform(a, (v) => `${30 * (1 - v)}vh`);
  const contentOpacity = useTransform(a, (v) => 1 - v);
  const contentY = useTransform(a, (v) => -32 * v);
  const contentFilter = useTransform(a, (v) => {
    const blur = reduced ? 0 : 12 * v;
    return blur > 0.05 ? `blur(${blur}px)` : "none";
  });

  /* Product + button enter — pure fade-out-of-blur, no translate */
  const enterP = useTransform(scrollYProgress, (p) => {
    const raw = remap(p, PRODUCT_ENTER[0], PRODUCT_ENTER[1]);
    return reduced ? raw : easeOutCubic(raw);
  });
  const enterFilter = useTransform(enterP, (v) => {
    const blur = reduced ? 0 : 12 * (1 - v);
    return v < 1 && blur > 0.05 ? `blur(${blur}px)` : "none";
  });
  const addBtnPointer = useTransform(enterP, (v) => (v < 0.02 ? "none" : "auto"));

  /* Header — six exits then the MENU enter */
  const tagline = useExitStyle(scrollYProgress, EXIT_WINDOWS.tagline, reduced);
  const brands = useExitStyle(scrollYProgress, EXIT_WINDOWS.brands, reduced);
  const services = useExitStyle(scrollYProgress, EXIT_WINDOWS.services, reduced);
  const events = useExitStyle(scrollYProgress, EXIT_WINDOWS.events, reduced);
  const aboutUs = useExitStyle(scrollYProgress, EXIT_WINDOWS.aboutUs, reduced);
  const shop = useExitStyle(scrollYProgress, EXIT_WINDOWS.shop, reduced);
  const menu = useEnterStyle(scrollYProgress, MENU_ENTER, reduced);

  /* --card-scale lives on documentElement: .product-thumb and .add-btn's `left`
     fallback are separate body-level elements, so they need a common ancestor.
     The `, 1` fallback in CSS covers the window before this first runs. */
  const writeCardScale = (p: number) => {
    const raw = remap(p, SCALE_WINDOW[0], SCALE_WINDOW[1]);
    const scaleP = reduced ? raw : easeOutCubic(raw);
    document.documentElement.style.setProperty(
      "--card-scale",
      String(1 + 0.9 * scaleP)
    );
  };
  useMotionValueEvent(scrollYProgress, "change", writeCardScale);
  useEffect(() => {
    writeCardScale(scrollYProgress.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  /* Video scrub + add-btn position sync — one RAF, kept as-is from the original.
     Motion can't help here: the cost is H.264 decode, not the animation layer. */
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;

    let rafId = 0;
    let scrubTarget = 0;
    let scrubCurrent = 0;
    let seeking = false;

    const onLoadedMetadata = () => {
      try {
        video.pause();
        video.currentTime = 0.001;
      } catch {}
    };
    const onSeeked = () => {
      seeking = false;
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("seeked", onSeeked);
    if (video.readyState >= 1) onLoadedMetadata();

    const loop = () => {
      const p = scrollYProgress.get();

      // Keep the button glued to the card's right edge + 1rem, every frame.
      const product = productRef.current;
      const addBtn = addBtnRef.current;
      if (product && addBtn) {
        const rootPx = parseFloat(
          getComputedStyle(document.documentElement).fontSize
        );
        addBtn.style.left =
          product.getBoundingClientRect().right + rootPx + "px";
      }

      const duration = video.duration || 0;
      if (duration > 0) {
        const bRaw = remap(p, 0, B_END);
        scrubTarget = bRaw * duration;

        scrubCurrent += (scrubTarget - scrubCurrent) * K;
        if (Math.abs(scrubTarget - scrubCurrent) < 0.0001)
          scrubCurrent = scrubTarget;

        // Seeks are paced by the in-flight flag alone: the next one fires on the
        // frame after `seeked`. With ~5ms all-intra seeks that sustains ~60Hz+;
        // the old 30ms timer throttle protected the slow single-GOP source.
        if (!seeking && Math.abs(scrubCurrent - video.currentTime) > DEADBAND) {
          seeking = true;
          try {
            video.currentTime = scrubCurrent;
          } catch {
            seeking = false;
          }
        }
      }

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("seeked", onSeeked);
    };
  }, [scrollYProgress]);

  return (
    <ReactLenis root>
      <header className="site-header">
        <BrandMark className="brand" />

        <motion.p className="tagline-hero" style={tagline}>
          WITH EVERY PROFILE WE PICKED, WE STRIVE TO AWAKEN THE VISION, AND GIVE
          THE BEST
        </motion.p>

        <nav className="menu" aria-label="Primary">
          <ul>
            <li className="menu-primary">
              <a href="#" className="menu-word">
                <motion.span className="menu-word__a" style={shop}>
                  SHOP
                </motion.span>
                <motion.span
                  className="menu-word__b"
                  aria-hidden="true"
                  style={menu}
                >
                  MENU
                </motion.span>
              </a>
            </li>
            <motion.li className="menu-secondary" style={brands}>
              <a href="#">BRANDS</a>
            </motion.li>
            <motion.li className="menu-secondary" style={services}>
              <a href="#">SERVICES</a>
            </motion.li>
            <motion.li className="menu-secondary" style={events}>
              <a href="#">EVENTS</a>
            </motion.li>
            <motion.li className="menu-secondary" style={aboutUs}>
              <a href="#">ABOUT US</a>
            </motion.li>
          </ul>
        </nav>

        <div className="account">
          <a href="#">CART (0)</a>
          <a href="#">SIGN IN</a>
        </div>
      </header>

      <motion.h1
        className="hero-title"
        style={{
          opacity: contentOpacity,
          y: contentY,
          filter: contentFilter,
        }}
      >
        Frame your face&rsquo;s <span className="italic">refined</span>{" "}
        expression.
      </motion.h1>

      <section className="hero">
        <motion.div className="hero-window" style={{ top: heroWindowTop }}>
          <video
            ref={heroVideoRef}
            className="hero-bg-video"
            muted
            playsInline
            preload="auto"
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
        </motion.div>
      </section>

      {/* Group blend lives on .hero-footer, which is never animated. A blend on an
          element that also takes transform/filter drops out mid-animation. */}
      <div className="hero-footer">
        <motion.div
          className="cta"
          style={{
            opacity: contentOpacity,
            y: contentY,
            filter: contentFilter,
          }}
        >
          <p className="cta-copy">
            WE BELIEVE IN THE SEAMLESS RESTORATION OF ARTIST&rsquo;S POETRY AND
            METICULOUS DEDICATION, THEREBY WE PROTECT THE COUTURE OF EVERY
            ARTISAN AND CRAFT.
          </p>
          <a className="shop-now" href="#">
            <span className="shop-now__label">SHOP NOW</span>
          </a>
        </motion.div>
      </div>

      <motion.article
        ref={productRef}
        className="product"
        style={{ opacity: enterP, filter: enterFilter }}
      >
        <div className="product-thumb">
          {/* Plain <img>: next/image would wrap/inject sizing that fights the
              scale-driven calc() box, and the asset is a remote thumbnail. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PRODUCT_IMG} alt="Portrait Fleuris 1005 eyewear frame" />
        </div>
        <div className="product-info">
          <h2>Portrait, Fleuris 1005</h2>
          <p className="desc">
            A HAND-CUT, ACETATE FRAME, AND FLORAL INLAY LENS THAT PROTECTS AND
            HELPS FOCUS EACH EYE WHILE YOU BLINK.
          </p>
          <span className="price">$4,650.00</span>
        </div>
      </motion.article>

      <motion.button
        ref={addBtnRef}
        type="button"
        className="add-btn"
        aria-label="Add to cart"
        style={{
          opacity: enterP,
          filter: enterFilter,
          pointerEvents: addBtnPointer,
        }}
      >
        <span className="add-btn__label" aria-hidden="true">
          +
        </span>
      </motion.button>

      <div className="scroll-spacer" aria-hidden="true" />
    </ReactLenis>
  );
}
