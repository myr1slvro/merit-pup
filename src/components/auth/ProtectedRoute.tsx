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
  const ctx: any = useAuth();
  const { user, hydrating } = ctx;

  if (hydrating) {
    return <div className="p-6 text-sm text-gray-500">Loading session...</div>;
  }

  if (user === undefined) {
    return <div>Loading...</div>;
  }

  if (
    user === null ||
    (allowedRoles && (!user.role || !allowedRoles.includes(user.role)))
  ) {
    return <div>Permission denied</div>;
  }

  return <>{children}</>;
}
