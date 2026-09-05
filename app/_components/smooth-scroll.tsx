"use client";

import { ReactLenis } from "lenis/react";

/**
 * Lenis, hoisted out of the home page so every route scrolls the same way. It was
 * previously mounted inside blind-by-glamour.tsx, so a product page would have fallen
 * back to native scrolling — the site's whole sense of weight lives in this easing.
 *
 * Safe under the root layout's no-wrapper invariant: with `root` set, ReactLenis
 * returns `children` untouched and emits no DOM of its own (lenis-react.mjs:116).
 * Without `root` it wraps everything in a <div>, which would create a stacking
 * context and silently kill every mix-blend-mode element on the film.
 *
 * Smoother and slower than Lenis' defaults (lerp 0.1, wheelMultiplier 1): a lower
 * lerp lengthens the glide so the page eases to rest instead of stopping with the
 * wheel, and a sub-1 multiplier means each notch travels less distance.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.055, wheelMultiplier: 0.72 }}>
      {children}
    </ReactLenis>
  );
}
