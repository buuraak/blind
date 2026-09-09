"use client";

import { useEffect, useState } from "react";
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
  /* Read on the client only: the query is unavailable during SSR, and defaulting to
     false keeps the standard path as the server-rendered one. */
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /* Under reduced motion smoothing is switched off at the source rather than tuned
     down: smoothWheel:false hands the wheel back to the browser, so there is no
     interpolation left to glide. lerp:1 alone still routed every wheel event through
     Lenis' RAF and measured 86px of travel after the input stopped. Damping the wheel
     is itself motion the user asked not to have.

     This gate was written for the film's inline Lenis and has to live here now that
     the provider is hoisted — otherwise hoisting it silently un-fixed reduced motion
     for every route. */
  return (
    <ReactLenis
      root
      options={
        reduced
          ? { smoothWheel: false, wheelMultiplier: 1, lerp: 1 }
          : { lerp: 0.055, wheelMultiplier: 0.72 }
      }
    >
      {children}
    </ReactLenis>
  );
}
