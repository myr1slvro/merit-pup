import React from "react";
import type { UniversityIM } from "../../types/universityim";
import type { ServiceIM } from "../../types/serviceim";

type Props = {
  universityIMs: UniversityIM[];
  serviceIMs: ServiceIM[];
};

export default function IMColumns({ universityIMs, serviceIMs }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="font-bold mb-2">University IMs</h4>
        {universityIMs.length === 0 ? (
          <div className="text-gray-400">No University IMs.</div>
        ) : (
          <ul className="space-y-2">
            {universityIMs.map((im) => (
              <li key={im.id} className="p-2 bg-gray-50 rounded border text-sm">
                {im.subject?.name || `Subject #${(im as any).subject_id}`} (Year{" "}
                {im.year_level})
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h4 className="font-bold mb-2">Service IMs</h4>
        {serviceIMs.length === 0 ? (
          <div className="text-gray-400">No Service IMs.</div>
        ) : (
          <ul className="space-y-2">
            {serviceIMs.map((im) => (
              <li key={im.id} className="p-2 bg-gray-50 rounded border text-sm">
                {im.subject?.name || `Subject #${(im as any).subject_id}`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
