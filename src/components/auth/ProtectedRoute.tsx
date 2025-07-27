import { UserRole } from "../../types/user";
import { PropsWithChildren } from "react";
import { useAuth } from "./AuthProvider";

type ProtectedRouteProps = PropsWithChildren & {
  allowedRoles?: UserRole[];
};

export default function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const { user, roles } = useAuth();

  if (user === undefined) {
    return <div>Loading...</div>;
  }

  if (
    user === null ||
    (allowedRoles &&
      (!roles || !roles.some((role) => allowedRoles.includes(role))))
  ) {
    return <div>Permission denied</div>;
  }

  return <>{children}</>;
}
