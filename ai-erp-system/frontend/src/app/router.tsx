import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import Dashboard from "../pages/dashboard";
import InventoryPage from "../pages/inventory";
import UsersPage from "../pages/users";
import POList from "../pages/purchasing/POList";
import POForm from "../pages/purchasing/POForm";
import GRNForm from "../pages/purchasing/GRNForm";
import SuppliersPage from "../pages/purchasing/SuppliersPage";
import WarehousesPage from "../pages/purchasing/WarehousesPage";
import POView from "../pages/purchasing/POView";
import MovementsPage from "../pages/purchasing/MovementsPage";
import RoleRoute from "../components/auth/RoleRoute";
import SalesOrderList from "../pages/sales/SalesOrderList";
import SalesOrderForm from "../pages/sales/SalesOrderForm";
import SalesOrderView from "../pages/sales/SalesOrderView";
import DispatchForm from "../pages/sales/DispatchForm";

const getRole = (): "admin" | "manager" | "staff" => {
  const cached = localStorage.getItem("me_role");
  if (cached === "admin" || cached === "manager" || cached === "staff") return cached;
  return "staff";
};

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },

  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "inventory", element: <InventoryPage /> },

          {
            path: "sales",
            children: [
              { index: true, element: <SalesOrderList /> },
              { path: "new", element: <SalesOrderForm /> },
              { path: "orders/:id", element: <SalesOrderView /> },
              { path: "orders/:id/dispatch", element: <DispatchForm /> },
            ],
          },

          {
            path: "users",
            element: (
              <RoleRoute allowed={["admin", "manager"]} userRole={getRole()}>
                <UsersPage />
              </RoleRoute>
            ),
          },

          { path: "customers", element: <div className="p-8"><h1 className="text-3xl font-bold">Customers</h1><p className="text-gray-600">Coming soon...</p></div> },
          { path: "reports", element: <div className="p-8"><h1 className="text-3xl font-bold">Reports</h1><p className="text-gray-600">Coming soon...</p></div> },

          { path: "purchasing/po", element: <POList /> },
          { path: "purchasing/po/new", element: <POForm /> },
          { path: "purchasing/grn", element: <GRNForm /> },
          { path: "purchasing/suppliers", element: <SuppliersPage /> },
          { path: "purchasing/warehouses", element: <WarehousesPage /> },
          { path: "purchasing/po/:id", element: <POView /> },
          {
            path: "purchasing/movements",
            element: (
              <RoleRoute allowed={["admin", "manager"]} userRole={getRole()}>
                <MovementsPage />
              </RoleRoute>
            ),
          },
        ],
      },
    ],
  },
]);