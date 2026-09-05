import Link from "next/link";
import { SiteHeader } from "../../_components/site-header";
import { SiteFooter } from "../../_components/site-footer";

/** Shown when `notFound()` fires for a slug that isn't in the collection. */
export default function FrameNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="pdp pdp--empty">
        <p className="pdp-empty__line">
          That one was <span className="italic">never</span> made.
        </p>
        <Link className="pdp-back" href="/#collection">
          ← THE COLLECTION
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
