import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const NAV_TABS: Record<string, { label: string; to: string }[]> = {
  Faculty: [{ label: "", to: "/" }],
  Evaluator: [{ label: "", to: "/" }],
  "UTLDO Admin": [
    { label: "Analytics", to: "/analytics" },
    { label: "Directory", to: "/directory" },
  ],
  "Technical Admin": [
    { label: "Analytics", to: "/analytics" },
    { label: "User Management", to: "/user-management" },
  ],
};

export default function Navbar() {
  const { role, authToken, handleLogout } = useAuth();
  const tabs = role ? NAV_TABS[role] || [] : [];

  return (
    <nav
      className={`shadow px-8 py-4 flex items-center justify-between ${
        authToken
          ? "bg-gradient-to-r from-meritRed to-meritDarkRed"
          : "bg-gradient-to-r from-meritRed to-meritDarkRed"
      }`}
    >
      <div className="flex items-center gap-3 font-[TimesNewRoman]">
        <span className="h-15 w-15 inline-block bg-center bg-contain bg-no-repeat bg-[url(/pup-logo.svg)]"></span>
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-meritYellow leading-none">
            Polytechnic University of the Philippines
          </span>
          <span className="text-lg font-semibold text-white leading-none">
            The Country's 1st PolytechnicU
          </span>
        </div>
      </div>

      {authToken ? (
        <div className="flex items-center gap-6 space-x-2">
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              className="text-lg font-medium text-white hover:text-meritGray transition px-2"
            >
              {tab.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="ml-2 px-4 py-2 rounded bg-meritRed text-white hover:bg-meritDarkRed transition text-sm font-semibold"
          >
            Logout
          </button>
        </div>
      ) : null}
    </nav>
  );
}
