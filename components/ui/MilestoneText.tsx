import type { Milestone } from "@/types/timeline";

interface Props {
  milestone: Milestone;
  /** Heading level; the overlay uses h2, the static page nests under its own section heading. */
  as?: "h2" | "h3";
}

/** Editorial text block for one historical milestone, shared by the scroll scene and the simple view. */
export function MilestoneText({ milestone: m, as: Heading = "h2" }: Props) {
  return (
    <>
      <p className="ms__date" data-part>
        {m.date}
      </p>
      {m.dateNote && (
        <p className="ms__datenote" data-part>
          {m.dateNote}
        </p>
      )}
      <Heading className="ms__title" data-part>
        {m.title}
      </Heading>
      <p className="ms__credit" data-part>
        {m.credit}
      </p>
      <p className="ms__lead" data-part>
        {m.lead}
      </p>
      <div className="ms__body" data-part>
        {m.body.map((p, i) => (
          <p key={i} className={i > 0 ? "ms__more" : undefined}>
            {p}
          </p>
        ))}
      </div>
      {m.facts.length > 0 && (
        <dl className="ms__facts" data-part>
          {m.facts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </>
  );
}
