import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalSales: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [productsRes, lowStockRes] = await Promise.all([
        api.get('/inventory/products/'),
        api.get('/inventory/low-stock/'),
      ]);
      const products = productsRes.data || [];
      const lowStockItems = lowStockRes.data || [];
      const lowStockCount = Array.isArray(lowStockItems) ? lowStockItems.length : (lowStockItems?.results?.length || 0);

      setStats({
        totalProducts: products.length,
        lowStock: lowStockCount,
        totalSales: 0,
        revenue: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: '📦',
      gradient: 'from-blue-500 to-blue-600',
      link: '/inventory',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStock,
      icon: '⚠️',
      gradient: 'from-red-500 to-red-600',
      link: '/inventory?filter=low_stock',
    },
    {
      title: 'Total Sales',
      value: stats.totalSales,
      icon: '💰',
      gradient: 'from-green-500 to-green-600',
      link: '/sales',
    },
    {
      title: 'Revenue',
      value: `$${stats.revenue.toLocaleString()}`,
      icon: '💵',
      gradient: 'from-purple-500 to-purple-600',
      link: '/reports',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-gray-200 rounded-xl w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 text-lg">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-semibold mb-3 uppercase tracking-wide">
                  {card.title}
                </p>
                <p className="text-4xl font-extrabold text-gray-900 group-hover:scale-110 transition-transform inline-block">
                  {card.value}
                </p>
              </div>
              <div className={`bg-gradient-to-br ${card.gradient} w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg group-hover:scale-125 group-hover:rotate-6 transition-all`}>
                {card.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <span>⚡</span>
          <span>Quick Actions</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/inventory?action=create"
            className="p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all text-center group transform hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">➕</div>
            <div className="font-semibold text-gray-700 group-hover:text-blue-600">Add Product</div>
          </Link>
          <Link
            to="/sales?action=create"
            className="p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-green-500 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 transition-all text-center group transform hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🛒</div>
            <div className="font-semibold text-gray-700 group-hover:text-green-600">New Sale</div>
          </Link>
          <Link
            to="/customers?action=create"
            className="p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-purple-500 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 transition-all text-center group transform hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">👤</div>
            <div className="font-semibold text-gray-700 group-hover:text-purple-600">Add Customer</div>
          </Link>
          <Link
            to="/reports"
            className="p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-orange-500 hover:bg-gradient-to-br hover:from-orange-50 hover:to-amber-50 transition-all text-center group transform hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📊</div>
            <div className="font-semibold text-gray-700 group-hover:text-orange-600">View Reports</div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <span>📋</span>
            <span>Recent Products</span>
          </h2>
          <div className="space-y-3">
            <p className="text-gray-500 text-sm">No recent products</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <span>⚠️</span>
            <span>Low Stock Alerts</span>
          </h2>
          <div className="space-y-3">
            {stats.lowStock > 0 ? (
              <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl">
                <p className="text-red-800 font-semibold text-lg mb-2">
                  {stats.lowStock} products need restocking
                </p>
                <Link to="/inventory?filter=low_stock" className="text-red-600 text-sm font-medium hover:underline flex items-center space-x-1">
                  <span>View details</span>
                  <span>→</span>
                </Link>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-xl">
                <p className="text-green-800 font-medium flex items-center space-x-2">
                  <span>✅</span>
                  <span>All products are well stocked!</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;