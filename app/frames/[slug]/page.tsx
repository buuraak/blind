import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "../../_components/product-detail";
import { FRAMES, getFrame, otherFrames } from "../../_data/frames";

/**
 * `/frames/[slug]` — one page per frame in the collection.
 *
 * A Server Component that resolves the frame and hands plain data to the client
 * component that does the motion. `generateStaticParams` prerenders all six at build
 * time; without it the segment would fall back to dynamic rendering at request time
 * and `<Link>` would skip prefetching it entirely.
 *
 * `params` is a Promise in Next 15+ — it must be awaited, not read synchronously.
 */

export function generateStaticParams() {
  return FRAMES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const frame = getFrame(slug);
  if (!frame) return {};

  return {
    // The root layout's title template appends " — Blind by Glamour".
    title: `${frame.name} ${frame.ref}`,
    description: `${frame.name} ${frame.ref}. ${frame.description}`,
    openGraph: {
      title: `${frame.name} ${frame.ref} — Blind by Glamour`,
      description: frame.description,
      images: [{ url: frame.img }],
    },
  };
}

export default async function FramePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const frame = getFrame(slug);
  if (!frame) notFound();

  return <ProductDetail frame={frame} others={otherFrames(slug)} />;
}
