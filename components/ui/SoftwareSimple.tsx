import { SOFTWARE_CLOSING, SOFTWARE_CONCEPTS, SOFTWARE_GROUPS, SOFTWARE_NEXT } from "@/data/softwareChapter";

/** The software chapter as an ordinary document, in the warm light style the animated version moves into. */
export function SoftwareSimple({ id }: { id: string }) {
  return (
    <section id={id} className="simple-sw" aria-labelledby="simple-sw-title">
      <div className="simple__inner">
        <p className="simple-sw__eyebrow">Chapter four</p>
        <h2 id="simple-sw-title" className="simple-sw__h">
          How software runs
        </h2>
        <p className="simple-sw__lead">
          Switch the computer on and follow one game from a file on a drive to a running process. The pictures in the
          animated version are metaphors; the descriptions below say what each one stands for.
        </p>

        {SOFTWARE_GROUPS.map((g) => (
          <div key={g.id} className="simple-sw__group">
            <h3 className="simple-sw__group-title">{g.title}</h3>
            <p className="simple-sw__group-lead">{g.lead}</p>
            <ul className="simple-sw__list">
              {SOFTWARE_CONCEPTS.filter((c) => c.group === g.id).map((c) => (
                <li key={c.id}>
                  <p className="simple-sw__kicker">{c.kicker}</p>
                  <h4>{c.title}</h4>
                  <p>{c.text}</p>
                  {c.note && <p className="simple-sw__note">{c.note}</p>}
                  <p className="simple-sw__picture">
                    <span>In the picture:</span> {c.picture}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="simple-sw__end">
          <p className="simple-sw__closing">{SOFTWARE_CLOSING}</p>
          <h3>Still to come</h3>
          <ul>
            {SOFTWARE_NEXT.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
