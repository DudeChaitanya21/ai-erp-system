// Navbar.tsx (add a simple Sales link)
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4">
      <div className="font-bold">SmartERP</div>
      <nav className="flex items-center gap-4 text-sm">
        <Link to="/sales" className="text-gray-700 hover:text-blue-600">Sales</Link>
      </nav>
    </header>
  );
};

export default Navbar;