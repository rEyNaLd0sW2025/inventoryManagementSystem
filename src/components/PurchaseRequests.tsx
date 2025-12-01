import { useState } from "react";
import {
  Plus,
  Search,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Package,
  Pause,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
  Warehouse,
  Building,
  Factory,
  Store,
  Check,
  X,
  Eye,
  FileText,
  ShoppingBag,
  Truck,
  PackageCheck,
  PackageX,
} from "lucide-react";

import { PurchaseRequest, RequestStatus, User, Notification } from "../types";
import { warehouses, products } from "../data/mockData";
import { createNotification } from "../services/notifications";

// Utilidades
import {
  getStatusIcon,
  getStatusColor,
  getStatusLabel,
  getUrgencyColor,
  getUrgencyLabel,
  calculateRequestTotal,
  classifyRequest,
  findSimilarRequests,
  canDelete,
  sortRequestsByUrgencyAndDate,
  calculateRequestStats,
  validatePurchaseRequest,
} from "../utils/purchaseRequestUtils";

import {
  usePurchaseRequestFiltering,
  usePurchaseRequestModals,
  usePurchaseRequestForm,
} from "../hooks/usePurchaseRequests";

import {
  handleApproveRequest,
  handleRejectRequest,
  handleObserveRequest,
  handlePutOnHoldRequest,
  handleUnifyRequests,
} from "../utils/purchaseRequestHandlers";

import {
  addItem,
  removeItem,
  updateItem,
  calculateItemsTotal,
} from "../utils/itemUtils";

interface PurchaseRequestsProps {
  onNavigate: (page: string, data?: any) => void;
  currentUser: User;
  requests: PurchaseRequest[];
  setRequests: (
    r: PurchaseRequest[] | ((prev: PurchaseRequest[]) => PurchaseRequest[])
  ) => void;
  setNotifications?: (
    n: Notification[] | ((prev: Notification[]) => Notification[])
  ) => void;
  products?: any[];
  setProducts?: (p: any[] | ((prev: any[]) => any[])) => void;
  movements?: any[];
  setMovements?: (m: any[] | ((prev: any[]) => any[])) => void;
  orders?: any[];
  setOrders?: (o: any[] | ((prev: any[]) => any[])) => void;
}

/**
 * COMPONENTE PRINCIPAL: Solicitudes de Compra
 * Responsabilidad: Renderización, orquestación de modales
 * Lógica: Delegada a hooks y utils
 */
