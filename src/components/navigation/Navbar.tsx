import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

import { UserRole } from "../../types/user";

const ROLE_TABS: Record<UserRole, { label: string; to: string }[]> = {
  Faculty: [{ label: "Faculty Directory", to: "/faculty" }],
  Evaluator: [
    { label: "Faculty Directory", to: "/faculty" },
    { label: "Evaluation", to: "/evaluator" },
  ],
  "UTLDO Admin": [
    { label: "Faculty Directory", to: "/faculty" },
    { label: "Evaluation", to: "/evaluator" },
    { label: "User Analytics", to: "/utldo-admin" },
  ],
  "Technical Admin": [
    { label: "Faculty Directory", to: "/faculty" },
    { label: "Evaluation", to: "/evaluator" },
    { label: "User Analytics", to: "/utldo-admin" },
    { label: "User Management", to: "/technical-admin" },
  ],
};

export default function Navbar() {
  const { user, authToken, handleLogout } = useAuth();
  const location = useLocation();
  let tabs: { label: string; to: string }[] = [];
  if (user && user.role && ROLE_TABS[user.role as UserRole]) {
    tabs = ROLE_TABS[user.role as UserRole];
  }

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

      {authToken && tabs.length > 0 ? (
        <div className="flex items-center gap-6 space-x-2">
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              className={`text-lg font-medium transition px-2 ${
                location.pathname === tab.to
                  ? "text-meritYellow"
                  : "text-white hover:text-meritGray"
              }`}
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
      ) : authToken ? (
        <div className="flex items-center gap-6 space-x-2">
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
