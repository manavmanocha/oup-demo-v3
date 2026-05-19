import { Outlet, Link, useLocation } from 'react-router';
import { LayoutDashboard, Database, Workflow, Package, Layers, BookOpen, Library } from 'lucide-react';

export function Root() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/item-bank', label: 'Item Bank', icon: Database },
    { path: '/workflows', label: 'Workflows', icon: Workflow },
  ];

  const productItems = [
    { label: 'Families', icon: Package },
    { label: 'Umbrella Products', icon: Layers },
    { label: 'Components', icon: Layers },
    { label: 'eBooks', icon: BookOpen },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 text-white flex items-center justify-center font-bold text-sm">
              DLS
            </div>
            <span className="font-semibold text-gray-900">BUILDER</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Products Section */}
          <div className="mt-8">
            <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">
              Products
            </div>
            <div className="space-y-1">
              {productItems.map((item, index) => (
                <button
                  key={index}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 cursor-not-allowed"
                  disabled
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assets Section */}
          <div className="mt-8">
            <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">
              Assets
            </div>
            <div className="space-y-1">
              <button
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 cursor-not-allowed"
                disabled
              >
                <Library className="w-4 h-4" />
                Library
              </button>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <div className="font-semibold">comproDLS™</div>
            <div>~Compro Technologies~</div>
            <div>© 2026 Compro Technologies</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
              <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">🌐</span>
              En
            </button>
            <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
              <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">👤</span>
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
