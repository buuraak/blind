import type { Metadata, Viewport } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blind by Glamour",
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
      {/* The skip link is a sibling of `children`, not a wrapper — it adds no
          stacking context, so the blend invariant above still holds. */}
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