export function PurchaseRequests({
  onNavigate,
  currentUser,
  requests,
  setRequests,
  setNotifications,
  products: productsProp,
  setProducts: setProductsProp,
  movements: movementsProp,
  setMovements: setMovementsProp,
  orders: ordersProp,
  setOrders: setOrdersProp,
}: PurchaseRequestsProps) {
  // ====== HOOKS REUTILIZABLES ======
  const {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterUrgency,
    setFilterUrgency,
    filteredRequests,
    userRequests,
  } = usePurchaseRequestFiltering(requests, currentUser);

  const {
    showCreateModal,
    setShowCreateModal,
    showActionModal,
    setShowActionModal,
    selectedRequest,
    setSelectedRequest,
    actionNotes,
    setActionNotes,
    openActionModal,
    closeActionModal,
  } = usePurchaseRequestModals();

  const {
    editingRequest,
    form,
    setForm,
    expandedRequests,
    toggleRequestDetails,
    openEditModal,
    openCreateModal,
    closeModal,
    handleFormChange,
  } = usePurchaseRequestForm();

  // ====== NUEVOS ESTADOS PARA VERIFICACIÓN DE STOCK ======
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockVerificationData, setStockVerificationData] = useState<any>(null);
  const [selectedRequestForStock, setSelectedRequestForStock] =
    useState<PurchaseRequest | null>(null);

  // ====== DATOS PROCESADOS ======
  const sortedRequests = sortRequestsByUrgencyAndDate(filteredRequests);
  const stats = calculateRequestStats(userRequests);

  // ====== FUNCIONES DE VERIFICACIÓN DE STOCK ======

  /**
   * Obtiene stock disponible en Almacén Principal y SubAlmacenes
   */
  const getStockDataForRequest = (request: PurchaseRequest) => {
    // Buscar el producto en los datos mock
    const productList = productsProp ?? products;
    const product = productList.find(
      (p) =>
        p.id === request.productId ||
        p.code === request.productCode ||
        p.name === request.productName
    );

    // Si no se encuentra el producto exacto, buscar por nombre similar
    let mainWarehouseStock = 0;
    let subWarehousesStock: Array<{ id: string; name: string; stock: number }> =
      [];

    if (product) {
      // Stock en Almacén Principal (almacén w1)
      mainWarehouseStock =
        product.warehouseId === "w1" ? product.currentStock : 0;

      // Stock en otros almacenes (SubAlmacenes)
      subWarehousesStock = productList
        .filter(
          (p) =>
            (p.id === request.productId ||
              p.code === request.productCode ||
              p.name === request.productName) &&
            p.warehouseId !== "w1" &&
            p.currentStock > 0
        )
        .map((p) => ({
          id: p.warehouseId,
          name: p.warehouseName,
          stock: p.currentStock,
        }));
    }

    // Si no hay producto en el sistema, usar datos por defecto según el ejemplo
    if (!product) {
      // Ejemplo 1: Producto con stock suficiente (para probar OS)
      if (request.quantity <= 1000) {
        mainWarehouseStock = 1500;
        subWarehousesStock = [
          { id: "w2", name: "Almacén de Producción", stock: 800 },
          { id: "w3", name: "Almacén de Mantenimiento", stock: 300 },
        ];
      }
      // Ejemplo 2: Producto con stock insuficiente (para probar OC)
      else {
        mainWarehouseStock = 100;
        subWarehousesStock = [
          { id: "w2", name: "Almacén de Producción", stock: 50 },
          { id: "w4", name: "Almacén de TI", stock: 75 },
        ];
      }
    }

    const isSufficient = mainWarehouseStock >= request.quantity;
    const missingQuantity = isSufficient
      ? 0
      : request.quantity - mainWarehouseStock;

    return {
      request,
      mainWarehouseStock,
      subWarehousesStock,
      isSufficient,
      missingQuantity,
      comparison: {
        requested: request.quantity,
        available: mainWarehouseStock,
        difference: request.quantity - mainWarehouseStock,
        percentage: Math.min(
          100,
          (mainWarehouseStock / request.quantity) * 100
        ),
      },
    };
  };

  /**
   * Abre modal de verificación de stock
   */
  const openStockVerificationModal = (request: PurchaseRequest) => {
    setSelectedRequestForStock(request);
    const stockData = getStockDataForRequest(request);
    setStockVerificationData(stockData);
    setShowStockModal(true);
  };

  /**
   * Generar Orden de Salida (cuando hay stock suficiente)
   */
  const handleGenerateOutputOrder = () => {
    if (!selectedRequestForStock) return;

    // Actualizar estado de la solicitud
    const updatedRequests = requests.map((r) =>
      r.id === selectedRequestForStock.id
        ? {
            ...r,
            status: "en_curso" as RequestStatus,
            reviewedBy: currentUser.name,
            reviewDate: new Date().toISOString(),
            reviewNotes: `Orden de Salida generada - Stock AP: ${stockVerificationData?.mainWarehouseStock}, Solicitado: ${selectedRequestForStock.quantity}`,
            stockStatus: {
              previousStock: stockVerificationData?.mainWarehouseStock,
              newStock:
                stockVerificationData?.mainWarehouseStock -
                selectedRequestForStock.quantity,
              updatedAt: new Date().toISOString(),
            },
          }
        : r
    );

    setRequests(updatedRequests);

    // Crear notificación
    const notif = createNotification({
      type: "solicitud_compra", // Usar "solicitud_compra" que sí existe
      title: "✅ Orden de Salida generada",
      message: `Se generó OS para ${selectedRequestForStock.productName} (${selectedRequestForStock.quantity} unidades)`,
      warehouseId: selectedRequestForStock.warehouseId,
      warehouseName: selectedRequestForStock.warehouseName,
      read: false,
      relatedId: selectedRequestForStock.id,
      severity: "success",
    });

    if (setNotifications) setNotifications((prev) => [notif, ...prev]);
    // Crear movimientos OS (salida) y OI (ingreso) para el flujo de transferencias
    try {
      const osId = `OS-${selectedRequestForStock.id}-${Date.now()}`;
      const oiId = `OI-${selectedRequestForStock.id}-${Date.now()}`;

      const os = {
        id: osId,
        type: "salida",
        productId: selectedRequestForStock.productId || "",
        productName: selectedRequestForStock.productName,
        productCode: selectedRequestForStock.productCode || "",
        quantity: selectedRequestForStock.quantity,
        warehouseId: "w1",
        warehouseName: "Almacén Principal",
        date: new Date().toISOString(),
        reason: `OS generada desde solicitud ${selectedRequestForStock.id}`,
        document: undefined,
        responsibleUser: currentUser.name,
        status: "pendiente",
        destinationWarehouseId: selectedRequestForStock.warehouseId,
        destinationWarehouseName: selectedRequestForStock.warehouseName,
      };

      const oi = {
        id: oiId,
        type: "entrada",
        productId: selectedRequestForStock.productId || "",
        productName: selectedRequestForStock.productName,
        productCode: selectedRequestForStock.productCode || "",
        quantity: selectedRequestForStock.quantity,
        warehouseId: "w1",
        warehouseName: "Almacén Principal",
        date: new Date().toISOString(),
        reason: `OI generada desde solicitud ${selectedRequestForStock.id}`,
        document: undefined,
        responsibleUser: currentUser.name,
        status: "pendiente",
        destinationWarehouseId: selectedRequestForStock.warehouseId,
        destinationWarehouseName: selectedRequestForStock.warehouseName,
      };

      if (setMovementsProp)
        setMovementsProp((prev: any) => [os, oi, ...(prev || [])]);

      // Registrar una orden OP relacionada (si aplica)
      if (setOrdersProp) {
        const newOrder = {
          id: `op_${selectedRequestForStock.id}`,
          opNumber: `OP-${Date.now()}`,
          requester: selectedRequestForStock.requestedBy || currentUser.name,
          requesterId: selectedRequestForStock.requestedBy || "",
          warehouseId: selectedRequestForStock.warehouseId,
          warehouseName: selectedRequestForStock.warehouseName,
          requestDate: new Date().toISOString(),
          items: (selectedRequestForStock.items || []).map(
            (it: any, i: number) => ({
              itemNumber: i + 1,
              productId: it.productId,
              description: it.description,
              unit: it.unit,
              quantity: it.quantity,
              approvedQuantity: it.quantity,
              status: "disponible",
            })
          ),
          priority: selectedRequestForStock.urgency || "media",
          status: "procesada",
          generatedOS: [osId],
          generatedOI: [oiId],
        };
        setOrdersProp((prev: any) => [newOrder, ...(prev || [])]);
      }

      setShowStockModal(false);
      alert(
        `✅ Orden de Salida generada exitosamente para: ${selectedRequestForStock.productName}`
      );
    } catch (e) {
      // si falla la creación de movimientos, al menos cerramos modal
      setShowStockModal(false);
      alert("Error al generar documentos. Revisa la consola.");
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  /**
   * Generar Orden de Compra (cuando NO hay stock suficiente)
   */
  const handleGeneratePurchaseOrder = () => {
    if (!selectedRequestForStock) return;

    // Actualizar estado de la solicitud
    const updatedRequests = requests.map((r) =>
      r.id === selectedRequestForStock.id
        ? {
            ...r,
            status: "en_proceso_compra" as RequestStatus,
            reviewedBy: currentUser.name,
            reviewDate: new Date().toISOString(),
            reviewNotes: `Orden de Compra generada - Faltan ${stockVerificationData?.missingQuantity} unidades en AP`,
            purchaseOrderData: {
              missingQuantity: stockVerificationData?.missingQuantity,
              generatedAt: new Date().toISOString(),
              estimatedCost:
                stockVerificationData?.missingQuantity *
                (selectedRequestForStock.items?.[0]?.unitPrice || 0),
            },
          }
        : r
    );

    setRequests(updatedRequests);

    // Crear notificación
    const notif = createNotification({
      type: "aprobacion",
      title: "📋 Orden de Compra generada",
      message: `Se generó OC para ${selectedRequestForStock.productName} (Faltan: ${stockVerificationData?.missingQuantity} unidades)`,
      warehouseId: selectedRequestForStock.warehouseId,
      warehouseName: selectedRequestForStock.warehouseName,
      read: false,
      relatedId: selectedRequestForStock.id,
      severity: "warning",
    });

    if (setNotifications) setNotifications((prev) => [notif, ...prev]);
    // Registrar OC como movimiento/documento en el sistema (simplificado)
    try {
      const ocId = `OC-${selectedRequestForStock.id}-${Date.now()}`;
      const oc = {
        id: ocId,
        type: "entrada",
        productId: selectedRequestForStock.productId || "",
        productName: selectedRequestForStock.productName,
        productCode: selectedRequestForStock.productCode || "",
        quantity: stockVerificationData?.missingQuantity || 0,
        warehouseId: "w1",
        warehouseName: "Almacén Principal",
        date: new Date().toISOString(),
        reason: `OC generada para solicitud ${selectedRequestForStock.id}`,
        document: ocId,
        responsibleUser: currentUser.name,
        status: "pendiente",
      };
      if (setMovementsProp)
        setMovementsProp((prev: any) => [oc, ...(prev || [])]);

      // Actualizar estado solicitd
      setShowStockModal(false);
      alert(
        `📋 Orden de Compra generada para: ${selectedRequestForStock.productName}`
      );
    } catch (e) {
      setShowStockModal(false);
      alert("Error al generar OC en el sistema.");
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  // ====== MANEJADORES EXISTENTES (MANTENIDOS SIN CAMBIOS) ======

  const handleCreateOrUpdate = () => {
    const validation = validatePurchaseRequest(form);
    if (!validation.valid) {
      alert(validation.errors.join("\n"));
      return;
    }

    const totalQuantity = (form.items || []).reduce(
      (s: any, it: any) => s + (Number(it.quantity) || 0),
      0
    );

    if (editingRequest) {
      setRequests(
        requests.map((r) =>
          r.id === editingRequest.id
            ? ({
                ...r,
                ...(form as any),
                items: form.items,
                quantity: totalQuantity,
                status: "pendiente",
                requestDate: new Date().toISOString(),
              } as PurchaseRequest)
            : r
        )
      );

      const notif = createNotification({
        type: "solicitud_compra",
        title: "Solicitud modificada",
        message: `La solicitud ${editingRequest.productName} fue modificada y reenviada.`,
        warehouseId: editingRequest.warehouseId,
        warehouseName: editingRequest.warehouseName,
        read: false,
        relatedId: editingRequest.id,
        severity: "info",
      });
      if (setNotifications)
        setNotifications((prev: Notification[]) => [notif, ...prev]);
    } else {
      const newReq: PurchaseRequest = {
        id: `pr_${Date.now()}`,
        productId: form.productId,
        productName: form.items?.[0]?.description || "Solicitud múltiple",
        productCode: form.productCode,
        quantity: totalQuantity,
        items: form.items,
        warehouseId: form.warehouseId as string,
        warehouseName:
          warehouses.find((w) => w.id === form.warehouseId)?.name ||
          "Desconocido",
        requestDate: new Date().toISOString(),
        reason: form.reason || "",
        urgency: (form.urgency as any) || "media",
        observations: form.observations,
        status: "pendiente",
        requestedBy: currentUser.name,
        estimatedPrice: form.estimatedPrice,
      };

      setRequests([newReq, ...requests]);

      const notif = createNotification({
        type: "solicitud_compra",
        title: "Nueva solicitud de compra",
        message: `${currentUser.name} ha creado una nueva solicitud: ${newReq.productName}`,
        warehouseId: newReq.warehouseId,
        warehouseName: newReq.warehouseName,
        read: false,
        relatedId: newReq.id,
        severity: "warning",
      });
      if (setNotifications)
        setNotifications((prev: Notification[]) => [notif, ...prev]);
    }

    setShowCreateModal(false);
    closeModal();
  };

  const handleDelete = (request: PurchaseRequest) => {
    if (!canDelete(request)) return;
    if (!confirm("¿Eliminar esta solicitud? Esta acción no se puede deshacer."))
      return;
    setRequests(requests.filter((r) => r.id !== request.id));
  };

  const handleUnify = (request: PurchaseRequest) => {
    const similar = findSimilarRequests(request, requests);
    handleUnifyRequests(request, requests, setRequests, () => similar);
    alert("Solicitudes similares marcadas como 'En Espera' y vinculadas.");
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    await handleApproveRequest({
      selectedRequest,
      currentUser,
      actionNotes,
      requests,
      setRequests,
      onNotification: (notifData) => {
        const notif = createNotification(notifData);
        if (setNotifications)
          setNotifications((prev: Notification[]) => [notif, ...prev]);
      },
      onSuccess: () => {
        closeActionModal();
        setSelectedRequest(null);
        setActionNotes("");
      },
    });
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    handleRejectRequest({
      selectedRequest,
      currentUser,
      actionNotes,
      requests,
      setRequests,
      onNotification: (notifData) => {
        const notif = createNotification(notifData);
        if (setNotifications)
          setNotifications((prev: Notification[]) => [notif, ...prev]);
      },
      onSuccess: () => {
        closeActionModal();
        setSelectedRequest(null);
        setActionNotes("");
      },
    });
  };

  const handleObserve = () => {
    if (!selectedRequest) return;
    handleObserveRequest({
      selectedRequest,
      currentUser,
      actionNotes,
      requests,
      setRequests,
      onNotification: (notifData) => {
        const notif = createNotification(notifData);
        if (setNotifications)
          setNotifications((prev: Notification[]) => [notif, ...prev]);
      },
      onSuccess: () => {
        closeActionModal();
        setSelectedRequest(null);
        setActionNotes("");
      },
    });
  };

  const handlePutOnHold = () => {
    if (!selectedRequest) return;
    handlePutOnHoldRequest({
      selectedRequest,
      currentUser,
      actionNotes,
      requests,
      setRequests,
      onNotification: (notifData) => {
        const notif = createNotification(notifData);
        if (setNotifications) setNotifications((p) => [notif, ...p]);
      },
      onSuccess: () => {
        closeActionModal();
        setSelectedRequest(null);
        setActionNotes("");
      },
    });
  };

  // ====== RENDERIZACIÓN ======

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {currentUser.role === "super_admin"
              ? "Cola de Revisión de Ordenes de Pedido"
              : "Mis Solicitudes de Ordenes de Pedido"}
          </h2>
          <p className="text-gray-600 mt-1">
            {currentUser.role === "super_admin"
              ? `${filteredRequests.length} solicitudes en revisión`
              : `${filteredRequests.length} de ${userRequests.length} solicitudes`}
          </p>
        </div>
        <button
          onClick={() => {
            openCreateModal();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Solicitud
        </button>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Pendientes"
          value={stats.totalPendientes}
          icon={Clock}
          bgColor="bg-yellow-100"
          textColor="text-yellow-600"
        />
        <StatCard
          label="Aprobadas"
          value={stats.totalAprobadas}
          icon={CheckCircle}
          bgColor="bg-green-100"
          textColor="text-green-600"
        />
        <StatCard
          label="Observadas"
          value={stats.totalObservadas}
          icon={Edit}
          bgColor="bg-orange-100"
          textColor="text-orange-600"
        />
        <StatCard
          label="En Espera"
          value={stats.totalEnEspera}
          icon={Pause}
          bgColor="bg-gray-100"
          textColor="text-gray-600"
        />
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar solicitudes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as RequestStatus | "all")
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="urgente">Urgentes</option>
            <option value="observada">Observadas</option>
            <option value="en_espera">En Espera</option>
            <option value="aprobado">Aprobadas</option>
            <option value="rechazado">Rechazadas</option>
            <option value="en_proceso_compra">En Proceso</option>
            <option value="cerrada">Cerradas</option>
          </select>

          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tipo de Prioridad</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>

      {/* LISTA DE SOLICITUDES */}
      <div className="space-y-4">
        {sortedRequests.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <div className="text-gray-700">No se encontraron solicitudes</div>
            <div className="text-sm mt-1 text-gray-500">
              {currentUser.role === "super_admin"
                ? "No hay solicitudes pendientes de revisión"
                : "No tienes solicitudes. Crea una nueva para comenzar"}
            </div>
          </div>
        ) : (
          sortedRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              currentUser={currentUser}
              isExpanded={expandedRequests.has(request.id)}
              onToggleExpand={() => toggleRequestDetails(request.id)}
              onEdit={() => {
                openEditModal(request);
                setShowCreateModal(true);
              }}
              onDelete={() => handleDelete(request)}
              onApprove={() => openActionModal("aprobar", request)}
              onReject={() => openActionModal("rechazar", request)}
              onObserve={() => openActionModal("observar", request)}
              onPutOnHold={() => openActionModal("espera", request)}
              onUnify={() => handleUnify(request)}
              onVerifyStock={() => openStockVerificationModal(request)}
              similarRequests={findSimilarRequests(request, requests)}
            />
          ))
        )}
      </div>

      {/* MODAL DE VERIFICACIÓN DE STOCK (NUEVO) */}
      {showStockModal && stockVerificationData && (
        <StockVerificationModal
          stockData={stockVerificationData}
          onGenerateOS={handleGenerateOutputOrder}
          onGenerateOC={handleGeneratePurchaseOrder}
          onCancel={() => setShowStockModal(false)}
        />
      )}

      {/* MODAL DE ACCIONES (EXISTENTE) */}
      {showActionModal && selectedRequest && (
        <ActionModal
          action={showActionModal}
          selectedRequest={selectedRequest}
          actionNotes={actionNotes}
          setActionNotes={setActionNotes}
          onConfirm={() => {
            if (showActionModal === "aprobar") handleApprove();
            else if (showActionModal === "rechazar") handleReject();
            else if (showActionModal === "observar") handleObserve();
            else if (showActionModal === "espera") handlePutOnHold();
          }}
          onCancel={closeActionModal}
          isApproving={showActionModal === "aprobar"}
        />
      )}

      {/* MODAL CREAR/EDITAR (EXISTENTE) */}
      {showCreateModal && (
        <CreateEditModal
          isEditing={!!editingRequest}
          form={form}
          onFormChange={handleFormChange}
          onAddItem={() =>
            setForm((prev) => ({
              ...prev,
              items: addItem(prev.items || []),
            }))
          }
          onUpdateItem={(idx: number, key: string, value: any) =>
            setForm((prev) => ({
              ...prev,
              items: updateItem(prev.items || [], idx, key, value),
            }))
          }
          onRemoveItem={(idx: number) =>
            setForm((prev) => ({
              ...prev,
              items: removeItem(prev.items || [], idx),
            }))
          }
          onSubmit={handleCreateOrUpdate}
          onCancel={() => {
            setShowCreateModal(false);
            closeModal();
          }}
        />
      )}
    </div>
  );
}

