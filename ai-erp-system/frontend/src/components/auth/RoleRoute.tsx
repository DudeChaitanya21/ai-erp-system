import { Navigate } from "react-router-dom";

type Props = {
  allowed: Array<"admin" | "manager" | "staff">;
  userRole?: "admin" | "manager" | "staff";
  children: React.ReactNode;
};

const RoleRoute = ({ allowed, userRole, children }: Props) => {
  if (!userRole) return <Navigate to="/login" replace />;
  return allowed.includes(userRole) ? <>{children}</> : <Navigate to="/" replace />;
};

export default RoleRoute;