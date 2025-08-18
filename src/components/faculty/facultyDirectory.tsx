import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { getCollegesForUser } from "../../api/collegeincluded";
import { getServiceIMsByCollege } from "../../api/serviceim";
import { getUniversityIMsByCollege } from "../../api/universityim";
import { FaUniversity } from "react-icons/fa";

type College = {
  college_id: number;
  college_name?: string;
  name?: string;
};

type ServiceIM = {
  id: number;
  name: string;
  [key: string]: any;
};

type UniversityIM = {
  id: number;
  name: string;
  [key: string]: any;
};

export default function FacultyDirectory() {
  const { user, authToken } = useAuth();

  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [serviceIMs, setServiceIMs] = useState<Record<number, ServiceIM[]>>({});
  const [universityIMs, setUniversityIMs] = useState<
    Record<number, UniversityIM[]>
  >({});
  const [imsLoading, setIMsLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchColleges = async () => {
      if (!user?.id || !authToken) return;
      setLoading(true);
      setError("");
      try {
        const res = await getCollegesForUser(user.id, authToken);
        setColleges(Array.isArray(res) ? res : []);
      } catch (e) {
        setColleges([]);
        setError("Failed to load colleges.");
      }
      setLoading(false);
    };
    fetchColleges();
  }, [user?.id, authToken]);

  // Fetch IMs for a college when expanded
  const handleExpand = async (collegeId: number) => {
    setExpanded(expanded === collegeId ? null : collegeId);
    if (expanded === collegeId) return; // collapse
    if (serviceIMs[collegeId] && universityIMs[collegeId]) return; // already loaded
    setIMsLoading((prev) => ({ ...prev, [collegeId]: true }));
    try {
      const [serviceRes, universityRes] = await Promise.all([
        getServiceIMsByCollege(collegeId, authToken!),
        getUniversityIMsByCollege(collegeId, authToken!),
      ]);
      setServiceIMs((prev) => ({
        ...prev,
        [collegeId]: serviceRes?.serviceims ?? [],
      }));
      setUniversityIMs((prev) => ({
        ...prev,
        [collegeId]: universityRes?.universityims ?? [],
      }));
    } catch {
      setServiceIMs((prev) => ({ ...prev, [collegeId]: [] }));
      setUniversityIMs((prev) => ({ ...prev, [collegeId]: [] }));
    }
    setIMsLoading((prev) => ({ ...prev, [collegeId]: false }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FaUniversity className="text-meritRed" /> My Colleges
      </h2>
      {/* Colleges row */}
      <div className="flex flex-wrap gap-3 mb-6">
        {loading ? (
          <div className="text-gray-500">Loading colleges...</div>
        ) : error ? (
          <div className="text-meritRed">{error}</div>
        ) : colleges.length === 0 ? (
          <div className="text-gray-400 flex items-center gap-2">
            <FaUniversity />
            No colleges assigned.
          </div>
        ) : (
          colleges.map((c) => (
            <button
              key={c.college_id}
              className={`px-4 py-2 rounded-full border font-semibold transition-colors ${
                expanded === c.college_id
                  ? "bg-meritRed text-white border-meritRed"
                  : "bg-white text-meritRed border-meritRed/40 hover:bg-meritRed/10"
              }`}
              onClick={() => handleExpand(c.college_id)}
            >
              {c.college_name || c.name || `College #${c.college_id}`}
            </button>
          ))
        )}
      </div>

      {/* Expanded IMs section */}
      {expanded && (
        <div className="w-full bg-meritRed/5 border border-meritRed/20 rounded-xl p-6 animate-fade-in mb-4">
          <div className="mb-2 flex items-center gap-2">
            <FaUniversity className="text-meritRed" />
            <span className="font-bold text-meritRed text-lg">
              {colleges.find((c) => c.college_id === expanded)?.college_name ||
                colleges.find((c) => c.college_id === expanded)?.name ||
                `College #${expanded}`}
            </span>
          </div>
          {imsLoading[expanded] ? (
            <div className="text-gray-500 flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5 mr-2 text-meritRed"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Loading IMs...
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-8">
              {/* Service IMs */}
              <div className="flex-1">
                <h3 className="text-meritRed font-semibold mb-2">
                  Service IMs
                </h3>
                {serviceIMs[expanded]?.length ? (
                  <ul className="list-disc ml-5">
                    {serviceIMs[expanded].map((im) => (
                      <li key={im.id} className="text-sm py-0.5">
                        {im.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-400 text-sm">No Service IMs.</div>
                )}
              </div>
              {/* University IMs */}
              <div className="flex-1">
                <h3 className="text-meritRed font-semibold mb-2">
                  University IMs
                </h3>
                {universityIMs[expanded]?.length ? (
                  <ul className="list-disc ml-5">
                    {universityIMs[expanded].map((im) => (
                      <li key={im.id} className="text-sm py-0.5">
                        {im.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-400 text-sm">
                    No University IMs.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
