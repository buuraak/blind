/**
 * The collection — one source of truth.
 *
 * Before this file the same six frames were declared three times: `FRAMES` in
 * collection-index.tsx, `CARDS` in pile.tsx, and the hero's product card inline in
 * blind-by-glamour.tsx. Each list knew a different subset of the truth and none of
 * them knew a URL, so nothing could link anywhere. Everything now reads from here;
 * the pile keeps only its choreography (the from/to positions) and looks the image
 * up by slug.
 *
 * Plain module data, not a fetch: the collection is six items that ship with the
 * build. `generateStaticParams` prerenders a page per slug from this array.
 */

/** The house reel, standing in for per-product film. It is the same asset the home
 *  page scrubs — an all-intra encode, so it is heavier than a plain loop would need
 *  to be (8.8MB). Worth replacing with a short, tightly compressed per-frame loop
 *  when the films exist; see the `video` field. */
const HOUSE_FILM = "/hero-scrub-1080.mp4";

/** PLACEHOLDER — the same file the home page's card uses, and NOT licensed: it came
 *  from Google's thumbnail cache and was self-hosted only to remove the runtime
 *  dependency on a third-party host. Replace with real product shots before launch.
 *
 *  A cutout on white is the one kind of photograph the collection does not have — the
 *  six stills are editorial 16:9 frames of a model, which cannot sit in a square
 *  `object-fit: contain` box. Replace per frame as the packshots land; see `thumb`. */
const PLACEHOLDER_THUMB = "/product/fleuris-1005.jpg";

export type Spec = {
  label: string;
  value: string;
};

export type Frame = {
  /** URL segment. `/frames/[slug]` */
  slug: string;
  name: string;
  /** The house's model number. Rendered as micro-type beside the name. */
  ref: string;
  price: string;
  /** 16:9 editorial still. There is no cutout photography for the collection —
   *  the PDP is art-directed around full-bleed stills, not a packshot gallery.
   *  Also the film's poster frame. */
  img: string;
  /** The product page opens on this, full screen. PLACEHOLDER: every frame points
   *  at the house reel because no per-product film has been shot — so all six pages
   *  currently open on the same footage. Replace per frame as the films land. */
  video: string;
  /** Cutout on white, for the product card that sits over the film — the same box the
   *  home page's card uses. PLACEHOLDER on every frame; see `PLACEHOLDER_THUMB`. */
  thumb: string;
  /** Alt text for the still. Empty on decorative uses (the pile, the hover peek). */
  alt: string;
  /** Uppercase micro-copy, set in `.desc`. Two sentences at most. */
  description: string;
  /** Second paragraph, PDP only — the detail the index row has no room for. */
  detail: string;
  specs: Spec[];
  /** Where the tight crop sits on the still, as `object-position`. The detail
   *  section reframes the same photograph rather than inventing a second one. */
  crop: string;
};

