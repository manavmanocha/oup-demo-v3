import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Workflow,
  Package,
  Layers,
  BookOpen,
  Library as LibraryIcon,
  Upload,
  Menu,
  X,
  LogOut,
  User,
  FolderTree,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Separator } from "./ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "../context/AuthContext";
import dlsLogo from "../../assets/icons/DLSLogo.svg";
import builderLogo from "../../assets/icons/BuilderLogo.svg";

export function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const productItems = [
    { label: "Families", icon: Package },
    { label: "Umbrella Products", icon: Layers },
    { label: "Components", icon: Layers },
    { label: "eBooks", icon: BookOpen },
  ];

  const NavItem = ({
    to,
    icon: Icon,
    label,
    disabled = false,
  }: any) => {
    const content = (
      <div
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          disabled
            ? "text-gray-400 cursor-not-allowed"
            : isActive(to)
              ? "bg-blue-50 text-blue-700 font-medium"
              : "text-gray-700 hover:bg-gray-100"
        } ${collapsed ? "justify-center" : ""}`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        {!collapsed && <span>{label}</span>}
      </div>
    );

    if (disabled) {
      return collapsed ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="w-full" disabled>
                {content}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <button className="w-full" disabled>
          {content}
        </button>
      );
    }

    return collapsed ? (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to={to} className="block">
              {content}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      <Link to={to}>{content}</Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Logo & Hamburger */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img src={builderLogo} alt="Builder Logo" className="w-8 h-8" />
              <span className="font-bold text-lg">
                BUILDER
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          {/* Dashboard */}
          <div className="mb-3">
            <NavItem
              icon={LayoutDashboard}
              label="Dashboard"
              disabled
            />
          </div>

          {/* Products Section */}
          {!collapsed && (
            <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Products
            </div>
          )}
          <div className="space-y-1 mb-3">
            {productItems.map((item, index) => (
              <NavItem
                key={index}
                icon={item.icon}
                label={item.label}
                disabled
              />
            ))}
          </div>

          <Separator className="my-4" />

          {/* Assets Section */}
          {!collapsed && (
            <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Assets
            </div>
          )}
          <div className="mb-1">
            <NavItem
              to="/library"
              icon={LibraryIcon}
              label="Library"
            />
          </div>

          {/* Taxonomies */}
          <div className="mb-1">
            <NavItem
              to="/taxonomies"
              icon={FolderTree}
              label="Taxonomies"
            />
          </div>

          <Separator className="my-4" />

          {/* Workflows */}
          <div className="mb-1">
            <NavItem
              to="/workflows"
              icon={Workflow}
              label="Workflows"
            />
          </div>

          {/* Publish */}
          <div>
            <NavItem icon={Upload} label="Publish" disabled />
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {collapsed ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-gray-900 text-white flex items-center justify-center font-bold text-xs">
                DLS
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              <img src={dlsLogo} alt="comproDLS" className="h-8 w-full max-w-[8.5rem] h-[3rem] display-block m-auto" />
              <div className="text-gray-400 m-auto text-center mt-1">
                © 2025 Compro Technologies
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
              <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                🌐
              </span>
              En
            </button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none">
                  <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </span>
                  <span className="font-medium">{user?.name || 'User'}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="text-red-600 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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