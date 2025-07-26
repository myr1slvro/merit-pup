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
  const { role, authToken, handleLogout, handleLogin } = useAuth();
  const tabs = role ? NAV_TABS[role] || [] : [];

  return (
    <nav className="bg-linear-to-r from-meritRed to-meritDarkRed shadow px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
          <span>M</span>
        </div>
        <h1 className="text-3xl font-semibold text-white">MERIT PUP</h1>
      </div>

      <div className="flex items-center gap-6 space-x-2">
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            className="text-lg font-medium text-blue-600 dark:text-white hover:text-blue-800 dark:hover:text-blue-400 transition px-2"
          >
            {tab.label}
          </Link>
        ))}
        {authToken && (
          <button
            onClick={handleLogout}
            className="ml-2 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition text-sm font-semibold"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
