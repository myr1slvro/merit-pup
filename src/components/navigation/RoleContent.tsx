import { useAuth } from "../auth/AuthProvider";
import ProtectedRoute from "../auth/ProtectedRoute";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import FacultyRoleContent from "../faculty/facultyRoleContent";
import UserManagement from "../technical-admin/userManagement";

export default function RoleContent() {
  const { roles } = useAuth();
  const location = useLocation();

  const content = useMemo(() => {
    if (!roles || roles.length === 0) return null;
    // Use the current route to determine which content to show
    switch (location.pathname) {
      case "/faculty":
        return (
          <ProtectedRoute allowedRoles={["Faculty"]}>
            <FacultyRoleContent />
          </ProtectedRoute>
        );
      case "/evaluator":
        return (
          <ProtectedRoute allowedRoles={["Evaluator"]}>
            <div>Evaluator</div>
          </ProtectedRoute>
        );
      case "/utldo-admin":
        return (
          <ProtectedRoute allowedRoles={["UTLDO Admin"]}>
            <div>UTLDO Admin</div>
          </ProtectedRoute>
        );
      case "/technical-admin":
        return (
          <ProtectedRoute allowedRoles={["Technical Admin"]}>
            <UserManagement />
          </ProtectedRoute>
        );
      default:
        // If multiple roles, show a selector or dashboard (customize as needed)
        return (
          <div className="p-8 text-xl">
            Select a role from the navigation above.
          </div>
        );
    }
  }, [roles, location.pathname]);

  return content;
}
