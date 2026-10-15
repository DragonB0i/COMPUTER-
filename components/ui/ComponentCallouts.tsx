import { CASE_PARTS } from "@/data/hardwareComponents";
import { ComponentCallout } from "./ComponentCallout";

/** Labels for the exploded computer. Only one is on screen at a time. */
export function ComponentCallouts() {
  return (
    <div className="callouts" data-callouts>
      {CASE_PARTS.map((p, i) => (
        <ComponentCallout key={p.id} part={p} index={i} total={CASE_PARTS.length} />
      ))}
    </div>
  );
}
