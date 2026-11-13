import Image from "next/image";
import Header from "./components/Header";

const stats = [
  { value: "100+", label: "Happy Customers" },
  { value: "50+", label: "Curated Pieces" },
  { value: "100%", label: "Authentic Style" },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto grid max-w-7xl grid-cols-1 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-[1fr_1.05fr]">
          {/* Copy */}
          <div className="relative flex flex-col justify-center px-5 py-14 sm:px-8 lg:py-20 lg:pr-12">
            <div className="animate-fade-up">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
                New Collection 2026
              </p>
              <span className="mt-4 block h-px w-12 bg-gold/60" />

              <h1 className="mt-8 font-serif text-5xl leading-[1.08] text-ink sm:text-6xl xl:text-7xl">
                Where Soft
                <br />
                <em className="text-rose">Meets</em>
                <br />
                Sophisticated
              </h1>

              <p className="mt-7 max-w-md text-lg leading-relaxed text-muted">
                Curated Korean-style fashion for the modern woman. Minimal,
                elegant, and effortlessly chic.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-6">
                <a
                  href="#shop"
                  className="group inline-flex items-center gap-3 bg-ink px-8 py-4 text-sm uppercase tracking-wider text-white transition-colors hover:bg-black"
                >
                  Explore Collection
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
                </a>
                <a
                  href="#our-story"
                  className="border-b border-muted/50 pb-0.5 text-muted transition-colors hover:border-ink hover:text-ink"
                >
                  Our Story
                </a>
              </div>

              <dl className="mt-14 flex flex-wrap gap-y-6">
                {stats.map((s, i) => (
                  <div
                    key={s.label}
                    className={`pr-5 sm:pr-8 ${i > 0 ? "border-l border-line pl-5 sm:pl-8" : ""}`}
                  >
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="font-serif text-2xl text-ink">{s.value}</dd>
                    <dd className="mt-1 text-sm text-muted">{s.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Scroll indicator */}
            <a
              href="#new-arrivals"
              className="absolute bottom-6 right-0 hidden flex-col items-center gap-3 lg:flex"
              aria-label="Scroll to new arrivals"
            >
              <span className="text-[10px] uppercase tracking-[0.35em] text-muted">
                Scroll
              </span>
              <span className="relative h-10 w-px overflow-hidden bg-line">
                <span className="animate-scroll-line absolute inset-0 bg-ink" />
              </span>
            </a>
          </div>

          {/* Image */}
          <div className="relative min-h-[520px] overflow-hidden bg-blush sm:min-h-[640px] lg:min-h-0">
            <Image
              src="/assets/pinklady.jpeg"
              alt="Model wearing a white off-shoulder knit top, pink belted pleated skirt and white knee-high boots"
              fill
              preload
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="object-cover object-top"
            />
           
            <div className="pointer-events-none absolute inset-4 border border-white/40 sm:inset-6" />

            {/* Floating tag */}
            <div className="absolute bottom-8 left-8 bg-cream/95 px-5 py-4 shadow-sm backdrop-blur sm:bottom-10 sm:left-10">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                Featured Look
              </p>
              <p className="mt-1 font-serif text-lg text-ink">
                Blush Pleated Set
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
