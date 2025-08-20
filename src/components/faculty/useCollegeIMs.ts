import { useCallback, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { getServiceIMsByCollegeWithSubjects } from "../../api/serviceim";
import { getUniversityIMsByCollegeWithSubjects } from "../../api/universityim";
import type { College } from "../../types/college";
import type { ServiceIM } from "../../types/serviceim";
import type { UniversityIM } from "../../types/universityim";

export default function useCollegeIMs() {
  const { authToken } = useAuth();
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [serviceIMs, setServiceIMs] = useState<ServiceIM[]>([]);
  const [universityIMs, setUniversityIMs] = useState<UniversityIM[]>([]);
  const [imsLoading, setIMsLoading] = useState(false);
  const [imsError, setIMsError] = useState("");

  const selectCollege = useCallback(
    async (c: College) => {
      setSelectedCollege(c);
      setIMsLoading(true);
      setIMsError("");
      if (!authToken) {
        setIMsError("No auth token available.");
        setServiceIMs([]);
        setUniversityIMs([]);
        setIMsLoading(false);
        return;
      }
      try {
        const [service, university] = await Promise.all([
          getServiceIMsByCollegeWithSubjects(c.id, authToken),
          getUniversityIMsByCollegeWithSubjects(c.id, authToken),
        ]);

        setServiceIMs(service as ServiceIM[]);
        setUniversityIMs(university as UniversityIM[]);
      } catch (e) {
        setIMsError("Failed to load IMs for this college.");
        setServiceIMs([]);
        setUniversityIMs([]);
      } finally {
        setIMsLoading(false);
      }
    },
    [authToken]
  );

  return {
    selectedCollege,
    serviceIMs,
    universityIMs,
    imsLoading,
    imsError,
    selectCollege,
  } as const;
}
