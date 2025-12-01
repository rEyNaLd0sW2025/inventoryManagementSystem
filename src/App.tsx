import { useState } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Inventory } from "./components/Inventory";
import { Movements } from "./components/Movements";
import { Transfers } from "./components/Transfers";
import { PurchaseRequests } from "./components/PurchaseRequests";
import { Notifications } from "./components/Notifications";
import { History } from "./components/History";
import { Alerts } from "./components/Alerts";
import {
  notifications as initialNotifications,
  users,
  purchaseRequests as initialPurchaseRequests,
} from "./data/mockData";
import { User, Notification } from "./types";

type Page =
  | "dashboard"
  | "inventory"
  | "movements"
  | "transfers"
  | "purchases"
  | "notifications"
  | "history"
  | "alerts";

interface NavigationData {
  productId?: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [navigationData, setNavigationData] = useState<
    NavigationData | undefined
  >();
  const [currentUser, setCurrentUser] = useState<User>(users[0]); // Super Admin por defecto
  const [purchaseRequests, setPurchaseRequests] = useState(
    initialPurchaseRequests
  );
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const handleNavigate = (page: string, data?: NavigationData) => {
    setCurrentPage(page as Page);
    setNavigationData(data);
  };

  const handleUserChange = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      // Redirigir al dashboard al cambiar de usuario
      setCurrentPage("dashboard");
    }
  };

  // 👇 agrega estos
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard
            onNavigate={handleNavigate}
            purchaseRequests={purchaseRequests}
          />
        );
      case "inventory":
        return (
          <Inventory onNavigate={handleNavigate} currentUser={currentUser} />
        );
      case "movements":
        return (
          <Movements
            onNavigate={handleNavigate}
            currentUser={currentUser}
            setNotifications={setNotifications}
          />
        );
      case "transfers":
        return (
          <Transfers onNavigate={handleNavigate} currentUser={currentUser} />
        );
      case "purchases":
        return (
          <PurchaseRequests
            onNavigate={handleNavigate}
            currentUser={currentUser}
            requests={purchaseRequests}
            setRequests={setPurchaseRequests}
            setNotifications={setNotifications}
            products={products}
            setProducts={setProducts}
            movements={movements}
            setMovements={setMovements}
            orders={orders}
            setOrders={setOrders}
          />
        );
      case "notifications":
        return (
          <Notifications
            onNavigate={handleNavigate}
            notifications={notifications}
            setNotifications={setNotifications}
          />
        );
      case "history":
        return <History initialFilter={navigationData} />;
      case "alerts":
        return <Alerts onNavigate={handleNavigate} />;
      default:
        return (
          <Dashboard
            onNavigate={handleNavigate}
            purchaseRequests={purchaseRequests}
          />
        );
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      unreadNotifications={unreadNotifications}
      currentUser={currentUser}
      onUserChange={handleUserChange}
    >
      {renderPage()}
    </Layout>
  );
}
