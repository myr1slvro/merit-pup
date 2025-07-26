import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import ProtectedRoute from "./ProtectedRoute";
import { useMemo } from "react";
import FacultyRoleContent from "../faculty/facultyRoleContent";

export default function RoleContent() {
  const { role } = useAuth();

  const content = useMemo(() => {
    switch (role) {
      case "Faculty":
        return (
          <ProtectedRoute allowedRoles={["Faculty"]}>
            <FacultyRoleContent />
          </ProtectedRoute>
        );
      case "Evaluator":
        return (
          <ProtectedRoute allowedRoles={["Evaluator"]}>
            <div>Evaluator</div>
          </ProtectedRoute>
        );
      case "UTLDO Admin":
        return (
          <ProtectedRoute allowedRoles={["UTLDO Admin"]}>
            <div>UTLDO Admin</div>
          </ProtectedRoute>
        );
      case "Technical Admin":
        return (
          <ProtectedRoute allowedRoles={["Technical Admin"]}>
            <div>Technical Admin</div>
          </ProtectedRoute>
        );
      default:
        return null;
    }
  }, [role]);

  return content;
}
