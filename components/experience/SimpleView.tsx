import { BOARD_COMPONENTS, CASE_PARTS } from "@/data/hardwareComponents";
import { MILESTONES } from "@/data/milestones";
import { MilestoneText } from "@/components/ui/MilestoneText";
import { SoftwareSimple } from "@/components/ui/SoftwareSimple";

interface Props {
  /** Present when the immersive view can run; renders the switch button. */
  onImmersive?: () => void;
  /** Explains why the simple view is showing, when it was not chosen. */
  notice?: string;
}

/** Static line drawing of the opening chip, so the simple view keeps the same visual identity. */
function ChipDrawing() {
  const pins = Array.from({ length: 9 }, (_, i) => 24 + i * 19);
  return (
    <svg className="simple__chip" viewBox="0 0 200 200" role="img" aria-label="Line drawing of a processor package seen from above">
      <g fill="none" stroke="#fff" strokeWidth="1">
        <rect x="14" y="14" width="172" height="172" opacity="0.9" />
        <rect x="42" y="42" width="116" height="116" opacity="0.8" />
        <rect x="70" y="70" width="60" height="60" />
        <path d="M70 100h60M100 70v60" opacity="0.45" />
        <path d="M14 30l16-16" opacity="0.6" />
        {pins.map((p) => (
          <g key={p} opacity="0.55">
            <path d={`M${p} 14v-10M${p} 186v10M14 ${p}h-10M186 ${p}h10`} />
          </g>
        ))}
      </g>
    </svg>
  );
}

/**
 * The whole journey as an ordinary document: no WebGL, no scroll-linked animation. Shown when the
 * visitor asks for reduced motion, when WebGL is unavailable, or when they pick it themselves.
 */
export function SimpleView({ onImmersive, notice }: Props) {
  return (
    <div className="simple">
      <a className="skip-link" href="#simple-main">
        Skip to content
      </a>
      <header className="simple__bar">
        <nav aria-label="Sections">
          <ul>
            <li>
              <a href="#history">History</a>
            </li>
            <li>
              <a href="#anatomy">Anatomy</a>
            </li>
            <li>
              <a href="#motherboard">Motherboard</a>
            </li>
            <li>
              <a href="#software">Software</a>
            </li>
          </ul>
        </nav>
        {onImmersive && (
          <button type="button" className="btn" onClick={onImmersive}>
            Immersive view
          </button>
        )}
      </header>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}

      <main id="simple-main">
        <section className="simple__hero" aria-labelledby="simple-title">
          <ChipDrawing />
          <h1 id="simple-title" className="simple__title">
            COMPUTER
          </h1>
          <p className="simple__intro">
            A journey into computing: the history of the machine, what is inside a desktop PC, how its motherboard
            ties the parts together, and how software, from a game&apos;s files to its threads, comes to life on it.
          </p>
        </section>

        <section id="history" className="simple__section" aria-labelledby="history-title">
          <div className="simple__inner">
            <p className="eyebrow">Chapter one</p>
            <h2 id="history-title" className="simple__h">
              A short history of computing
            </h2>
            <p className="simple__lead">
              Six ideas and machines, from a mechanical design in 1837 to the architecture most computers still follow.
            </p>
            <ol className="simple__list">
              {MILESTONES.map((m) => (
                <li key={m.id} className="simple__item">
                  <MilestoneText milestone={m} as="h3" />
                  <p className="sr-only">{m.diagram}</p>
                  {m.callouts && (
                    <ul className="simple__parts">
                      {m.callouts.map((c) => (
                        <li key={c.title}>
                          <h4>{c.title}</h4>
                          <p>{c.text}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="anatomy" className="simple__section" aria-labelledby="anatomy-title">
          <div className="simple__inner">
            <p className="eyebrow">Chapter two</p>
            <h2 id="anatomy-title" className="simple__h">
              Inside a desktop computer
            </h2>
            <p className="simple__lead">
              Take the panels off a tower and you find a handful of major parts, each with one main job.
            </p>
            <ul className="simple__parts">
              {CASE_PARTS.map((p) => (
                <li key={p.id}>
                  <h3>{p.name}</h3>
                  <p className="part__lead">{p.summary}</p>
                  <span className="part__label">What it does</span>
                  <p>{p.role}</p>
                  <span className="part__label">How it connects</span>
                  <p>{p.relation}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="motherboard" className="simple__section" aria-labelledby="board-title">
          <div className="simple__inner">
            <p className="eyebrow">Chapter three</p>
            <h2 id="board-title" className="simple__h">
              The motherboard
            </h2>
            <p className="simple__lead">
              A conceptual ATX board. Real boards differ in which slots and chips they carry, but these are the parts to
              look for.
            </p>
            <ul className="simple__parts">
              {BOARD_COMPONENTS.map((c) => (
                <li key={c.id}>
                  <h3>{c.name}</h3>
                  <p className="part__lead">{c.summary}</p>
                  <span className="part__label">What it does</span>
                  <p>{c.role}</p>
                  <span className="part__label">How it connects</span>
                  <p>{c.relation}</p>
                  {c.note && <p className="part__note">{c.note}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <SoftwareSimple id="software" />
      </main>
    </div>
  );
}
