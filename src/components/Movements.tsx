import { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  Edit2,
  CheckCircle,
  XCircle,
  Clock,
  X,
} from "lucide-react";
import {
  movements as initialMovements,
  products,
  warehouses,
} from "../data/mockData";
import {
  Movement,
  MovementType,
  MovementStatus,
  User,
  Notification,
} from "../types";
import { createNotification } from "../services/notifications";

interface MovementsProps {
  onNavigate: (page: string, data?: any) => void;
  currentUser: User;
  setNotifications?: (
    n: Notification[] | ((prev: Notification[]) => Notification[])
  ) => void;
}

export function Movements({
  onNavigate,
  currentUser,
  setNotifications,
}: MovementsProps) {
  const [movements, setMovements] = useState<Movement[]>(initialMovements);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<MovementType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<MovementStatus | "all">(
    "all"
  );
  const [filterWarehouse, setFilterWarehouse] = useState("all");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newMovement, setNewMovement] = useState({
    productId: "",
    productCode: "",
    productName: "",
    warehouseId: "",
    warehouseName: "",
    type: "entrada" as MovementType,
    quantity: 1,
    reason: "",
    responsibleUser: currentUser.name,
  });

  const filteredMovements = movements.filter((movement) => {
    const matchesSearch =
      movement.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || movement.type === filterType;
    const matchesStatus =
      filterStatus === "all" || movement.status === filterStatus;
    const matchesWarehouse =
      filterWarehouse === "all" || movement.warehouseId === filterWarehouse;

    return matchesSearch && matchesType && matchesStatus && matchesWarehouse;
  });

  const getTypeIcon = (type: MovementType) => {
    switch (type) {
      case "entrada":
        return <ArrowDown className="w-4 h-4" />;
      case "salida":
        return <ArrowUp className="w-4 h-4" />;
      case "reintegro":
        return <RefreshCw className="w-4 h-4" />;
      case "ajuste":
        return <Edit2 className="w-4 h-4" />;
      default:
        return <ArrowDown className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: MovementType) => {
    switch (type) {
      case "entrada":
        return "bg-green-100 text-green-800";
      case "salida":
        return "bg-red-100 text-red-800";
      case "reintegro":
        return "bg-blue-100 text-blue-800";
      case "ajuste":
        return "bg-purple-100 text-purple-800";
      case "transferencia":
        return "bg-orange-100 text-orange-800";
    }
  };

  const getStatusIcon = (status: MovementStatus) => {
    switch (status) {
      case "aprobado":
        return <CheckCircle className="w-4 h-4" />;
      case "rechazado":
        return <XCircle className="w-4 h-4" />;
      case "pendiente":
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: MovementStatus) => {
    switch (status) {
      case "aprobado":
        return "bg-green-100 text-green-800";
      case "rechazado":
        return "bg-red-100 text-red-800";
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
    }
  };

  // Estadísticas rápidas
  const totalEntradas = movements.filter((m) => m.type === "entrada").length;
  const totalSalidas = movements.filter((m) => m.type === "salida").length;
  const totalPendientes = movements.filter(
    (m) => m.status === "pendiente"
  ).length;

  // Handlers for approving/rejecting movements
  const approveMovement = (id: string) => {
    const mv = movements.find((m) => m.id === id);
    if (!mv) return;
    setMovements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "aprobado" } : m))
    );

    const notif = createNotification({
      type: "entrada_salida",
      title: "Movimiento aprobado",
      message: `Movimiento ${mv.id} para ${mv.productName} fue aprobado.`,
      warehouseId: mv.warehouseId,
      warehouseName: mv.warehouseName,
      read: false,
      relatedId: mv.id,
      severity: "success",
    });
    if (setNotifications)
      setNotifications((prev: Notification[]) => [notif, ...prev]);
  };

  const rejectMovement = (id: string) => {
    const mv = movements.find((m) => m.id === id);
    if (!mv) return;
    const reason = prompt("Motivo del rechazo:") || "Sin motivo especificado";
    setMovements((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: "rechazado", observations: reason } : m
      )
    );

    const notif = createNotification({
      type: "rechazo",
      title: "Movimiento rechazado",
      message: `Movimiento ${mv.id} para ${mv.productName} fue rechazado. Motivo: ${reason}`,
      warehouseId: mv.warehouseId,
      warehouseName: mv.warehouseName,
      read: false,
      relatedId: mv.id,
      severity: "error",
    });
    if (setNotifications)
      setNotifications((prev: Notification[]) => [notif, ...prev]);
  };

  // Handler para registrar nuevo movimiento
  const handleRegisterMovement = () => {
    if (
      !newMovement.productId ||
      !newMovement.warehouseId ||
      !newMovement.reason
    ) {
      alert("Por favor complete todos los campos obligatorios");
      return;
    }

    const selectedProduct = products.find(
      (p) => p.id === newMovement.productId
    );
    const selectedWarehouse = warehouses.find(
      (w) => w.id === newMovement.warehouseId
    );

    const movement: Movement = {
      id: `MOV-${Date.now()}`,
      date: new Date().toISOString(),
      productId: newMovement.productId,
      productCode: selectedProduct?.code || "",
      productName: selectedProduct?.name || "",
      warehouseId: newMovement.warehouseId,
      warehouseName: selectedWarehouse?.name || "",
      type: newMovement.type,
      quantity:
        newMovement.type === "salida"
          ? -newMovement.quantity
          : newMovement.quantity,
      reason: newMovement.reason,
      responsibleUser: currentUser.name,
      status: currentUser.role === "super_admin" ? "aprobado" : "pendiente",
      observations: "",
    };

    setMovements((prev) => [movement, ...prev]);

    // Crear notificación
    const notif = createNotification({
      type: "entrada_salida",
      title: "Nuevo movimiento registrado",
      message: `Movimiento ${movement.type} para ${
        movement.productName
      } ha sido ${
        movement.status === "aprobado"
          ? "aprobado"
          : "registrado y está pendiente de aprobación"
      }.`,
      warehouseId: movement.warehouseId,
      warehouseName: movement.warehouseName,
      read: false,
      relatedId: movement.id,
      severity: movement.status === "aprobado" ? "success" : "warning",
    });

    if (setNotifications) {
      setNotifications((prev: Notification[]) => [notif, ...prev]);
    }

    // Reset form and close modal
    setNewMovement({
      productId: "",
      productCode: "",
      productName: "",
      warehouseId: "",
      warehouseName: "",
      type: "entrada",
      quantity: 1,
      reason: "",
      responsibleUser: currentUser.name,
    });
    setShowRegisterModal(false);
  };

  // Handler para cuando se selecciona un producto
  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setNewMovement((prev) => ({
        ...prev,
        productId: product.id,
        productCode: product.code,
        productName: product.name,
      }));
    }
  };

  // Handler para cuando se selecciona un almacén
  const handleWarehouseChange = (warehouseId: string) => {
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    if (warehouse) {
      setNewMovement((prev) => ({
        ...prev,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Movimientos</h2>
          <p className="text-gray-600 mt-1">
            {filteredMovements.length} de {movements.length} movimientos
          </p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar Movimiento
        </button>
      </div>

      {/* Modal de Registro */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Registrar Nuevo Movimiento
              </h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Tipo de Movimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Movimiento *
                </label>
                <select
                  value={newMovement.type}
                  onChange={(e) =>
                    setNewMovement((prev) => ({
                      ...prev,
                      type: e.target.value as MovementType,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                  <option value="ajuste">Ajuste</option>
                  <option value="reintegro">Reintegro</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>

              {/* Producto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producto *
                </label>
                <select
                  value={newMovement.productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Almacén */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Almacén *
                </label>
                <select
                  value={newMovement.warehouseId}
                  onChange={(e) => handleWarehouseChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar almacén</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad *
                </label>
                <input
                  type="number"
                  min="1"
                  value={newMovement.quantity}
                  onChange={(e) =>
                    setNewMovement((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Motivo */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo *
                </label>
                <textarea
                  value={newMovement.reason}
                  onChange={(e) =>
                    setNewMovement((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  placeholder="Describe el motivo del movimiento..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRegisterModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterMovement}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Registrar Movimiento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resto del código existente (Estadísticas, Filtros, Tabla) */}
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Entradas</div>
              <div className="text-2xl text-gray-900 mt-1">{totalEntradas}</div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowDown className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Salidas</div>
              <div className="text-2xl text-gray-900 mt-1">{totalSalidas}</div>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <ArrowUp className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Pendientes</div>
              <div className="text-2xl text-gray-900 mt-1">
                {totalPendientes}
              </div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="lg:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filtro por tipo */}
          <select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as MovementType | "all")
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
            <option value="reintegro">Reintegros</option>
            <option value="ajuste">Ajustes</option>
            <option value="transferencia">Transferencias</option>
          </select>

          {/* Filtro por estado */}
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as MovementStatus | "all")
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado">Rechazados</option>
          </select>

          {/* Filtro por almacén */}
          {currentUser.role === "super_admin" && (
            <select
              value={filterWarehouse}
              onChange={(e) => setFilterWarehouse(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los almacenes</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tabla de movimientos */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                {currentUser.role === "super_admin" && (
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    Almacén
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Responsable
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMovements.map((movement) => {
                const warehouse = warehouses.find(
                  (w) => w.id === movement.warehouseId
                );

                return (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{new Date(movement.date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(movement.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full ${getTypeColor(
                          movement.type
                        )}`}
                      >
                        {getTypeIcon(movement.type)}
                        {movement.type.charAt(0).toUpperCase() +
                          movement.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {movement.productName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {movement.productCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm ${
                          movement.type === "entrada"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {movement.type === "entrada" ? "+" : "-"}
                        {Math.abs(movement.quantity)}
                      </span>
                    </td>
                    {currentUser.role === "super_admin" && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs"
                          style={{
                            backgroundColor: `${warehouse?.color}20`,
                            color: warehouse?.color,
                          }}
                        >
                          {movement.warehouseName}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {movement.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {movement.responsibleUser}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full ${getStatusColor(
                          movement.status
                        )}`}
                      >
                        {getStatusIcon(movement.status)}
                        {movement.status.charAt(0).toUpperCase() +
                          movement.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {movement.status === "pendiente" &&
                        currentUser.role === "super_admin" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => approveMovement(movement.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Aprobar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => rejectMovement(movement.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Rechazar"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      {movement.status !== "pendiente" && (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredMovements.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <RefreshCw className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <div>No se encontraron movimientos</div>
            <div className="text-sm mt-1">
              Intenta ajustar los filtros de búsqueda
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
