import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  products,
  warehouses,
  movements,
  alerts,
  notifications,
} from "../data/mockData";

interface DashboardProps {
  onNavigate: (page: string, filter?: any) => void;
  purchaseRequests: import("../types").PurchaseRequest[];
}

export function Dashboard({ onNavigate, purchaseRequests }: DashboardProps) {
  // Estadísticas generales
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === "activo").length;
  const criticalStock = products.filter(
    (p) => p.currentStock <= p.minStock
  ).length;
  const totalStock = products.reduce((sum, p) => sum + p.currentStock, 0);

  // Movimientos recientes
  const recentMovements = movements.slice(0, 5);

  // Alertas activas
  const activeAlerts = alerts.filter((a) => !a.resolved);

  // Solicitudes pendientes
  const pendingRequests = purchaseRequests.filter(
    (r) => r.status === "pendiente"
  ).length;

  // Notificaciones no leídas
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  // Datos para gráfico de stock por almacén
  const stockByWarehouse = warehouses.map((w) => {
    const warehouseProducts = products.filter((p) => p.warehouseId === w.id);
    const total = warehouseProducts.reduce((sum, p) => sum + p.currentStock, 0);
    return {
      name: w.name.replace("Almacén de ", ""),
      cantidad: total,
      productos: warehouseProducts.length,
    };
  });

  // Datos para gráfico de productos por categoría
  const categories = [...new Set(products.map((p) => p.category))];
  const productsByCategory = categories.map((cat) => ({
    name: cat,
    value: products.filter((p) => p.category === cat).length,
  }));

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
  ];

  // Datos para gráfico de movimientos (últimos 7 días)
  const movementData = [
    { día: "Lun", entradas: 12, salidas: 8 },
    { día: "Mar", entradas: 15, salidas: 11 },
    { día: "Mié", entradas: 8, salidas: 14 },
    { día: "Jue", entradas: 20, salidas: 9 },
    { día: "Vie", entradas: 18, salidas: 15 },
    { día: "Sáb", entradas: 5, salidas: 3 },
    { día: "Dom", entradas: 3, salidas: 2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">
          Vista global de todos los almacenes del sistema
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl text-gray-900">{totalProducts}</div>
          <div className="text-sm text-gray-600">Productos Totales</div>
          <div className="text-xs text-green-600 mt-1">
            {activeProducts} activos
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl text-gray-900">{criticalStock}</div>
          <div className="text-sm text-gray-600">Stock Crítico</div>
          <button
            onClick={() => onNavigate("alerts")}
            className="text-xs text-red-600 mt-1 hover:underline"
          >
            Ver detalles →
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl text-gray-900">{pendingRequests}</div>
          <div className="text-sm text-gray-600">Solicitudes Pendientes</div>
          <button
            onClick={() => onNavigate("purchases")}
            className="text-xs text-purple-600 mt-1 hover:underline"
          >
            Revisar →
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-2xl text-gray-900">
            {totalStock.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Unidades en Stock</div>
          <div className="text-xs text-gray-500 mt-1">
            {warehouses.length} almacenes
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock por almacén */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Stock por Almacén</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stockByWarehouse}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Productos por categoría */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Productos por Categoría</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={productsByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {productsByCategory.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Movimientos (últimos 7 días) */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Movimientos - Última Semana</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={movementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="día" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="entradas"
                stroke="#10b981"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="salidas"
                stroke="#ef4444"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Entradas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Salidas</span>
            </div>
          </div>
        </div>

        {/* Alertas activas */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Alertas Activas</h3>
            <button
              onClick={() => onNavigate("alerts")}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {activeAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.severity === "error"
                    ? "bg-red-50 border-red-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className={`w-4 h-4 mt-0.5 ${
                      alert.severity === "error"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="text-sm text-gray-900">
                      {alert.productName}
                    </div>
                    <div className="text-xs text-gray-600">{alert.message}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {alert.warehouseName}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {activeAlerts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <div className="text-sm">No hay alertas activas</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Movimientos recientes */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-900">Movimientos Recientes</h3>
            <button
              onClick={() => onNavigate("movements")}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Almacén
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentMovements.map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(movement.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        movement.type === "entrada"
                          ? "bg-green-100 text-green-800"
                          : movement.type === "salida"
                          ? "bg-red-100 text-red-800"
                          : movement.type === "reintegro"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {movement.type.charAt(0).toUpperCase() +
                        movement.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{movement.productName}</div>
                    <div className="text-xs text-gray-500">
                      {movement.productCode}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {movement.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {movement.warehouseName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        movement.status === "aprobado"
                          ? "bg-green-100 text-green-800"
                          : movement.status === "rechazado"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {movement.status.charAt(0).toUpperCase() +
                        movement.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
