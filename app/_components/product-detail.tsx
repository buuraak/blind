"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { frameHref, type Frame } from "../_data/frames";

/**
 * The product page.
 *
 * Opens on the frame's film at full screen, with the product sitting bottom-left over
 * it — the same corner the home page's product card occupies, so the two pages share a
 * reading position. Scrolling lands straight on the specification: the sticky crop
 * beside the description, the spec table and the price.
 *
 * The copy does not fade in. It is bound to scroll position and drifts against the
 * page (see `useDrift`), so the type keeps moving as long as the wheel does and
 * reverses when you scroll back.
 *
 * Every type size here is one the home page already uses — 4rem is the footer
 * headline, 1.375rem is the product card's name and price, and all micro-type is
 * `--fs-ui`. Nothing on this page invents a size.
 */

/** Resting tilt of the fanned pile, in degrees. Small and irregular — a pile that
 *  someone put down, not a deck that was shuffled. */
const STACK_TILT = [-7, 4, -3, 6, -5];

/** Which card in the collection row plays film instead of showing a still — the
 *  third, zero-indexed. A fixed position rather than a random one: it renders the
 *  same on the server and the client, so there is no hydration mismatch and no
 *  post-mount swap. Set to -1 to put the row back to stills only. */
const FILM_CARD = 2;

/** The house's arrival move, kept for the onward links — the same blur-lift the
 *  footer and the collection index use. */
