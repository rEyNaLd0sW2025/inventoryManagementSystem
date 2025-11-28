import { ReactNode, useState } from "react";
import {
  Menu,
  Bell,
  Package,
  Home,
  ArrowLeftRight,
  ShoppingCart,
  History,
  AlertTriangle,
  User,
  LogOut,
  X,
} from "lucide-react";
import { UserSwitcher } from "./UserSwitcher";

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  unreadNotifications?: number;
  currentUser: any;
  onUserChange: (userId: string) => void;
}

export function Layout({
  children,
  currentPage,
  onNavigate,
  unreadNotifications = 0,
  currentUser,
  onUserChange,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: "dashboard", icon: Home, label: "Dashboard", role: "both" },
    { id: "inventory", icon: Package, label: "Inventario", role: "both" },
    {
      id: "movements",
      icon: ArrowLeftRight,
      label: "Movimientos",
      role: "both",
    },
    {
      id: "transfers",
      icon: ArrowLeftRight,
      label: "Transferencias",
      role: "both",
    },
    {
      id: "purchases",
      icon: ShoppingCart,
      label: "Ordenes",
      role: "both",
    },
    { id: "history", icon: History, label: "Historial", role: "both" },
    {
      id: "alerts",
      icon: AlertTriangle,
      label: "Alertas",
      role: "super_admin",
    },
  ];

  const visibleMenuItems = menuItems.filter(
    (item) => item.role === "both" || item.role === currentUser.role
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <div>
              <h1 className="text-gray-900">Sistema de Almacenes</h1>
              <p className="text-sm text-gray-500">
                Gestión Jerárquica de Inventarios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate("notifications")}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </button>

            <UserSwitcher
              currentUser={currentUser}
              onUserChange={onUserChange}
            />

            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-[73px] bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-20 ${
          sidebarOpen ? "w-64" : "w-0 -translate-x-full"
        }`}
      >
        <nav className="p-4 space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`pt-[73px] transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
