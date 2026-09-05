import type { Metadata } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";
import { SmoothScroll } from "./_components/smooth-scroll";

export const metadata: Metadata = {
  /** Resolves the product pages' relative Open Graph images to absolute URLs.
   *  Set NEXT_PUBLIC_SITE_URL in the deploy environment. */
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Blind by Glamour",
    /** Product pages set only their own name; the house closes every title. */
    template: "%s — Blind by Glamour",
  },
};

/**
 * INVARIANT: `children` must render DIRECTLY into <body> with no wrapper element.
 *
 * Every blended element (.hero-title, .hero-footer, .add-btn) relies on
 * `mix-blend-mode: difference` compositing against the root stacking context. A wrapper
 * <div> here — or any positioned / transformed / will-change ancestor — creates a new
 * stacking context, and the blend would composite against that wrapper's empty content
 * instead of the hero video. Every white element would silently go invisible.
 *
 * Fragments and context providers (incl. <ReactLenis root>) are safe: they emit no DOM.
 * Wrapper elements are not.
 *
 * No next/font here on purpose — the design is system-font only (Helvetica / Georgia).
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
