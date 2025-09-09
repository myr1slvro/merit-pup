import React, { ReactNode } from "react";
import Pagination from "../../shared/Pagination";

interface SubjectManagementProps {
  embedded?: boolean;
  headLeft?: ReactNode;
}

export default function SubjectManagement({ embedded = false, headLeft }: SubjectManagementProps) {
  // Template / placeholder for the Subject Management view.
  // We'll add list, create, edit functionality later.

  return (
    <div className="flex-1 flex w-full">
      <div className="flex flex-col w-full bg-white m-16 rounded-lg shadow-lg h-full">
        <div className="flex items-center justify-between p-8">
          <div className="flex items-center gap-4">
            {headLeft ? headLeft : !embedded && <h1 className="text-3xl font-bold">Subject Management</h1>}
          </div>
          <div>
            {/* Action slot: for now show placeholder create button */}
            <button className="px-4 py-2 bg-meritRed text-white rounded hover:bg-meritDarkRed font-semibold shadow">+ Create Subject</button>
          </div>
        </div>
        <hr className="h-1 rounded-full border-meritGray/50" />
        <div className="flex-grow p-4">
          <p className="text-gray-600">Subject management coming soon. This is a placeholder template.</p>
          <div className="mt-6">
            <Pagination page={1} hasPrev={false} hasNext={false} onPrev={() => {}} onNext={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
}