// ====== COMPONENTES AUXILIARES (MANTENIDOS Y AÑADIDOS) ======

/**
 * Tarjeta de estadística
 */
function StatCard({
  label,
  value,
  icon: IconComponent,
  bgColor,
  textColor,
}: {
  label: string;
  value: number;
  icon: any;
  bgColor: string;
  textColor: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-2xl text-gray-900 mt-1">{value}</div>
        </div>
        <div className={`p-3 ${bgColor} rounded-lg`}>
          <IconComponent className={`w-6 h-6 ${textColor}`} />
        </div>
      </div>
    </div>
  );
}

/**
 * Tarjeta de solicitud de compra (MODIFICADA para incluir botón de verificación de stock)
 */
function RequestCard({
  request,
  currentUser,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onObserve,
  onPutOnHold,
  onUnify,
  onVerifyStock, // NUEVA PROPS
  similarRequests,
}: any) {
  const warehouse = warehouses.find((w) => w.id === request.warehouseId);
  const requestTotal = calculateRequestTotal(request);
  const hasItems = request.items && request.items.length > 0;
  const StatusIconComponent = getStatusIcon(request.status);

  return (
    <div
      className={`bg-white rounded-lg border-2 ${getStatusColor(
        request.status
      )} p-6 hover:shadow-md transition-shadow`}
    >
      {/* ENCABEZADO */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="text-gray-900 font-semibold">
              {request.productName}
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
              <StatusIconComponent className="w-3 h-3" />
              {getStatusLabel(request.status)}
            </span>
            <span
              className={`inline-flex px-2 py-1 text-xs rounded-full ${getUrgencyColor(
                request.urgency
              )}`}
            >
              {getUrgencyLabel(request.urgency)}
            </span>
            <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              {classifyRequest(request) === "mayor" ? "Entrada" : "Salida"}
            </span>
            {similarRequests.length > 0 &&
              currentUser.role === "super_admin" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">
                  <Copy className="w-3 h-3" />
                  {similarRequests.length} similar
                </span>
              )}
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <div>
              <span className="font-medium">Total: </span>$
              {requestTotal.toFixed(2)}
            </div>
            {hasItems && (
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  Ítems: {request.items?.length}
                </span>
                <button
                  onClick={onToggleExpand}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" /> Ocultar
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" /> Ver
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500">Fecha</div>
          <div className="text-sm text-gray-900">
            {new Date(request.requestDate).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* ÍTEMS EXPANDIDOS */}
      {isExpanded && hasItems && (
        <ItemsTable items={request.items} total={requestTotal} />
      )}

      {/* ALMACÉN */}
      <div className="mb-4">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
          style={{
            backgroundColor: `${warehouse?.color}20`,
            color: warehouse?.color,
          }}
        >
          <Package className="w-4 h-4" />
          {request.warehouseName}
        </div>
      </div>

      {/* MOTIVO */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-500 mb-1">Motivo</div>
        <div className="text-sm text-gray-900">{request.reason}</div>
      </div>

      {/* INFORMACIÓN DE REVISIÓN */}
      {request.reviewedBy && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">
            Revisado por {request.reviewedBy} -{" "}
            {new Date(request.reviewDate).toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-900">{request.reviewNotes}</div>
        </div>
      )}

      {/* ALERTAS DE SIMILARES */}
      {similarRequests.length > 0 && currentUser.role === "super_admin" && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="text-xs text-amber-700 mb-1">
                  Compra similar detectada
                </div>
                {/* <button
                  onClick={onUnify}
                  className="text-xs text-amber-800 underline hover:text-amber-900"
                >
                  Unificar
                </button> */}
              </div>
              <div className="text-sm text-amber-900">
                {similarRequests.map((sr: any) => (
                  <div key={sr.id}>
                    • {sr.warehouseName} - {sr.quantity} unidades
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTÓN DE VERIFICACIÓN DE STOCK (NUEVO - solo para super_admin con solicitudes pendientes/urgentes) */}
      {currentUser.role === "super_admin" &&
        (request.status === "pendiente" || request.status === "urgente") && (
          <div className="mb-4">
            <button
              onClick={() => onVerifyStock(request)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PackageCheck className="w-4 h-4" />
              Verificar Stock en Almacén Principal
            </button>
          </div>
        )}

      {/* ACCIONES SUPER ADMIN */}
      {currentUser.role === "super_admin" &&
        (request.status === "pendiente" || request.status === "urgente") && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={onApprove}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Aprobar
            </button>
            {/* <button
              onClick={onObserve}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Observar
            </button>
            <button
              onClick={onPutOnHold}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Pause className="w-4 h-4" />
              En Espera
            </button> */}
            <button
              onClick={onReject}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Rechazar
            </button>
          </div>
        )}

      {/* ACCIONES DEL ALMACÉN */}
      {currentUser.role === "warehouse_user" &&
        request.status === "observada" && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={onEdit}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Edit className="w-4 h-4" />
              Corregir y Reenviar
            </button>
          </div>
        )}

      {/* ELIMINAR */}
      {currentUser.role === "warehouse_user" && canDelete(request) && (
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onDelete}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
          >
            <XCircle className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Tabla de ítems
 */
function ItemsTable({ items, total }: { items: any; total: number }) {
  return (
    <div className="mb-4 border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <h4 className="font-medium text-gray-900 text-sm">Detalles de Ítems</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left font-medium text-gray-700">#</th>
              <th className="p-3 text-left font-medium text-gray-700">
                Código
              </th>
              <th className="p-3 text-left font-medium text-gray-700">
                Descripción
              </th>
              <th className="p-3 text-left font-medium text-gray-700">
                Unidad
              </th>
              <th className="p-3 text-right font-medium text-gray-700">
                Cant.
              </th>
              <th className="p-3 text-right font-medium text-gray-700">
                Precio u.
              </th>
              <th className="p-3 text-right font-medium text-gray-700">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: any, idx: number) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                <td className="p-3 text-gray-600">{it.itemNumber}</td>
                <td className="p-3 text-gray-900">{it.productCode || "N/A"}</td>
                <td className="p-3 text-gray-900">{it.description || "—"}</td>
                <td className="p-3 text-gray-600">{it.unit || "—"}</td>
                <td className="p-3 text-right text-gray-900">{it.quantity}</td>
                <td className="p-3 text-right text-gray-900">
                  ${(it.unitPrice || 0).toFixed(2)}
                </td>
                <td className="p-3 text-right font-medium text-green-700">
                  ${(it.subtotal || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t">
            <tr>
              <td
                colSpan={6}
                className="p-3 text-right font-medium text-gray-700"
              >
                Total:
              </td>
              <td className="p-3 text-right font-bold text-lg text-green-700">
                ${total.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/**
 * Modal de acciones (Aprobar/Rechazar/etc.)
 */
function ActionModal({
  action,
  selectedRequest,
  actionNotes,
  setActionNotes,
  onConfirm,
  onCancel,
  isApproving,
}: any) {
  const labels: Record<string, string> = {
    aprobar: "Aprobar Solicitud",
    rechazar: "Rechazar Solicitud",
    observar: "Observar Solicitud",
    espera: "Poner en Espera",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {labels[action]}
        </h3>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Solicitud</div>
          <div className="text-gray-900 font-medium">
            {selectedRequest.productName}
          </div>
          <div className="text-sm text-gray-600">
            Cantidad: {selectedRequest.quantity} | Almacén:{" "}
            {selectedRequest.warehouseName}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-2">
            {isApproving ? "Notas (opcional)" : "Motivo (obligatorio)"}
          </label>
          <textarea
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            placeholder={
              isApproving ? "Agrega comentarios..." : "Explica el motivo..."
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!isApproving && !actionNotes.trim()}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              action === "aprobar"
                ? "bg-green-600 hover:bg-green-700"
                : action === "rechazar"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-orange-600 hover:bg-orange-700"
            }`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal Crear/Editar Solicitud
 */
function CreateEditModal({
  isEditing,
  form,
  onFormChange,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onSubmit,
  onCancel,
}: any) {
  const items = form.items || [];
  const itemsTotal = calculateItemsTotal(items);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {isEditing ? "Editar Solicitud" : "Orden de Pedido"}
        </h3>

        {/* CAMPOS BÁSICOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Almacén Solicitante*
            </label>
            <select
              value={form.warehouseId ?? ""}
              onChange={(e) => onFormChange("warehouseId", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Selecciona almacén</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Prioridad *
            </label>
            <select
              value={form.urgency ?? "media"}
              onChange={(e) => onFormChange("urgency", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Motivo *</label>
            <input
              value={form.reason ?? ""}
              onChange={(e) => onFormChange("reason", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Describe el motivo..."
            />
          </div>
        </div>

        {/* TABLA DE ÍTEMS */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Ítems *</h4>
            <button
              onClick={onAddItem}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-medium text-gray-700">#</th>
                  <th className="p-3 text-left font-medium text-gray-700">
                    Código
                  </th>
                  <th className="p-3 text-left font-medium text-gray-700">
                    Item
                  </th>
                  <th className="p-3 text-left font-medium text-gray-700">
                    Unidad de Medida
                  </th>
                  <th className="p-3 text-right font-medium text-gray-700">
                    Cant.
                  </th>
                  <th className="p-3 text-right font-medium text-gray-700">
                    Precio u.
                  </th>
                  <th className="p-3 text-right font-medium text-gray-700">
                    Subtotal
                  </th>
                  <th className="p-3 text-center font-medium text-gray-700">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-gray-500">
                      No hay ítems. Haz clic en "Agregar" para crear uno.
                    </td>
                  </tr>
                ) : (
                  items.map((it: any, idx: number) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="p-3 text-gray-600">{it.itemNumber}</td>
                      <td className="p-3">
                        <input
                          value={it.productCode || ""}
                          onChange={(e) =>
                            onUpdateItem(idx, "productCode", e.target.value)
                          }
                          className="w-20 px-2 py-1 border rounded"
                          placeholder="Código"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          value={it.description || ""}
                          onChange={(e) =>
                            onUpdateItem(idx, "description", e.target.value)
                          }
                          className="w-full px-2 py-1 border rounded"
                          placeholder="Descripción"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          value={it.unit || ""}
                          onChange={(e) =>
                            onUpdateItem(idx, "unit", e.target.value)
                          }
                          className="w-16 px-2 py-1 border rounded"
                          placeholder="Unidad"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          value={it.quantity}
                          onChange={(e) =>
                            onUpdateItem(
                              idx,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                          className="w-16 px-2 py-1 border rounded text-right"
                          min="1"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={it.unitPrice || ""}
                          onChange={(e) =>
                            onUpdateItem(
                              idx,
                              "unitPrice",
                              Number(e.target.value)
                            )
                          }
                          className="w-20 px-2 py-1 border rounded text-right"
                        />
                      </td>
                      <td className="p-3 text-right font-medium text-green-700">
                        ${(it.subtotal || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onRemoveItem(idx)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {items.length > 0 && (
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan={6} className="p-3 text-right font-medium">
                      Total:
                    </td>
                    <td className="p-3 text-right font-bold text-lg text-green-700">
                      ${itemsTotal.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* OBSERVACIONES */}
        <div className="mb-6">
          <label className="block text-sm text-gray-600 mb-2">
            Observaciones (opcional)
          </label>
          <textarea
            value={form.observations ?? ""}
            onChange={(e) => onFormChange("observations", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Agrega observaciones..."
          />
        </div>

        {/* ACCIONES */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={
              !form.warehouseId || !form.items || form.items.length === 0
            }
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? "Guardar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * NUEVO COMPONENTE: Modal de Verificación de Stock
 */
function StockVerificationModal({
  stockData,
  onGenerateOS,
  onGenerateOC,
  onCancel,
}: {
  stockData: any;
  onGenerateOS: () => void;
  onGenerateOC: () => void;
  onCancel: () => void;
}) {
  const {
    request,
    mainWarehouseStock,
    subWarehousesStock,
    isSufficient,
    missingQuantity,
    comparison,
  } = stockData;

  const getWarehouseIcon = (warehouseName: string) => {
    const icons: Record<string, any> = {
      Producción: <Factory className="w-5 h-5 text-blue-600" />,
      Mantenimiento: <Building className="w-5 h-5 text-green-600" />,
      TI: <Warehouse className="w-5 h-5 text-purple-600" />,
      Calidad: <Store className="w-5 h-5 text-pink-600" />,
    };

    for (const key in icons) {
      if (warehouseName.includes(key)) {
        return icons[key];
      }
    }

    return <Warehouse className="w-5 h-5 text-gray-600" />;
  };

  const getStatusColor = (sufficient: boolean) => {
    return sufficient ? "text-green-600" : "text-red-600";
  };

  const getStatusIcon = (sufficient: boolean) => {
    return sufficient ? (
      <PackageCheck className="w-8 h-8 text-green-600" />
    ) : (
      <PackageX className="w-8 h-8 text-red-600" />
    );
  };

  const getProgressColor = () => {
    const percentage = comparison.percentage;
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {getStatusIcon(isSufficient)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  📌 Verificación de Stock
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isSufficient
                    ? "✅ Stock suficiente - Se puede generar Orden de Salida"
                    : "❌ Stock insuficiente - Se debe generar Orden de Compra"}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="p-6 space-y-6">
          {/* RESUMEN DE LA SOLICITUD */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500">Producto</div>
                <div className="font-medium text-gray-900">
                  {request.productName}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Código</div>
                <div className="font-medium text-gray-900">
                  {request.productCode || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Almacén Solicitante</div>
                <div className="font-medium text-gray-900">
                  {request.warehouseName}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Fecha</div>
                <div className="font-medium text-gray-900">
                  {new Date(request.requestDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* COMPARACIÓN DE STOCK */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`text-2xl font-bold ${getStatusColor(
                    isSufficient
                  )}`}
                >
                  {request.quantity} unidades
                </div>
                <div className="text-sm text-gray-600">Cantidad solicitada</div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isSufficient
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {isSufficient ? "STOCK SUFICIENTE" : "STOCK INSUFICIENTE"}
              </div>
            </div>

            {/* BARRA DE PROGRESO */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Stock disponible vs Solicitado
                </span>
                <span className={`font-medium ${getStatusColor(isSufficient)}`}>
                  {comparison.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor()} transition-all duration-500`}
                  style={{ width: `${comparison.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>0 unidades</span>
                <span>{request.quantity} unidades solicitadas</span>
              </div>
            </div>

            {/* DETALLES DE STOCK */}
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`border rounded-lg p-4 ${
                  isSufficient
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">
                    Stock AP disponible
                  </div>
                  <Warehouse className="w-5 h-5 text-blue-600" />
                </div>
                <div
                  className={`text-3xl font-bold ${
                    isSufficient ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {mainWarehouseStock.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Almacén Principal
                </div>
                {isSufficient && (
                  <div className="mt-2 text-sm text-green-700">
                    ✅ Quedarán {mainWarehouseStock - request.quantity} unidades
                    después de la salida
                  </div>
                )}
              </div>

              {!isSufficient && (
                <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">Faltan</div>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-3xl font-bold text-red-700">
                    {missingQuantity.toLocaleString()}
                  </div>
                  <div className="text-sm text-red-600 mt-1">unidades</div>
                  <div className="mt-2 text-sm text-red-700">
                    ⚠️ Se necesita comprar {missingQuantity} unidades
                  </div>
                </div>
              )}
            </div>

            {/* EJEMPLO DE CÁLCULO */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <div className="font-medium text-blue-900">
                  Ejemplo de cálculo:
                </div>
              </div>
              <div className="text-sm text-blue-800">
                <div className="mb-1">
                  <span className="font-medium">Solicitado:</span>{" "}
                  {request.quantity} unidades
                </div>
                <div className="mb-1">
                  <span className="font-medium">Disponible AP:</span>{" "}
                  {mainWarehouseStock} unidades
                </div>
                <div
                  className={`font-medium ${
                    isSufficient ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {isSufficient ? (
                    <>
                      ✅ Diferencia: +{mainWarehouseStock - request.quantity}{" "}
                      unidades (Stock suficiente)
                    </>
                  ) : (
                    <>
                      ❌ Diferencia: -{missingQuantity} unidades (Falta stock)
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ALERTA SI NO HAY STOCK SUFICIENTE */}
            {!isSufficient && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-red-800">
                      Stock insuficiente en el Almacén Principal
                    </div>
                    <div className="text-sm text-red-700 mt-1">
                      No hay suficiente stock para completar la solicitud de{" "}
                      {request.quantity} unidades. Solo hay {mainWarehouseStock}{" "}
                      unidades disponibles.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STOCK EN OTROS SUBALMACENES */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">
                    Stock en otros SubAlmacenes
                  </h4>
                  <p className="text-sm text-gray-600">
                    (Solo visualización, no se descuenta automáticamente)
                  </p>
                </div>
                <Eye className="w-5 h-5 text-gray-400" />
              </div>

              {subWarehousesStock.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {subWarehousesStock.map((sub: any, index: number) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>{getWarehouseIcon(sub.name)}</div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {sub.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              SubAlmacén
                            </div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-green-700">
                          {sub.stock.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        Disponible para transferencia interna
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Warehouse className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <div>No hay stock disponible en otros subalmacenes</div>
                </div>
              )}
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
            <div className="flex justify-between gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>

              <div className="flex gap-3">
                {isSufficient ? (
                  <button
                    onClick={onGenerateOS}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Truck className="w-4 h-4" />
                    Generar Orden de Salida (OS)
                  </button>
                ) : (
                  <button
                    onClick={onGenerateOC}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Generar Orden de Compra (OC)
                  </button>
                )}

                <button
                  onClick={() => {
                    alert("Mostrando detalles completos del stock...");
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Ver detalle
                </button>
              </div>
            </div>

            {/* INFORMACIÓN ADICIONAL */}
            <div className="mt-3 text-xs text-gray-500 text-center">
              {isSufficient
                ? "✅ Se generará una Orden de Salida para despachar el producto desde el Almacén Principal"
                : "📋 Se generará una Orden de Compra para adquirir el producto faltante"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
