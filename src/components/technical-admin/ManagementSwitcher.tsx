import { useState } from "react";
import UserManagement from "./user-management/UserManagement";
import CollegeManagement from "./college-management/CollegeManagement";

type View = "user" | "college";

export default function ManagementSwitcher() {
  const [activeView, setActiveView] = useState<View>("user");

  const navOptions = [
    { label: "User Management", value: "user" as View },
    { label: "College Management", value: "college" as View },
  ];

  return (
    <div className="flex-1 flex w-full flex-col">
      {/* Render selected view and inject heading dropdown into each page header */}
      {activeView === "user" ? (
        <UserManagement
          embedded
          headLeft={
            <select
              className="text-3xl font-bold p-4 border border-meritGray rounded-lg shadow-md"
              value={activeView}
              onChange={(e) => setActiveView(e.target.value as View)}
              aria-label="Management View Selector"
            >
              {navOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          }
        />
      ) : (
        <CollegeManagement
          embedded
          headLeft={
            <select
              className="text-3xl font-bold p-4 border border-meritGray rounded-lg shadow-md"
              value={activeView}
              onChange={(e) => setActiveView(e.target.value as View)}
              aria-label="Management View Selector"
            >
              {navOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          }
        />
      )}
    </div>
  );
}
