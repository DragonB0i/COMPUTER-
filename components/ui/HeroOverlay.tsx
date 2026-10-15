/** The opening title that sits above the chip. */
export function HeroOverlay() {
  return (
    <div className="hero" data-hero>
      <h1 className="hero__title" data-hero-title>
        COMPUTER
      </h1>
      <div className="hero__cue" data-hero-cue aria-hidden="true">
        <span />
      </div>
    </div>
  );
}
