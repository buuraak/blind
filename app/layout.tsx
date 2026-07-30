import type { Metadata } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blind by Glamour",
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
      <body>{children}</body>
    </html>
  );
}
