import { useEffect, useMemo, useState } from "react";
import UserManagement from "./user-management/UserManagement";
import CollegeManagement from "./college-management/CollegeManagement";
import SubjectManagement from "./subject-management/SubjectManagement";

type View = "user" | "college" | "subject";

export default function ManagementSwitcher() {
  const [activeView, setActiveView] = useState<View>("user");
  const [collegeFilterId, setCollegeFilterId] = useState<number | undefined>(
    undefined
  );

  // Support hash-based deep-linking, e.g. #/technical-admin?view=subject&college=3
  useEffect(() => {
    function syncFromHash() {
      const hash = window.location.hash || "";
      const qIndex = hash.indexOf("?");
      if (qIndex === -1) return;
      const params = new URLSearchParams(hash.substring(qIndex + 1));
      const view = params.get("view") as View | null;
      const college = params.get("college");
      if (view === "user" || view === "college" || view === "subject") {
        setActiveView(view);
      }
      if (college != null) {
        const id = parseInt(college, 10);
        setCollegeFilterId(Number.isFinite(id) ? id : undefined);
      } else {
        setCollegeFilterId(undefined);
      }
    }
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const navOptions = [
    { label: "User Management", value: "user" as View },
    { label: "College Management", value: "college" as View },
    { label: "Subject Management", value: "subject" as View },
  ];

  const headLeft = (
    <select
      className="text-3xl font-bold p-4 border border-meritGray rounded-lg shadow-md"
      value={activeView}
      onChange={(e) => {
        const next = e.target.value as View;
        setActiveView(next);
        // Reset college filter when switching views unless URL specifies it
        setCollegeFilterId(undefined);
      }}
      aria-label="Management View Selector"
    >
      {navOptions.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  return (
    <div className="flex-1 flex w-full flex-col">
      {activeView === "user" && <UserManagement embedded headLeft={headLeft} />}
      {activeView === "college" && (
        <CollegeManagement embedded headLeft={headLeft} />
      )}
      {activeView === "subject" && (
        <SubjectManagement
          embedded
          headLeft={headLeft}
          collegeFilterId={collegeFilterId}
        />
      )}
    </div>
  );
}
