import Link from "next/link";

// ---------------------------------------------------------------------------
// PLACEHOLDER COPY: replace with your own story whenever you're ready.
// Only edit the text in this object; the layout below adapts automatically.
// ---------------------------------------------------------------------------
const STORY = {
  eyebrow: "Our Story",
  heading: ["Dressed in softness,", "made for confidence"],
  intro:
    "Girl's Hood began with a simple feeling: the joy of finding a piece that feels like you. Inspired by the quiet elegance of Seoul street style, we set out to bring that soft, effortless look to women everywhere.",
  paragraphs: [
    "Every piece in our collection is chosen by hand. We look for gentle colours, flattering shapes and fabrics that feel good against the skin, clothes you'll reach for again and again, not just once.",
    "We believe style shouldn't be loud to be noticed. A delicate knit, a perfectly pleated skirt, the right shade of blush: small details that make you feel put together, whether you're heading to class, to work or out with friends.",
  ],
  quote: "Soft is not the opposite of strong. It's how we choose to show up.",
  quoteBy: "The Girl's Hood team",
  values: [
    {
      title: "Hand-picked",
      text: "Every piece is personally selected for quality, fit and that special something.",
    },
    {
      title: "Soft by nature",
      text: "Gentle fabrics and calm, pretty colours that are easy to love and easy to wear.",
    },
    {
      title: "Made to mix",
      text: "Pieces designed to style together, so a few favourites become many outfits.",
    },
  ],
  cta: { label: "Shop the collection", href: "/shop" },
};

export default function OurStory() {
  return (
    <section id="our-story" aria-labelledby="our-story-heading" className="scroll-mt-20">
      {/* Story */}
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:py-28">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">{STORY.eyebrow}</p>
          <span className="mt-4 block h-px w-12 bg-accent/60" />
          <h2
            id="our-story-heading"
            className="mt-8 font-serif text-4xl leading-[1.12] text-ink sm:text-5xl"
          >
            {STORY.heading[0]}
            <br />
            <em className="text-accent">{STORY.heading[1]}</em>
          </h2>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-muted">{STORY.intro}</p>
        </div>

        <div className="flex flex-col justify-end gap-6 text-muted lg:pt-24">
          {STORY.paragraphs.map((p) => (
            <p key={p.slice(0, 24)} className="leading-relaxed">
              {p}
            </p>
          ))}

          <figure className="mt-6 border-l-2 border-rose pl-6">
            <blockquote className="font-serif text-2xl italic leading-snug text-ink">
              &ldquo;{STORY.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-3 text-xs uppercase tracking-[0.25em] text-muted">
              {STORY.quoteBy}
            </figcaption>
          </figure>
        </div>
      </div>

      {/* Values */}
      <div className="bg-blush">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <ul className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STORY.values.map((v, i) => (
              <li key={v.title}>
                <span className="font-serif text-sm text-accent">0{i + 1}</span>
                <h3 className="mt-3 font-serif text-2xl text-ink">{v.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{v.text}</p>
              </li>
            ))}
          </ul>

          <div className="mt-14 flex justify-center">
            <Link
              href={STORY.cta.href}
              className="group inline-flex items-center gap-3 bg-ink px-8 py-4 text-sm uppercase tracking-wider text-white transition-colors hover:bg-black"
            >
              {STORY.cta.label}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="transition-transform group-hover:translate-x-1"
                aria-hidden
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
