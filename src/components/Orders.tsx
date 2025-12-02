import React, { useState, useMemo } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { createNotification } from "../services/notifications";
import {
  Order,
  Product,
  Movement,
  User,
  Notification,
  OrderItem,
} from "../types";

type Props = {
  currentUser: User;
  products: Product[];
  setProducts: (p: Product[] | ((prev: Product[]) => Product[])) => void;
  movements: Movement[];
  setMovements: (m: Movement[] | ((prev: Movement[]) => Movement[])) => void;
  orders: Order[];
  setOrders: (o: Order[] | ((prev: Order[]) => Order[])) => void;
  setNotifications?: (
    n: Notification[] | ((prev: Notification[]) => Notification[])
  ) => void;
};

export default function Orders({
  currentUser,
  products,
  movements,
  setMovements,
  orders,
  setOrders,
  setNotifications,
}: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionType, setActionType] = useState<
    "approve" | "reject" | "observe" | "accept"
  >("approve");
  const [actionNotes, setActionNotes] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Create Modal State
  const [createFormData, setCreateFormData] = useState({
    priority: "media" as const,
    glosa: "",
    items: [] as Array<{ productId: string; quantity: number }>,
  });
  const [expandedDetails, setExpandedDetails] = useState<string | null>(null);

  // Role checks
  const isAP =
    currentUser.role === "super_admin" || currentUser.warehouseId === "w1";
  const isSA =
    currentUser.role === "warehouse_user" && currentUser.warehouseId !== "w1";

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return (orders || []).filter((order) => {
      const matchesSearch =
        order.opNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.requester?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || order.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || order.priority === priorityFilter;
      return matchesSearch && matchesType && matchesStatus && matchesPriority;
    });
  }, [orders, searchTerm, typeFilter, statusFilter, priorityFilter]);

  // Handlers
  const handleCreateOrder = () => {
    if (createFormData.items.length === 0) {
      alert("Agrega al menos un ítem");
      return;
    }

    const opNumber = `OP-${String(orders.length + 1).padStart(4, "0")}`;
    const newOrder: Order = {
      id: opNumber,
      opNumber,
      type: "OP",
      status: "pendiente",
      requester: currentUser.name,
      requesterId: currentUser.id,
      originWarehouseId: currentUser.warehouseId || "w1",
      originWarehouseName: currentUser.warehouseName || "Almacén Central",
      destinationWarehouseId: currentUser.warehouseId || "w1",
      destinationWarehouseName: currentUser.warehouseName || "Almacén Central",
      priority: createFormData.priority,
      glosa: createFormData.glosa,
      requestDate: new Date().toISOString(),
      items: createFormData.items.map((item, idx) => {
        const product = products.find((p) => String(p.id) === item.productId);
        return {
          itemNumber: idx + 1,
          productId: item.productId,
          productCode: product?.code || "",
          productName: product?.name || "",
          description: product?.name,
          requestedQuantity: item.quantity,
          approvedQuantity: 0,
          receivedQuantity: 0,
          unit: product?.unit || "u",
          status: "pendiente" as const,
          category: product?.category || "",
          observations: "",
        };
      }),
    };

    setOrders((o) => [newOrder, ...(o || [])]);
    setShowCreateModal(false);
    setCreateFormData({ priority: "media", glosa: "", items: [] });

    const note = createNotification({
      type: "solicitud_compra",
      title: `Nueva Orden ${opNumber}`,
      message: `Orden creada por ${currentUser.name}`,
      warehouseId: currentUser.warehouseId,
      warehouseName: currentUser.warehouseName,
      read: false,
      severity: "info",
    });
    if (setNotifications) setNotifications((n) => [note, ...(n || [])]);
  };

  const handleApproveOrder = () => {
    if (!selectedOrder) return;

    const approvedItems = selectedOrder.items.filter(
      (i) => i.status === "disponible"
    );
    if (approvedItems.length === 0) {
      alert("Marca al menos un ítem como 'disponible'");
      return;
    }

    // Update OP status
    setOrders((os) =>
      (os || []).map((o) =>
        o.id === selectedOrder.id
          ? {
              ...o,
              status: "aprobado" as const,
              approvalDate: new Date().toISOString(),
              approvedBy: currentUser.name,
              observations: actionNotes,
            }
          : o
      )
    );

    // Auto-generate OS (salida) for available items
    const osMovements: Movement[] = approvedItems.map((item, idx) => ({
      id: `OS-${selectedOrder.opNumber}-${idx}`,
      type: "salida" as const,
      productId: item.productId,
      productName: item.productName || item.description || "",
      productCode: item.productCode,
      quantity: item.approvedQuantity || item.requestedQuantity,
      warehouseId: "w1",
      warehouseName: "Almacén Central",
      destinationWarehouseId: selectedOrder.destinationWarehouseId,
      destinationWarehouseName: selectedOrder.destinationWarehouseName,
      date: new Date().toISOString(),
      reason: `Salida por OP ${selectedOrder.opNumber}`,
      responsibleUser: currentUser.name,
      status: "pendiente" as const,
    }));

    setMovements((m) => [...(m || []), ...osMovements]);

    setShowActionModal(false);
    setActionNotes("");

    const note = createNotification({
      type: "entrada_salida",
      title: `OP Aprobada: ${selectedOrder.opNumber}`,
      message: `${approvedItems.length} ítems aprobados. ${osMovements.length} Órdenes de Salida generadas.`,
      warehouseId: selectedOrder.destinationWarehouseId,
      warehouseName: selectedOrder.destinationWarehouseName,
      read: false,
      severity: "success",
    });
    if (setNotifications) setNotifications((n) => [note, ...(n || [])]);
  };

  const handleRejectOrder = () => {
    if (!selectedOrder) return;

    setOrders((os) =>
      (os || []).map((o) =>
        o.id === selectedOrder.id
          ? {
              ...o,
              status: "rechazado" as const,
              observations: actionNotes,
            }
          : o
      )
    );

    setShowActionModal(false);
    setActionNotes("");

    const note = createNotification({
      type: "rechazo",
      title: `OP Rechazada: ${selectedOrder.opNumber}`,
      message: `Orden rechazada: ${actionNotes}`,
      warehouseId: selectedOrder.destinationWarehouseId,
      warehouseName: selectedOrder.destinationWarehouseName,
      read: false,
      severity: "error",
    });
    if (setNotifications) setNotifications((n) => [note, ...(n || [])]);
  };

  const handleObserveOrder = () => {
    if (!selectedOrder) return;

    setOrders((os) =>
      (os || []).map((o) =>
        o.id === selectedOrder.id
          ? {
              ...o,
              status: "observado" as const,
              observations: actionNotes,
            }
          : o
      )
    );

    setShowActionModal(false);
    setActionNotes("");

    const note = createNotification({
      type: "observacion",
      title: `OP Observada: ${selectedOrder.opNumber}`,
      message: `Observaciones: ${actionNotes}`,
      warehouseId: selectedOrder.destinationWarehouseId,
      warehouseName: selectedOrder.destinationWarehouseName,
      read: false,
      severity: "warning",
    });
    if (setNotifications) setNotifications((n) => [note, ...(n || [])]);
  };

  const handleAcceptItem = (item: OrderItem) => {
    if (!selectedOrder) return;

    setOrders((os) =>
      (os || []).map((o) =>
        o.id === selectedOrder.id
          ? {
              ...o,
              items: o.items.map((it) =>
                it.itemNumber === item.itemNumber
                  ? {
                      ...it,
                      status: "recibido" as const,
                      receivedQuantity:
                        it.approvedQuantity || it.requestedQuantity,
                      observations: actionNotes,
                    }
                  : it
              ),
            }
          : o
      )
    );

    setShowActionModal(false);
    setActionNotes("");

    const note = createNotification({
      type: "entrada_salida",
      title: `Ítem Recibido: ${item.productName}`,
      message: `Cantidad recibida: ${
        item.approvedQuantity || item.requestedQuantity
      }`,
      warehouseId: selectedOrder.destinationWarehouseId,
      warehouseName: selectedOrder.destinationWarehouseName,
      read: false,
      severity: "success",
    });
    if (setNotifications) setNotifications((n) => [note, ...(n || [])]);
  };

  const updateItemStatus = (itemNumber: number, status: string) => {
    if (!selectedOrder) return;
    setOrders((os) =>
      (os || []).map((o) =>
        o.id === selectedOrder.id
          ? {
              ...o,
              items: o.items.map((it) =>
                it.itemNumber === itemNumber
                  ? { ...it, status: status as any }
                  : it
              ),
            }
          : o
      )
    );
  };

  const updateItemApprovedQty = (itemNumber: number, qty: number) => {
    if (!selectedOrder) return;
    setOrders((os) =>
      (os || []).map((o) =>
        o.id === selectedOrder.id
          ? {
              ...o,
              items: o.items.map((it) =>
                it.itemNumber === itemNumber
                  ? { ...it, approvedQuantity: qty }
                  : it
              ),
            }
          : o
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Órdenes de Compra</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} /> Nueva O.P.
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-4 bg-white p-4 rounded-lg border">
        <input
          type="text"
          placeholder="Buscar por OP# o solicitante..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border rounded"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="all">Todos los Tipos</option>
          <option value="OP">OP (Orden Principal)</option>
          <option value="OS">OS (Orden Salida)</option>
          <option value="OI">OI (Orden Ingreso)</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="all">Todos los Estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobado">Aprobado</option>
          <option value="observado">Observado</option>
          <option value="rechazado">Rechazado</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="all">Todas Prioridades</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">OP#</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Solicitante
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Almacén
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Prioridad
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <React.Fragment key={order.id}>
                <tr className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm font-medium">
                    {order.opNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                      {order.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{order.requester}</td>
                  <td className="px-4 py-3 text-sm">
                    {order.originWarehouseName}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        order.priority === "urgente"
                          ? "bg-red-100 text-red-800"
                          : order.priority === "alta"
                          ? "bg-orange-100 text-orange-800"
                          : order.priority === "media"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {order.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        order.status === "aprobado"
                          ? "bg-green-100 text-green-800"
                          : order.status === "pendiente"
                          ? "bg-blue-100 text-blue-800"
                          : order.status === "observado"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDetailModal(true);
                        setExpandedDetails(order.id);
                      }}
                      className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                    >
                      Ver
                    </button>
                    {isAP && order.status === "pendiente" && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setActionType("approve");
                          setShowActionModal(true);
                        }}
                        className="px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 rounded"
                      >
                        Aprobar
                      </button>
                    )}
                    {isAP &&
                      (order.status === "pendiente" ||
                        order.status === "observado") && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setActionType("reject");
                            setShowActionModal(true);
                          }}
                          className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded"
                        >
                          Rechazar
                        </button>
                      )}
                  </td>
                </tr>
                {expandedDetails === order.id && (
                  <tr className="border-t bg-gray-50">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="space-y-2">
                        <p className="text-sm">
                          <strong>Glosa:</strong> {order.glosa || "N/A"}
                        </p>
                        <table className="w-full text-sm border">
                          <thead className="bg-gray-200">
                            <tr>
                              <th className="px-2 py-1 text-left">Ítem</th>
                              <th className="px-2 py-1 text-left">Producto</th>
                              <th className="px-2 py-1 text-center">
                                Cant.Sol
                              </th>
                              <th className="px-2 py-1 text-center">
                                Cant.Aprob
                              </th>
                              <th className="px-2 py-1 text-center">UM</th>
                              <th className="px-2 py-1 text-center">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item) => (
                              <tr key={item.itemNumber} className="border-t">
                                <td className="px-2 py-1">{item.itemNumber}</td>
                                <td className="px-2 py-1">
                                  {item.description}
                                </td>
                                <td className="px-2 py-1 text-center">
                                  {item.requestedQuantity}
                                </td>
                                <td className="px-2 py-1 text-center">
                                  {item.approvedQuantity || "-"}
                                </td>
                                <td className="px-2 py-1 text-center">
                                  {item.unit}
                                </td>
                                <td className="px-2 py-1 text-center">
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${
                                      item.status === "disponible"
                                        ? "bg-green-100 text-green-800"
                                        : item.status === "compra"
                                        ? "bg-orange-100 text-orange-800"
                                        : item.status === "rechazado"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nueva Orden de Compra</h3>
              <button onClick={() => setShowCreateModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Prioridad
                </label>
                <select
                  value={createFormData.priority}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      priority: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Glosa (Observaciones)
                </label>
                <textarea
                  value={createFormData.glosa}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      glosa: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded"
                  rows={2}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Ítems</label>
                  <button
                    onClick={() =>
                      setCreateFormData({
                        ...createFormData,
                        items: [
                          ...createFormData.items,
                          { productId: products[0]?.id || "", quantity: 1 },
                        ],
                      })
                    }
                    className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    + Agregar Ítem
                  </button>
                </div>

                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-1 text-left">Producto</th>
                      <th className="px-2 py-1 text-center">Cantidad</th>
                      <th className="px-2 py-1 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {createFormData.items.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-2 py-1">
                          <select
                            value={item.productId}
                            onChange={(e) => {
                              const newItems = [...createFormData.items];
                              newItems[idx].productId = e.target.value;
                              setCreateFormData({
                                ...createFormData,
                                items: newItems,
                              });
                            }}
                            className="w-full px-2 py-1 border rounded text-xs"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={String(p.id)}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...createFormData.items];
                              newItems[idx].quantity = Number(e.target.value);
                              setCreateFormData({
                                ...createFormData,
                                items: newItems,
                              });
                            }}
                            className="w-full px-2 py-1 border rounded text-xs"
                          />
                        </td>
                        <td className="px-2 py-1 text-center">
                          <button
                            onClick={() => {
                              setCreateFormData({
                                ...createFormData,
                                items: createFormData.items.filter(
                                  (_, i) => i !== idx
                                ),
                              });
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-2 mt-6 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateOrder}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Crear O.P.
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Detalle OP {selectedOrder.opNumber}
              </h3>
              <button onClick={() => setShowDetailModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <strong>Solicitante:</strong> {selectedOrder.requester}
              </div>
              <div>
                <strong>Almacén:</strong> {selectedOrder.originWarehouseName}
              </div>
              <div>
                <strong>Prioridad:</strong> {selectedOrder.priority}
              </div>
              <div>
                <strong>Estado:</strong> {selectedOrder.status}
              </div>
              <div className="col-span-2">
                <strong>Glosa:</strong> {selectedOrder.glosa || "N/A"}
              </div>
            </div>

            <table className="w-full text-sm mb-4">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 text-left">#</th>
                  <th className="px-2 py-1 text-left">Producto</th>
                  <th className="px-2 py-1 text-center">Cant.Sol</th>
                  <th className="px-2 py-1 text-center">Cant.Aprob</th>
                  <th className="px-2 py-1 text-center">UM</th>
                  <th className="px-2 py-1 text-center">Estado</th>
                  {isAP && (
                    <th className="px-2 py-1 text-center">Acciones AP</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item) => (
                  <tr key={item.itemNumber} className="border-t">
                    <td className="px-2 py-1">{item.itemNumber}</td>
                    <td className="px-2 py-1">{item.description}</td>
                    <td className="px-2 py-1 text-center">
                      {item.requestedQuantity}
                    </td>
                    <td className="px-2 py-1 text-center">
                      {isAP && selectedOrder.status === "pendiente" ? (
                        <input
                          type="number"
                          min={0}
                          max={item.requestedQuantity}
                          value={item.approvedQuantity || 0}
                          onChange={(e) =>
                            updateItemApprovedQty(
                              item.itemNumber,
                              Number(e.target.value)
                            )
                          }
                          className="w-16 px-1 py-0.5 border rounded text-xs text-center"
                        />
                      ) : (
                        item.approvedQuantity || "-"
                      )}
                    </td>
                    <td className="px-2 py-1 text-center">{item.unit}</td>
                    <td className="px-2 py-1 text-center">
                      {isAP && selectedOrder.status === "pendiente" ? (
                        <select
                          value={item.status}
                          onChange={(e) =>
                            updateItemStatus(item.itemNumber, e.target.value)
                          }
                          className="px-1 py-0.5 border rounded text-xs"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="disponible">Disponible</option>
                          <option value="compra">Compra</option>
                          <option value="rechazado">Rechazado</option>
                        </select>
                      ) : (
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            item.status === "disponible"
                              ? "bg-green-100 text-green-800"
                              : item.status === "compra"
                              ? "bg-orange-100 text-orange-800"
                              : item.status === "rechazado"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      )}
                    </td>
                    {isAP && <td className="px-2 py-1 text-center">-</td>}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {actionType === "approve"
                  ? "Aprobar O.P."
                  : actionType === "reject"
                  ? "Rechazar O.P."
                  : actionType === "observe"
                  ? "Observar O.P."
                  : "Aceptar Ítem"}
              </h3>
              <button onClick={() => setShowActionModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                OP: {selectedOrder.opNumber}
              </p>

              {(actionType === "reject" ||
                actionType === "observe" ||
                actionType === "accept") && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Notas/Observaciones
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6 justify-end">
              <button
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              {actionType === "approve" && (
                <button
                  onClick={handleApproveOrder}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Aprobar
                </button>
              )}
              {actionType === "reject" && (
                <button
                  onClick={handleRejectOrder}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Rechazar
                </button>
              )}
              {actionType === "observe" && (
                <button
                  onClick={handleObserveOrder}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Observar
                </button>
              )}
              {actionType === "accept" && (
                <button
                  onClick={() => {
                    if (selectedOrder.items[0])
                      handleAcceptItem(selectedOrder.items[0]);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Aceptar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
