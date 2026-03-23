import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = () => {
  const token = localStorage.getItem("access_token");
  const location = useLocation();
  if (token) return <Outlet />;
  const returnTo = encodeURIComponent(location.pathname + location.search);
  return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
};

export default ProtectedRoute;