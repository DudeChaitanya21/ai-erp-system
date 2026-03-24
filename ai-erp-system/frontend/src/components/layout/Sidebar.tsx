// Sidebar.tsx (add inside your nav list)
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const active = (path: string) => location.pathname.startsWith(path) ? "bg-blue-50 text-blue-700" : "text-gray-700";

  return (
    <aside className="w-64 border-r bg-white">
      <nav className="p-4 space-y-1">
        <Link to="/" className={`block px-3 py-2 rounded ${active("/")}`}>Dashboard</Link>
        <Link to="/inventory" className={`block px-3 py-2 rounded ${active("/inventory")}`}>Inventory</Link>
        <Link to="/purchasing/po" className={`block px-3 py-2 rounded ${active("/purchasing")}`}>Purchasing</Link>
        <Link to="/sales" className={`block px-3 py-2 rounded ${active("/sales")}`}>Sales</Link>
        <Link to="/users" className={`block px-3 py-2 rounded ${active("/users")}`}>Users</Link>
      </nav>
    </aside>
  );
};

export default Sidebar;