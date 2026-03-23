import { useEffect, useState } from "react";
import api from "../../services/api";
import { authService } from "../../services/authService";
import { Link, useLocation, Outlet } from 'react-router-dom';
import Chatbot from '../chatbot/chatbot';

const MainLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [me, setMe] = useState<{ username?: string; role?: string } | null>(null);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Inventory', href: '/inventory', icon: '📦' },
    { name: 'Sales', href: '/sales', icon: '💰' },
    { name: 'Customers', href: '/customers', icon: '👥' },
    { name: 'Reports', href: '/reports', icon: '📈' },
    { name: "Users", href: "/users", icon: "👤", color: "text-cyan-600" },
    { name: "Purchasing", href: "/purchasing/po", icon: "🧾" },
    { name: "Movements", href: "/purchasing/movements", icon: "🔄" },
  ];

  const isActive = (path: string) => location.pathname === path;
  const userRole = (me?.role || "staff") as "admin" | "manager" | "staff";

  useEffect(() => {
    api
      .get("/auth/me/")
      .then((res) => {
        setMe(res.data);
        localStorage.setItem("me_role", res.data?.role || "staff");
      })
      .catch(() => {
        setMe(null);
        localStorage.removeItem("me_role");
      });
  }, []);

  const logout = () => {
    authService.logout();
    localStorage.removeItem("me_role");
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-white via-white to-gray-50 shadow-2xl transition-all duration-300 flex flex-col border-r border-gray-200 z-10`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 relative">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            {sidebarOpen && (
              <h1 className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SmartERP
              </h1>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-6 right-4 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation
            .filter((item) => {
              if (["/users", "/purchasing/movements"].includes(item.href)) {
                return userRole === "admin" || userRole === "manager";
              }
              return true;
            })
            .map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive(item.href)
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
              }`}
            >
              <span className={`text-2xl ${isActive(item.href) ? '' : 'group-hover:scale-110 transition-transform'}`}>
                {item.icon}
              </span>
              {sidebarOpen && (
                <span className={`font-medium ${isActive(item.href) ? 'text-white' : ''}`}>
                  {item.name}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              U
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">{me?.username || "User"}</p>
                <p className="text-xs text-gray-500 capitalize">{me?.role || "staff"}</p>
              </div>
            )}
            {sidebarOpen && (
              <button
                type="button"
                onClick={logout}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
        <Outlet />
      </main>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
};

export default MainLayout;