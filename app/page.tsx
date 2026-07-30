import BlindByGlamour from "./_components/blind-by-glamour";

/**
 * Returns the client component directly — no wrapper element. Everything it
 * renders must land as a direct child of <body> for mix-blend-mode to work.
 */
export default function Page() {
  return <BlindByGlamour />;
}
