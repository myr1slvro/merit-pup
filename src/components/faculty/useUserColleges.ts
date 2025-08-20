import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { getCollegesForUserDetailed } from "../../api/collegeincluded";
import type { College } from "../../types/college";

export default function useUserColleges() {
  const { user, authToken } = useAuth();
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id || !authToken) return;
    setLoading(true);
    setError("");
    getCollegesForUserDetailed(user.id, authToken)
      .then((mapped: College[]) => setColleges(mapped))
      .catch(() => {
        setColleges([]);
        setError("Failed to load colleges.");
      })
      .finally(() => setLoading(false));
  }, [user?.id, authToken]);

  return { colleges, loading, error } as const;
}