const reveal: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(10px)" },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function ProductDetail({
  frame,
  others,
}: {
  frame: Frame;
  others: Frame[];
}) {
  const reduced = useReducedMotion() ?? false;
  const contentRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLElement>(null);

  /**
   * The film is PINNED and the white page is dragged up over it — the home page's
   * exact arrangement, where `.content` slides over the fixed hero. So this tracks the
   * content's arrival, not the film's departure: 0 when the content's top edge is at
   * the bottom of the viewport, 1 when it has reached the top and the film is fully
   * covered.
   *
   * It cannot be measured off the film any more. A sticky element's rect stays at
   * top: 0 for as long as it is stuck, so a scroll progress scoped to it would freeze
   * at 0 and never advance.
   */
  const { scrollYProgress: coverP } = useScroll({
    target: contentRef,
    offset: ["start end", "start start"],
  });

  /* The header floats over the film transparent, then the white plate fades in as the
     content covers it. The type stays BLACK throughout, which is what the home page
     does over its own hero video: this footage is high-key (white studio, blonde,
     bright walls) and white nav type reads as low-contrast mush across the top of it.
     Only the bottom-left block goes white, and only because the scrim puts it on
     black. */
  const headerBg = useTransform(
    coverP,
    [0.72, 0.96],
    ["rgba(255,255,255,0)", "rgba(255,255,255,1)"],
  );

  /* No fade on the product block. Pinning the film removed the reason for one: the
     block no longer travels up into the header, it sits still at the bottom of the
     pinned film until the white page slides over and covers it. */

  /* ------------------------------------------------------------- the stack */

  /* `spread` fans the pile open; `preview` is the frame currently under the cursor,
     which takes over the full screen behind everything. Two states rather than one
     because the pile opens on entering the stack, before any single card is chosen. */
  const [spread, setSpread] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const previewed = others.find((o) => o.slug === preview);

  const closeStack = () => {
    setSpread(false);
    setPreview(null);
  };

  /* ------------------------------------------- one card in the row plays film */

  /* A preview of what the collection row looks like when a frame has a film rather
     than a still. Gated on the row being reached: it sits several screens down, and
     an autoplaying video decodes whether or not anyone can see it. */
  const moreRef = useRef<HTMLElement>(null);
  const moreInView = useInView(moreRef, { once: true, amount: 0.25 });
  const showsFilm = (i: number) => !reduced && moreInView && i === FILM_CARD;

  /* --------------------------------------------------------------- the drift */

  /* 0 when the section's top reaches the bottom of the viewport, 1 when its bottom
     leaves the top — so 0.5 is "centred", which is where the type should sit at its
     true position. Everything below is a distance from that centre. */
  const { scrollYProgress: detailP } = useScroll({
    target: detailRef,
    offset: ["start end", "end start"],
  });

  /* Softens the reversal. Bound straight to scroll, a change of direction is an
     instant change of direction, which is what made the drift feel abrupt. The spring
     is stiff and well damped on purpose — enough to round the turn, not enough to
     trail behind the wheel the way the pile's comment warns about. */
  const smoothP = useSpring(detailP, {
    stiffness: 220,
    damping: 44,
    mass: 0.35,
  });

  /**
   * Scroll-bound drift, not a reveal.
   *
   * `(0.5 - p) * distance` puts the element `distance/2` px BELOW its layout position
   * as it enters and the same distance above as it leaves, passing through zero at
   * centre. Because it is bound to scroll position rather than triggered by it, the
   * movement runs backwards the instant the wheel does — scroll down and the type
   * rises, scroll up and it sinks. Different distances per block keep them from
   * moving as one slab.
   *
   * The distances are small: the whole point is that you feel it rather than watch
   * it. They started at 80/56/30 and read as the page coming apart.
   */
  const useDrift = (distance: number) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks -- fixed call order: every
    // invocation below is unconditional and in the same sequence on every render.
    useTransform(smoothP, (p) => (reduced ? 0 : (0.5 - p) * distance));

  const yDesc = useDrift(26);
  const yDetail = useDrift(17);
  const ySpecs = useDrift(8);
  /* The buy block does not drift. It is the one click target in the section, and a
     button that moves under the cursor is a worse thing than a static one. */

  return (
    <>
      <SiteHeader style={{ background: headerBg }} />

      <main className="pdp">
        {/* ---------------------------------------------------------- the film */}
        <section className="pdp-film" aria-labelledby="frame-heading">
          <video
            className="pdp-film__video"
            /* The still is the poster so the first paint is the photograph, not
               black, while the file loads. */
            poster={frame.img}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src={frame.video} type="video/mp4" />
          </video>

          {/* Every other frame's still, stacked over the film and held at zero
              opacity. Mounted rather than swapped into one <img>: changing `src` on
              hover flashes while the new file decodes, and these are the same six
              images the page already loads further down. */}
          {others.map((o) => (
            <motion.img
              key={o.slug}
              className="pdp-film__preview"
              src={o.img}
              alt=""
              aria-hidden="true"
              draggable={false}
              style={{ objectPosition: o.crop }}
              animate={{ opacity: preview === o.slug ? 1 : 0 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
              }
            />
          ))}

          {/* Black at low alpha, cornered on the block below. Not a new colour: the
              palette is still #000 and #fff. */}
          <div className="pdp-film__scrim" aria-hidden="true" />

          <div className="pdp-film__meta">
            <div className="pdp-film__row">
              {/* The home page's product card, reused class-for-class: the same
                  `.product-thumb` box, `.product-info` column and `.price`, with the
                  round `+` beside it. No description — the copy lives in the detail
                  section below, and the card carries the name and the price only. */}
              <div className="pdp-film__card">
                <div className="product-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={frame.thumb}
                    alt={`${frame.name} ${frame.ref} eyewear frame`}
                  />
                </div>

                <div className="product-info">
                  <h1 id="frame-heading">
                    {frame.name} {frame.ref}
                  </h1>
                  <span className="price">{frame.price}.00</span>
                </div>

                {/* No cart yet — deliberately inert rather than faked. Dropped from the
                  tab order once faded out, so keyboard focus cannot land on an
                  invisible button. */}
                <button
                  type="button"
                  className="pdp-add"
                  aria-label="Add to cart"
                >
                  <span aria-hidden="true">+</span>
                </button>
              </div>

              {/* The rest of the collection as a fanned pile — the home page's card
                  scatter, at card size. Entering it spreads the fan; hovering one
                  card takes the whole screen; clicking goes to that frame. */}
              <div className="pdp-stack-wrap">
                <p className="pdp-stack__label">
                  {previewed
                    ? `${previewed.name} ${previewed.ref}`
                    : "MORE FRAMES"}
                </p>

                <ul
                  className={spread ? "pdp-stack is-spread" : "pdp-stack"}
                  onMouseEnter={() => setSpread(true)}
                  onMouseLeave={closeStack}
                >
                  {others.map((o, i) => (
                    <motion.li
                      key={o.slug}
                      className="pdp-stack__item"
                      /* Percentages of the card's OWN width, so the fan holds its
                         proportions at any root size — the pile's technique. */
                      animate={{
                        x: spread ? `${i * 112.5}%` : `${i * 18.75}%`,
                        rotate: spread ? 0 : STACK_TILT[i % STACK_TILT.length],
                      }}
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
                      }
                      style={{ zIndex: i }}
                    >
                      <Link
                        href={frameHref(o.slug)}
                        onMouseEnter={() => setPreview(o.slug)}
                        onFocus={() => {
                          setSpread(true);
                          setPreview(o.slug);
                        }}
                        onBlur={closeStack}
                      >
                        <span className="sr-only">
                          {o.name} {o.ref}
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={o.img}
                          alt=""
                          style={{ objectPosition: o.crop }}
                          draggable={false}
                        />
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* The white page. Opaque background + higher z-index, so it slides up OVER
            the pinned film and covers it — exactly how `.content` covers the fixed
            hero on the home page. */}
        <div className="pdp-content" ref={contentRef}>
          {/* ------------------------------------ the detail, right under the film */}
          <section
            className="pdp-detail"
            ref={detailRef}
            aria-labelledby="detail-heading"
          >
            <h2 id="detail-heading" className="sr-only">
              Details and specification
            </h2>

            {/* Copy left, specification right — the footer's arrangement (lead block
              beside its columns), which is where this two-column rhythm comes from.
              No photograph: the film above is the only image the page needs. */}
            <div className="pdp-copy">
              <motion.p className="desc pdp-copy__para" style={{ y: yDesc }}>
                {frame.description}
              </motion.p>
              <motion.p className="desc pdp-copy__para" style={{ y: yDetail }}>
                {frame.detail}
              </motion.p>
            </div>

            <div className="pdp-side">
              <motion.dl className="pdp-specs" style={{ y: ySpecs }}>
                {frame.specs.map((s) => (
                  <div className="pdp-spec" key={s.label}>
                    <dt>{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
                <div className="pdp-spec">
                  <dt>REF</dt>
                  <dd>{frame.ref}</dd>
                </div>
              </motion.dl>

              <div className="pdp-buy">
                <span className="price">{frame.price}.00</span>
                <button type="button" className="pdp-btn pdp-btn--dark">
                  ADD TO CART
                </button>
                <p className="pdp-buy__note">
                  MADE TO ORDER · SIX TO EIGHT WEEKS · SHIPPED INSURED
                </p>
              </div>
            </div>
          </section>

          {/* ----------------------------------------------------------- onwards */}
          <section
            className="pdp-more"
            ref={moreRef}
            aria-labelledby="more-heading"
          >
            <div className="section-head">
              <h2 id="more-heading" className="section-label">
                THE REST OF THE COLLECTION
              </h2>
              <span className="section-count">{others.length} FRAMES</span>
            </div>

            <ul className="pdp-more__list">
              {others.map((o, i) => (
                <motion.li
                  key={o.slug}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.4 }}
                  variants={reveal}
                  custom={i * 0.5}
                >
                  <Link className="pdp-more__item" href={frameHref(o.slug)}>
                    <span className="pdp-more__img">
                      {showsFilm(i) ? (
                        /* Same box, same crop — the still is the poster, so the swap
                         from image to film is seamless. */
                        <video
                          poster={o.img}
                          style={{ objectPosition: o.crop }}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                        >
                          <source src={o.video} type="video/mp4" />
                        </video>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={o.img}
                          alt=""
                          style={{ objectPosition: o.crop }}
                          draggable={false}
                        />
                      )}
                    </span>
                    <span className="pdp-more__row">
                      <span className="pdp-more__name">{o.name}</span>
                      <span className="pdp-more__price">{o.price}</span>
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