export const FRAMES: Frame[] = [
  {
    slug: "fleuris-1005",
    name: "Fleuris",
    ref: "1005",
    price: "$4,650",
    img: "/frames/frame-01.jpg",
    video: HOUSE_FILM,
    thumb: PLACEHOLDER_THUMB,
    alt: "Fleuris 1005 worn straight to camera, floral inlay at the temples",
    description:
      "A HAND-CUT ACETATE FRAME AND FLORAL INLAY LENS THAT PROTECTS AND HELPS FOCUS EACH EYE WHILE YOU BLINK.",
    detail:
      "THE INLAY IS SET BY HAND, ONE BLOOM AT A TIME, SO NO TWO PAIRS CARRY THE SAME ARRANGEMENT. THE RIM IS LEFT DELIBERATELY THIN — THE FRAME IS MEANT TO BE READ AS PUNCTUATION, NOT AS ARCHITECTURE.",
    specs: [
      { label: "MATERIAL", value: "HAND-CUT ACETATE" },
      { label: "LENS", value: "FLORAL INLAY, CLEAR" },
      { label: "FINISH", value: "POLISHED SILVER" },
      { label: "ORIGIN", value: "ATELIER, PARIS" },
    ],
    crop: "50% 42%",
  },
  {
    slug: "orchidee-2200",
    name: "Orchidée",
    ref: "2200",
    price: "$5,200",
    img: "/frames/frame-02.jpg",
    video: HOUSE_FILM,
    thumb: PLACEHOLDER_THUMB,
    alt: "Orchidée 2200 seen in three-quarter profile",
    description:
      "A RIMLESS CONSTRUCTION WEIGHTED AT THE BRIDGE, SO THE FRAME SITS WITHOUT PRESSING AND READS AS A LINE RATHER THAN A SHAPE.",
    detail:
      "EVERY JOINT IS SOLDERED RATHER THAN SCREWED, WHICH REMOVES THE ONLY PART OF A FRAME THAT USUALLY LOOSENS. THE TEMPLES ARE DRAWN FROM A SINGLE LENGTH OF WIRE AND FINISHED BY HAND AT THE TIP.",
    specs: [
      { label: "MATERIAL", value: "DRAWN TITANIUM" },
      { label: "LENS", value: "RIMLESS, CLEAR" },
      { label: "FINISH", value: "BRUSHED" },
      { label: "ORIGIN", value: "ATELIER, PARIS" },
    ],
    crop: "50% 38%",
  },
  {
    slug: "vitrine-0450",
    name: "Vitrine",
    ref: "0450",
    price: "$3,980",
    img: "/frames/frame-03.jpg",
    video: HOUSE_FILM,
    thumb: PLACEHOLDER_THUMB,
    alt: "Vitrine 0450 worn low on the bridge",
    description:
      "THE THINNEST FRAME THE HOUSE MAKES. A HALF-RIM THAT HOLDS THE LENS FROM ABOVE AND LEAVES THE LOWER FIELD ENTIRELY OPEN.",
    detail:
      "AT 0.8MM THE UPPER RIM IS AT THE LIMIT OF WHAT ACETATE WILL HOLD, WHICH IS WHY THE PIECE IS CUT FROM BLOCK RATHER THAN SHEET. WORN LOW, IT DISAPPEARS ENTIRELY FROM THE WEARER'S OWN VIEW.",
    specs: [
      { label: "MATERIAL", value: "BLOCK-CUT ACETATE" },
      { label: "LENS", value: "HALF-RIM, CLEAR" },
      { label: "FINISH", value: "MATTE" },
      { label: "ORIGIN", value: "ATELIER, PARIS" },
    ],
    crop: "50% 45%",
  },
  {
    slug: "camelia-1180",
    name: "Camélia",
    ref: "1180",
    price: "$6,400",
    img: "/frames/frame-04.jpg",
    video: HOUSE_FILM,
    thumb: PLACEHOLDER_THUMB,
    alt: "Camélia 1180 held at the temple, floral inlay in view",
    description:
      "TWENTY-ONE GRAMS, DISTRIBUTED SO THE FRAME RESTS ON THE BRIDGE AND NOT ON THE EAR. THE INLAY IS SET INTO THE ACETATE, NOT APPLIED TO IT.",
    detail:
      "THE BLOOMS ARE PRESSED INTO A CHANNEL MILLED ALONG THE UPPER RIM AND THEN POLISHED FLUSH, SO THE SURFACE IS CONTINUOUS UNDER A FINGER. IT TAKES THREE DAYS PER PAIR AND CANNOT BE HURRIED.",
    specs: [
      { label: "MATERIAL", value: "MILLED ACETATE" },
      { label: "LENS", value: "FLORAL INLAY, CLEAR" },
      { label: "FINISH", value: "HIGH POLISH" },
      { label: "ORIGIN", value: "ATELIER, PARIS" },
    ],
    crop: "50% 40%",
  },
  {
    slug: "persienne-3310",
    name: "Persienne",
    ref: "3310",
    price: "$4,120",
    img: "/frames/frame-05.jpg",
    video: HOUSE_FILM,
    thumb: PLACEHOLDER_THUMB,
    alt: "Persienne 3310 worn straight to camera",
    description:
      "A LOUVRED UPPER RIM THAT CUTS OVERHEAD GLARE WITHOUT TINTING THE LENS, SO THE COLOUR OF A ROOM ARRIVES UNCHANGED.",
    detail:
      "THE SLATS ARE CUT AT ELEVEN DEGREES — SHALLOW ENOUGH TO STAY INVISIBLE FROM THE FRONT, STEEP ENOUGH TO SHADE THE EYE. THE IDEA IS BORROWED WHOLESALE FROM A SHUTTER, AND THE NAME ADMITS IT.",
    specs: [
      { label: "MATERIAL", value: "HAND-CUT ACETATE" },
      { label: "LENS", value: "LOUVRED, CLEAR" },
      { label: "FINISH", value: "SATIN" },
      { label: "ORIGIN", value: "ATELIER, PARIS" },
    ],
    crop: "50% 44%",
  },
  {
    slug: "aveugle-0001",
    name: "Aveugle",
    ref: "0001",
    price: "$7,850",
    img: "/frames/frame-06.jpg",
    video: HOUSE_FILM,
    thumb: PLACEHOLDER_THUMB,
    alt: "Aveugle 0001, the house's first frame, worn to camera",
    description:
      "THE FIRST FRAME THE HOUSE CUT, REISSUED ONCE. EACH PAIR IS NUMBERED AND NONE IS REPEATED.",
    detail:
      "THE ORIGINAL PATTERN WAS DRAWN IN 1998 AND HAS NOT BEEN REDRAWN SINCE. WHAT CHANGES BETWEEN PAIRS IS THE BLOCK — NO TWO SHEETS OF ACETATE CARRY THE SAME GRAIN, AND THE CUT FOLLOWS WHATEVER IT FINDS.",
    specs: [
      { label: "MATERIAL", value: "ARCHIVE ACETATE" },
      { label: "LENS", value: "FULL RIM, CLEAR" },
      { label: "FINISH", value: "HAND-BUFFED" },
      { label: "ORIGIN", value: "ATELIER, PARIS" },
    ],
    crop: "50% 41%",
  },
];

/** Index by slug, built once at module scope. */
const BY_SLUG = new Map(FRAMES.map((f) => [f.slug, f]));

export function getFrame(slug: string): Frame | undefined {
  return BY_SLUG.get(slug);
}

/** Everything except `slug`, in collection order — the PDP's onward links. */
export function otherFrames(slug: string): Frame[] {
  return FRAMES.filter((f) => f.slug !== slug);
}

export const frameHref = (slug: string) => `/frames/${slug}`;
