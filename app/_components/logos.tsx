/**
 * Brand mark — "Editorial".
 *
 * Reuses the page's one-italic-gesture rule: the same Georgia italic that sets
 * "refined" in the headline carries the brand name, so the logo reads as part of the
 * typography rather than a separate mark.
 *
 * Sized to the 130×56 box the previous video wordmark occupied, so the header's
 * four-column flex rhythm is untouched. Painted with `fill: currentColor`, so it
 * simply takes the header's color (now solid black) — something the video wordmark
 * could never do, since a video's pixels can't be recolored by CSS.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={130}
      height={56}
      viewBox="0 0 130 56"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Blind by Glamour"
    >
      <text
        x="0"
        y="32"
        fill="currentColor"
        fontFamily='Georgia, "Times New Roman", serif'
        fontStyle="italic"
        fontWeight="400"
        fontSize="30"
        letterSpacing="-0.6"
      >
        Blind
      </text>
      <text
        x="1.5"
        y="48"
        fill="currentColor"
        fontFamily='"Helvetica Neue", Helvetica, Arial, sans-serif'
        fontWeight="700"
        fontSize="8"
        letterSpacing="2.05"
      >
        BY GLAMOUR
      </text>
    </svg>
  );
}
