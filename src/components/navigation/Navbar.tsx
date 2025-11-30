import { Link, useLocation, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthProvider";
import { FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";

import { UserRole } from "../../types/user";
interface NavItem {
  label: string;
  to?: string;
  children?: { label: string; to: string }[];
}

const ROLE_TABS: Record<UserRole, NavItem[]> = {
  Faculty: [{ label: "Faculty", to: "/faculty" }],
  PIMEC: [
    { label: "Faculty", to: "/faculty" },
    {
      label: "PIMEC",
      children: [
        { label: "PIMEC Dashboard", to: "/pimec" },
        { label: "User Analytics", to: "/user-analytics" },
      ],
    },
  ],
  "UTLDO Admin": [
    { label: "Faculty", to: "/faculty" },
    { label: "PIMEC", to: "/pimec" },
    {
      label: "UTLDO Office",
      children: [
        { label: "UTLDO Approval", to: "/utldo/approval" },
        { label: "User Analytics", to: "/user-analytics" },
        { label: "Certification", to: "/utldo/certification" },
      ],
    },
  ],
  "Technical Admin": [
    { label: "Faculty", to: "/faculty" },
    { label: "PIMEC", to: "/pimec" },
    {
      label: "UTLDO Office",
      children: [
        { label: "UTLDO Approval", to: "/utldo/approval" },
        { label: "User Analytics", to: "/user-analytics" },
        { label: "Certification", to: "/utldo/certification" },
      ],
    },
    {
      label: "Technical Admin",
      children: [
        { label: "User Management", to: "/technical-admin" },
        { label: "College Management", to: "/technical-admin/colleges" },
        { label: "Subject Management", to: "/technical-admin/subjects" },
      ],
    },
  ],
};

export default function Navbar() {
  const { user, authToken, handleLogout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  let tabs: NavItem[] = [];
  if (user && user.role && ROLE_TABS[user.role as UserRole]) {
    tabs = ROLE_TABS[user.role as UserRole];
  }

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
      // Close profile dropdown when clicking outside
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setOpenMenu(null);
    setShowProfileDropdown(false);
  }, [location.pathname]);

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
        <div ref={containerRef} className="flex items-center gap-6 space-x-2">
          {tabs.map((tab) => {
            if (tab.children && tab.children.length) {
              const isOpen = openMenu === tab.label;
              return (
                <div key={tab.label} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      // closing profile dropdown when opening any nav menu
                      setShowProfileDropdown(false);
                      setOpenMenu(isOpen ? null : tab.label);
                    }}
                    className={`text-lg font-medium px-2 flex items-center gap-1 transition ${
                      isOpen ||
                      location.pathname.startsWith(
                        "/" + (tab.label.toLowerCase().split(" ")[0] || "")
                      )
                        ? "text-meritYellow"
                        : "text-white hover:text-meritGray"
                    }`}
                  >
                    {tab.label}
                    <span className="text-xs">▾</span>
                  </button>
                  {isOpen && (
                    <div className="absolute left-0 mt-2 bg-white text-sm rounded shadow-lg min-w-[220px] z-40 border border-gray-200">
                      <div className="py-1">
                        {tab.children.map((child) => (
                          <Link
                            key={child.to}
                            to={child.to}
                            className={`block px-4 py-2 rounded-none whitespace-nowrap transition ${
                              location.pathname === child.to
                                ? "bg-meritRed/10 text-meritRed font-semibold"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={tab.to || tab.label}
                to={tab.to || "#"}
                className={`text-lg font-medium transition px-2 ${
                  location.pathname === tab.to
                    ? "text-meritYellow"
                    : "text-white hover:text-meritGray"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}

          {/* User Profile Dropdown */}
          <div ref={profileRef} className="relative ml-4">
            <button
              type="button"
              onClick={() => {
                // close other nav dropdowns when opening profile
                setOpenMenu(null);
                setShowProfileDropdown(!showProfileDropdown);
              }}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-meritYellow transition text-meritRed"
              title="User Profile"
            >
              <FaUser className="text-lg" />
            </button>
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 bg-white text-sm rounded shadow-lg min-w-[220px] z-40 border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="font-semibold text-gray-800">
                    {user?.last_name}, {user?.first_name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{user?.role}</div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      navigate("/settings");
                    }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
                  >
                    <FaCog className="text-gray-600" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
                  >
                    <FaSignOutAlt className="text-gray-600" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
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
