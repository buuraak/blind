import type { Metadata, Viewport } from "next";
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

/* The palette is #fff and #000 with no dark variant, so the scheme is declared
   light rather than left to the UA — otherwise a dark-mode browser restyles the
   native <select>/input chrome against a white page. themeColor matches the ground. */
export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
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
      {/* The skip link is a sibling of the scroll provider, not a wrapper — it adds
          no stacking context, so the blend invariant above still holds. <SmoothScroll>
          emits no DOM with `root`, so `children` still render directly into <body>. */}
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
