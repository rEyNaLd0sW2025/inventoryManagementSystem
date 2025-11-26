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
  FileText,
  TrendingUp,
  Copy,
  DollarSign,
} from "lucide-react";
import { warehouses } from "../data/mockData";
import {
  sendToPurchasingSystem,
  simulatePurchaseLifecycle,
} from "../services/purchases";
import { createNotification } from "../services/notifications";
import { PurchaseRequest, RequestStatus, User } from "../types";

interface PurchaseRequestsProps {
  onNavigate: (page: string, data?: any) => void;
  currentUser: User;
  requests: PurchaseRequest[];
  setRequests: (r: PurchaseRequest[] | ((prev: PurchaseRequest[]) => PurchaseRequest[])) => void;
}

export function PurchaseRequests({
  onNavigate,
  currentUser,
  requests,
  setRequests,
}: PurchaseRequestsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "all">(
    "all"
  );
  const [filterUrgency, setFilterUrgency] = useState<
    "all" | "baja" | "media" | "alta" | "urgente"
  >("all");
  const [selectedRequest, setSelectedRequest] =
    useState<PurchaseRequest | null>(null);
  const [showActionModal, setShowActionModal] = useState<
    "aprobar" | "rechazar" | "observar" | "espera" | null
  >(null);
  const [actionNotes, setActionNotes] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(
    null
  );
  const [form, setForm] = useState<Partial<PurchaseRequest>>({});

  // Filtrar solicitudes según el rol
  const userRequests =
    currentUser.role === "super_admin"
      ? requests
      : requests.filter((r) => r.warehouseId === currentUser.warehouseId);

  const filteredRequests = userRequests.filter((request) => {
    const matchesSearch =
      request.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.productCode &&
        request.productCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || request.status === filterStatus;
    const matchesUrgency =
      filterUrgency === "all" || request.urgency === filterUrgency;

    return matchesSearch && matchesStatus && matchesUrgency;
  });

  // Ordenar: urgentes primero, luego por fecha
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const urgencyOrder = { urgente: 0, alta: 1, media: 2, baja: 3 };
    if (a.urgency !== b.urgency) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return (
      new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
    );
  });

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case "aprobado":
        return <CheckCircle className="w-4 h-4" />;
      case "rechazado":
        return <XCircle className="w-4 h-4" />;
      case "pendiente":
        return <Clock className="w-4 h-4" />;
      case "urgente":
        return <AlertTriangle className="w-4 h-4" />;
      case "observada":
        return <Edit className="w-4 h-4" />;
      case "en_correccion":
        return <Edit className="w-4 h-4" />;
      case "en_espera":
        return <Pause className="w-4 h-4" />;
      case "en_proceso_compra":
        return <ShoppingCart className="w-4 h-4" />;
      case "cerrada":
        return <FileText className="w-4 h-4" />;
      case "cancelada":
        return <XCircle className="w-4 h-4" />;
      case "en_produccion":
        return <TrendingUp className="w-4 h-4" />;
      case "borrador":
        return <Edit className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case "aprobado":
        return "bg-green-100 text-green-800 border-green-200";
      case "rechazado":
        return "bg-red-100 text-red-800 border-red-200";
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "urgente":
        return "bg-red-100 text-red-800 border-red-200";
      case "observada":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "en_correccion":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "en_espera":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "en_proceso_compra":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cerrada":
        return "bg-gray-100 text-gray-600 border-gray-200";
      case "cancelada":
        return "bg-red-100 text-red-800 border-red-200";
      case "en_produccion":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "borrador":
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getStatusLabel = (status: RequestStatus) => {
    switch (status) {
      case "aprobado":
        return "Aprobada";
      case "rechazado":
        return "Rechazada";
      case "pendiente":
        return "Pendiente";
      case "urgente":
        return "Urgente";
      case "observada":
        return "Observada";
      case "en_correccion":
        return "En Corrección";
      case "en_espera":
        return "En Espera";
      case "en_proceso_compra":
        return "En Proceso de Compra";
      case "cerrada":
        return "Cerrada";
      case "cancelada":
        return "Cancelada";
      case "en_produccion":
        return "En Producción";
      case "borrador":
        return "Borrador";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "urgente":
        return "bg-red-500 text-white";
      case "alta":
        return "bg-orange-500 text-white";
      case "media":
        return "bg-yellow-500 text-white";
      case "baja":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case "urgente":
        return "Urgente";
      case "alta":
        return "Alta";
      case "media":
        return "Media";
      case "baja":
        return "Baja";
      default:
        return urgency;
    }
  };

  // Estadísticas según rol
  const totalPendientes = userRequests.filter(
    (r) => r.status === "pendiente" || r.status === "urgente"
  ).length;
  const totalAprobadas = userRequests.filter(
    (r) => r.status === "aprobado" || r.status === "en_proceso_compra"
  ).length;
  const totalObservadas = userRequests.filter(
    (r) => r.status === "observada"
  ).length;
  const totalEnEspera = userRequests.filter(
    (r) => r.status === "en_espera"
  ).length;

  // Detectar solicitudes similares (CASO 6)
  const findSimilarRequests = (request: PurchaseRequest) => {
    return requests.filter(
      (r) =>
        r.id !== request.id &&
        r.productId === request.productId &&
        (r.status === "pendiente" ||
          r.status === "urgente" ||
          r.status === "aprobado" ||
          r.status === "en_proceso_compra")
    );
  };

  // Clasificación automática (menor / mayor) según umbral (por ejemplo, monto total >= 1000 -> Mayor)
  const classifyRequest = (r: PurchaseRequest) => {
    const total = (r.estimatedPrice ?? 0) * r.quantity;
    return total >= 1000 ? "mayor" : "menor";
  };

  // Acciones del Super Admin
  const handleApprove = () => {
    if (!selectedRequest) return;
    // Marcar como aprobado localmente y luego enviar al sistema de compras
    setRequests(
      requests.map((r) =>
        r.id === selectedRequest.id
          ? {
              ...r,
              status: "aprobado",
              reviewedBy: currentUser.name,
              reviewDate: new Date().toISOString(),
              reviewNotes:
                actionNotes || "Aprobado - procediendo con envío a Compras",
            }
          : r
      )
    );

    // Cerrar modal de acción
    setShowActionModal(null);
    setActionNotes("");

    // Enviar a servicio simulado
    sendToPurchasingSystem({
      ...selectedRequest,
      reviewedBy: currentUser.name,
    } as any)
      .then((res) => {
        // Actualizar estado a 'en_proceso_compra' y anexar número de OC
        setRequests((prev) =>
          prev.map((r) =>
            r.id === selectedRequest.id
              ? ({
                  ...r,
                  status: "en_proceso_compra",
                  purchaseOrderNumber: res.purchaseOrderNumber,
                  supplier: res.supplier,
                  estimatedDeliveryTime: res.estimatedDelivery,
                } as PurchaseRequest)
              : r
          )
        );

        // Notificar al solicitante
        createNotification({
          type: "aprobacion",
          title: "Solicitud enviada a Compras",
          message: `Su solicitud ${selectedRequest.productName} fue aprobada y enviada al sistema de compras (OC: ${res.purchaseOrderNumber})`,
          warehouseId: selectedRequest.warehouseId,
          warehouseName: selectedRequest.warehouseName,
          read: false,
          relatedId: selectedRequest.id,
          severity: "info",
        });

        // Simular ciclo de compra y actualizar estados/crear notificaciones por cada etapa
        simulatePurchaseLifecycle(res.purchaseOrderNumber, (stage) => {
          if (stage === "en_cotizacion") {
            setRequests((prev) =>
              prev.map((r) =>
                r.id === selectedRequest.id
                  ? ({
                      ...r,
                      status: "en_espera",
                      reviewNotes: "En cotización",
                    } as PurchaseRequest)
                  : r
              )
            );
            createNotification({
              type: "solicitud_compra",
              title: "En Cotización",
              message: `La OC ${res.purchaseOrderNumber} está en cotización.`,
              warehouseId: selectedRequest.warehouseId,
              warehouseName: selectedRequest.warehouseName,
              read: false,
              relatedId: selectedRequest.id,
              severity: "info",
            });
          }
          if (stage === "proveedor_asignado") {
            setRequests((prev) =>
              prev.map((r) =>
                r.id === selectedRequest.id
                  ? ({
                      ...r,
                      supplier: res.supplier,
                      reviewNotes: "Proveedor asignado",
                    } as PurchaseRequest)
                  : r
              )
            );
            createNotification({
              type: "solicitud_compra",
              title: "Proveedor asignado",
              message: `Proveedor ${res.supplier} asignado a OC ${res.purchaseOrderNumber}.`,
              warehouseId: selectedRequest.warehouseId,
              warehouseName: selectedRequest.warehouseName,
              read: false,
              relatedId: selectedRequest.id,
              severity: "info",
            });
          }
          if (stage === "en_proceso_compra") {
            setRequests((prev) =>
              prev.map((r) =>
                r.id === selectedRequest.id
                  ? ({ ...r, status: "en_proceso_compra" } as PurchaseRequest)
                  : r
              )
            );
            createNotification({
              type: "solicitud_compra",
              title: "Compra en proceso",
              message: `OC ${res.purchaseOrderNumber} en proceso de compra.`,
              warehouseId: selectedRequest.warehouseId,
              warehouseName: selectedRequest.warehouseName,
              read: false,
              relatedId: selectedRequest.id,
              severity: "info",
            });
          }
          if (stage === "compra_ejecutada") {
            createNotification({
              type: "aprobacion",
              title: "Compra ejecutada",
              message: `La OC ${res.purchaseOrderNumber} ha sido ejecutada.`,
              warehouseId: selectedRequest.warehouseId,
              warehouseName: selectedRequest.warehouseName,
              read: false,
              relatedId: selectedRequest.id,
              severity: "success",
            });
          }
          if (stage === "producto_recibido") {
            setRequests((prev) =>
              prev.map((r) =>
                r.id === selectedRequest.id
                  ? ({
                      ...r,
                      status: "cerrada",
                      deliveryDate: new Date().toISOString(),
                    } as PurchaseRequest)
                  : r
              )
            );
            createNotification({
              type: "aprobacion",
              title: "Producto recibido",
              message: `La OC ${res.purchaseOrderNumber} ha sido recibida en almacén.`,
              warehouseId: selectedRequest.warehouseId,
              warehouseName: selectedRequest.warehouseName,
              read: false,
              relatedId: selectedRequest.id,
              severity: "success",
            });
          }
        });
      })
      .catch(() => {
        // Fallback: marcar en_espera si falla
        setRequests((prev) =>
          prev.map((r) =>
            r.id === selectedRequest.id
              ? ({
                  ...r,
                  status: "en_espera",
                  reviewNotes: "Error al enviar a sistema de compras",
                } as PurchaseRequest)
              : r
          )
        );
        createNotification({
          type: "observacion",
          title: "Error al integrar con Compras",
          message: `No fue posible enviar la solicitud ${selectedRequest.productName} al sistema de compras.`,
          warehouseId: selectedRequest.warehouseId,
          warehouseName: selectedRequest.warehouseName,
          read: false,
          relatedId: selectedRequest.id,
          severity: "error",
        });
      })
      .finally(() => setSelectedRequest(null));
  };

  const handleReject = () => {
    if (!selectedRequest || !actionNotes.trim()) return;

    setRequests(
      requests.map((r) =>
        r.id === selectedRequest.id
          ? {
              ...r,
              status: "rechazado",
              reviewedBy: currentUser.name,
              reviewDate: new Date().toISOString(),
              reviewNotes: actionNotes,
            }
          : r
      )
    );

    setShowActionModal(null);
    setSelectedRequest(null);
    setActionNotes("");
  };

  const handleObserve = () => {
    if (!selectedRequest || !actionNotes.trim()) return;

    setRequests(
      requests.map((r) =>
        r.id === selectedRequest.id
          ? {
              ...r,
              status: "observada",
              reviewedBy: currentUser.name,
              reviewDate: new Date().toISOString(),
              reviewNotes: actionNotes,
            }
          : r
      )
    );

    setShowActionModal(null);
    setSelectedRequest(null);
    setActionNotes("");
  };

  const handlePutOnHold = () => {
    if (!selectedRequest || !actionNotes.trim()) return;

    setRequests(
      requests.map((r) =>
        r.id === selectedRequest.id
          ? {
              ...r,
              status: "en_espera",
              reviewedBy: currentUser.name,
              reviewDate: new Date().toISOString(),
              reviewNotes: actionNotes,
            }
          : r
      )
    );

    setShowActionModal(null);
    setSelectedRequest(null);
    setActionNotes("");
  };

  const openActionModal = (
    action: typeof showActionModal,
    request: PurchaseRequest
  ) => {
    setSelectedRequest(request);
    setShowActionModal(action);
    setActionNotes("");
  };

  const openCreateModal = () => {
    setEditingRequest(null);
    setForm({ urgency: "media", items: [] });
    setShowCreateModal(true);
  };

  const openEditModal = (request: PurchaseRequest) => {
    setEditingRequest(request);
    setForm({ ...request });
    setShowCreateModal(true);
  };

  const handleFormChange = (key: keyof PurchaseRequest, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addItem = () => {
    setForm((prev) => {
      const items = [...(prev.items || [])];
      const next: any = {
        itemNumber: items.length + 1,
        productId: undefined,
        productCode: '',
        description: '',
        unit: '',
        quantity: 1,
        unitPrice: 0,
        subtotal: 0,
      };
      items.push(next);
      return { ...prev, items };
    });
  };

  const updateItem = (index: number, key: string, value: any) => {
    setForm((prev) => {
      const items = [...(prev.items || [])];
      const it: any = { ...(items[index] || {}) };
      it[key] = value;
      if (key === 'quantity' || key === 'unitPrice') {
        const q = Number(it.quantity || 0);
        const p = Number(it.unitPrice || 0);
        it.subtotal = q * p;
      }
      items[index] = it;
      return { ...prev, items };
    });
  };

  const removeItem = (index: number) => {
    setForm((prev) => {
      const items = [...(prev.items || [])];
      items.splice(index, 1);
      items.forEach((it, i) => (it.itemNumber = i + 1));
      return { ...prev, items };
    });
  };

  const handleCreateOrUpdate = () => {
    // Basic validation
    if (!form.productName || !form.quantity || !form.warehouseId) return;

    const totalQuantity = (form.items && form.items.length > 0) ? form.items.reduce((s:any,it:any) => s + (Number(it.quantity)||0), 0) : Number(form.quantity || 0);

    if (editingRequest) {
      // Update existing
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

      // Notificar modificación/reenvío
      createNotification({
        type: "solicitud_compra",
        title: "Solicitud modificada",
        message: `La solicitud ${editingRequest.productName} fue modificada y reenviada.`,
        warehouseId: editingRequest.warehouseId,
        warehouseName: editingRequest.warehouseName,
        read: false,
        relatedId: editingRequest.id,
        severity: "info",
      });
    } else {
      // Create new
      const newReq: PurchaseRequest = {
        id: `pr_${Date.now()}`,
        productId: form.productId,
        productName: form.productName as string,
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

      // Notificar nueva solicitud
      createNotification({
        type: "solicitud_compra",
        title: "Nueva solicitud de compra",
        message: `${currentUser.name} ha creado una nueva solicitud: ${newReq.productName}`,
        warehouseId: newReq.warehouseId,
        warehouseName: newReq.warehouseName,
        read: false,
        relatedId: newReq.id,
        severity: "warning",
      });
    }

    setShowCreateModal(false);
    setEditingRequest(null);
    setForm({});
  };

  const handleDelete = (request: PurchaseRequest) => {
    if (!canDelete(request)) return;
    if (!confirm("¿Eliminar esta solicitud? Esta acción no se puede deshacer."))
      return;
    setRequests(requests.filter((r) => r.id !== request.id));
  };

  const handleUnify = (request: PurchaseRequest) => {
    const similar = findSimilarRequests(request);
    // Mark other requests as en_espera and add relation
    setRequests(
      requests.map((r) => {
        if (r.id === request.id)
          return {
            ...r,
            relatedRequestIds: Array.from(
              new Set([
                ...(r.relatedRequestIds || []),
                ...similar.map((s) => s.id),
              ])
            ),
          };
        if (similar.find((s) => s.id === r.id))
          return {
            ...r,
            status: "en_espera",
            reviewNotes: "Unificada con otra compra por Super Admin",
          };
        return r;
      })
    );
    alert("Solicitudes similares marcadas como “En Espera” y vinculadas.");
  };

  // Verificar si puede eliminar (CASO 14)
  const canDelete = (request: PurchaseRequest) => {
    return request.status === "borrador" || request.status === "observada";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">
            {currentUser.role === "super_admin"
              ? "Cola de Revisión de Compras"
              : "Mis Solicitudes de Compra"}
          </h2>
          <p className="text-gray-600 mt-1">
            {currentUser.role === "super_admin"
              ? `${filteredRequests.length} solicitudes en revisión`
              : `${filteredRequests.length} de ${userRequests.length} solicitudes`}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Solicitud
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Aprobadas</div>
              <div className="text-2xl text-gray-900 mt-1">
                {totalAprobadas}
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Observadas</div>
              <div className="text-2xl text-gray-900 mt-1">
                {totalObservadas}
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Edit className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">En Espera</div>
              <div className="text-2xl text-gray-900 mt-1">{totalEnEspera}</div>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Pause className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
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
            <option value="en_proceso_compra">En Proceso de Compra</option>
            <option value="cerrada">Cerradas</option>
          </select>

          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas las urgencias</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>

      {/* Lista de solicitudes */}
      <div className="space-y-4">
        {sortedRequests.map((request) => {
          const warehouse = warehouses.find(
            (w) => w.id === request.warehouseId
          );
          const similarRequests = findSimilarRequests(request);
          const hasSimilar = similarRequests.length > 0;

          return (
            <div
              key={request.id}
              className={`bg-white rounded-lg border-2 ${getStatusColor(
                request.status
              )} p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-gray-900">{request.productName}</h3>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {getStatusIcon(request.status)}
                      {getStatusLabel(request.status)}
                    </span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${getUrgencyColor(
                        request.urgency
                      )}`}
                    >
                      {getUrgencyLabel(request.urgency)}
                    </span>
                    {hasSimilar && currentUser.role === "super_admin" && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">
                        <Copy className="w-3 h-3" />
                        {similarRequests.length} similar
                        {similarRequests.length > 1 ? "es" : ""}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                      {classifyRequest(request) === "mayor"
                        ? "Compra Mayor"
                        : "Compra Menor"}
                    </span>
                  </div>
                  {request.productCode && (
                    <div className="text-sm text-gray-600">
                      Código: {request.productCode}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    Cantidad: {request.quantity} unidades
                  </div>
                  {request.estimatedPrice && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <DollarSign className="w-3 h-3" />
                      Precio estimado: ${request.estimatedPrice.toFixed(2)}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    Fecha de solicitud
                  </div>
                  <div className="text-sm text-gray-900">
                    {new Date(request.requestDate).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(request.requestDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              {/* Almacén solicitante */}
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

              {/* Alertas de solicitudes similares (CASO 6) */}
              {hasSimilar && currentUser.role === "super_admin" && (
                <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-amber-700 mb-1">
                          Compra similar en proceso
                        </div>
                        <button
                          onClick={() => handleUnify(request)}
                          className="text-xs text-amber-800 underline"
                        >
                          Unificar compras
                        </button>
                      </div>
                      <div className="text-sm text-amber-900">
                        {similarRequests.map((sr) => (
                          <div key={sr.id}>
                            • {sr.warehouseName} - {sr.quantity} unidades (
                            {getStatusLabel(sr.status)})
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Motivo */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">
                  Motivo de la solicitud
                </div>
                <div className="text-sm text-gray-900">{request.reason}</div>
              </div>

              {/* Observaciones iniciales */}
              {request.observations && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-700 mb-1">
                    Observaciones del solicitante
                  </div>
                  <div className="text-sm text-blue-900">
                    {request.observations}
                  </div>
                </div>
              )}

              {/* Información de revisión */}
              {request.reviewedBy && (
                <div
                  className={`mb-4 p-3 rounded-lg ${
                    request.status === "aprobado"
                      ? "bg-green-50 border border-green-200"
                      : request.status === "rechazado"
                      ? "bg-red-50 border border-red-200"
                      : request.status === "observada"
                      ? "bg-orange-50 border border-orange-200"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      className={`w-4 h-4 mt-0.5 ${
                        request.status === "aprobado"
                          ? "text-green-600"
                          : request.status === "rechazado"
                          ? "text-red-600"
                          : request.status === "observada"
                          ? "text-orange-600"
                          : "text-gray-600"
                      }`}
                    />
                    <div className="flex-1">
                      <div
                        className={`text-xs mb-1 ${
                          request.status === "aprobado"
                            ? "text-green-700"
                            : request.status === "rechazado"
                            ? "text-red-700"
                            : request.status === "observada"
                            ? "text-orange-700"
                            : "text-gray-700"
                        }`}
                      >
                        Revisado por {request.reviewedBy} -{" "}
                        {new Date(request.reviewDate!).toLocaleDateString()}
                      </div>
                      <div
                        className={`text-sm ${
                          request.status === "aprobado"
                            ? "text-green-900"
                            : request.status === "rechazado"
                            ? "text-red-900"
                            : request.status === "observada"
                            ? "text-orange-900"
                            : "text-gray-900"
                        }`}
                      >
                        {request.reviewNotes}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Información adicional */}
              <div className="text-sm text-gray-600 mb-4">
                <span className="text-gray-500">Solicitado por: </span>
                <span className="text-gray-900">{request.requestedBy}</span>
              </div>

              {/* Acciones Super Admin */}
              {currentUser.role === "super_admin" &&
                (request.status === "pendiente" ||
                  request.status === "urgente") && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => openActionModal("aprobar", request)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => openActionModal("observar", request)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Observar
                    </button>
                    <button
                      onClick={() => openActionModal("espera", request)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Pause className="w-4 h-4" />
                      En Espera
                    </button>
                    <button
                      onClick={() => openActionModal("rechazar", request)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                  </div>
                )}

              {/* Acciones del Almacén */}
              {currentUser.role === "warehouse_user" &&
                request.status === "observada" && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => openEditModal(request)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Corregir y Reenviar
                    </button>
                  </div>
                )}

              {/* Eliminar (CASO 14) */}
              {currentUser.role === "warehouse_user" && canDelete(request) && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleDelete(request)}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Eliminar Solicitud
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {sortedRequests.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <div>No se encontraron solicitudes</div>
            <div className="text-sm mt-1">
              {currentUser.role === "super_admin"
                ? "No hay solicitudes pendientes de revisión"
                : "No tienes solicitudes. Crea una nueva para comenzar"}
            </div>
          </div>
        )}
      </div>

      {/* Modal de acciones */}
      {showActionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-gray-900 mb-4">
              {showActionModal === "aprobar" && "Aprobar Solicitud"}
              {showActionModal === "rechazar" && "Rechazar Solicitud"}
              {showActionModal === "observar" && "Observar Solicitud"}
              {showActionModal === "espera" && "Poner en Espera"}
            </h3>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Producto</div>
              <div className="text-gray-900">{selectedRequest.productName}</div>
              <div className="text-sm text-gray-600">
                Cantidad: {selectedRequest.quantity}
              </div>
              <div className="text-sm text-gray-600">
                Almacén: {selectedRequest.warehouseName}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">
                {showActionModal === "rechazar" &&
                  "Motivo del rechazo (obligatorio)"}
                {showActionModal === "observar" &&
                  "Observaciones para corrección (obligatorio)"}
                {showActionModal === "espera" &&
                  "Motivo de la espera (obligatorio)"}
                {showActionModal === "aprobar" &&
                  "Notas adicionales (opcional)"}
              </label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={
                  showActionModal === "rechazar"
                    ? "Explica por qué se rechaza la solicitud..."
                    : showActionModal === "observar"
                    ? "Indica qué debe corregir el almacén..."
                    : showActionModal === "espera"
                    ? "Explica el motivo de la espera..."
                    : "Agrega comentarios adicionales..."
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowActionModal(null);
                  setSelectedRequest(null);
                  setActionNotes("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (showActionModal === "aprobar") handleApprove();
                  else if (showActionModal === "rechazar") handleReject();
                  else if (showActionModal === "observar") handleObserve();
                  else if (showActionModal === "espera") handlePutOnHold();
                }}
                disabled={showActionModal !== "aprobar" && !actionNotes.trim()}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  showActionModal === "aprobar"
                    ? "bg-green-600 hover:bg-green-700"
                    : showActionModal === "rechazar"
                    ? "bg-red-600 hover:bg-red-700"
                    : showActionModal === "observar"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-gray-600 hover:bg-gray-700"
                } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Crear / Editar Solicitud */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-gray-900 mb-4">
              {editingRequest
                ? "Editar Solicitud"
                : "Nueva Solicitud de Compra"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600">
                  Producto / Descripción
                </label>
                <input
                  value={form.productName ?? ""}
                  onChange={(e) =>
                    handleFormChange("productName", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">
                  Código (opcional)
                </label>
                <input
                  value={form.productCode ?? ""}
                  onChange={(e) =>
                    handleFormChange("productCode", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Cantidad</label>
                <input
                  type="number"
                  value={form.quantity ?? ""}
                  onChange={(e) =>
                    handleFormChange("quantity", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Almacén</label>
                <select
                  value={form.warehouseId ?? ""}
                  onChange={(e) =>
                    handleFormChange("warehouseId", e.target.value)
                  }
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
                <label className="block text-sm text-gray-600">Urgencia</label>
                <select
                  value={form.urgency ?? "media"}
                  onChange={(e) => handleFormChange("urgency", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600">
                  Precio estimado (unitario)
                </label>
                <input
                  type="number"
                  value={form.estimatedPrice ?? ""}
                  onChange={(e) =>
                    handleFormChange("estimatedPrice", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Motivo</label>
                <input
                  value={form.reason ?? ""}
                  onChange={(e) => handleFormChange("reason", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">Ítems de la Solicitud</div>
                  <button type="button" onClick={addItem} className="text-xs px-2 py-1 bg-blue-600 text-white rounded">Agregar ítem</button>
                </div>
                <div className="overflow-x-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">#</th>
                        <th className="p-2 text-left">Código</th>
                        <th className="p-2 text-left">Descripción</th>
                        <th className="p-2 text-left">Unidad</th>
                        <th className="p-2 text-right">Cant.</th>
                        <th className="p-2 text-right">Precio u.</th>
                        <th className="p-2 text-right">Subtotal</th>
                        <th className="p-2"> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(form.items || []).map((it: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{it.itemNumber}</td>
                          <td className="p-2"><input value={it.productCode || ''} onChange={(e) => updateItem(idx, 'productCode', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                          <td className="p-2"><input value={it.description || ''} onChange={(e) => updateItem(idx, 'description', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                          <td className="p-2"><input value={it.unit || ''} onChange={(e) => updateItem(idx, 'unit', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                          <td className="p-2 text-right"><input type="number" value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} className="w-20 px-2 py-1 border rounded text-right" /></td>
                          <td className="p-2 text-right"><input type="number" value={it.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))} className="w-28 px-2 py-1 border rounded text-right" /></td>
                          <td className="p-2 text-right">{(it.subtotal || 0).toFixed ? (it.subtotal || 0).toFixed(2) : (it.subtotal || 0)}</td>
                          <td className="p-2 text-center"><button type="button" onClick={() => removeItem(idx)} className="text-red-600">Eliminar</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600">
                  Observaciones / evidencia (opcional)
                </label>
                <textarea
                  value={form.observations ?? ""}
                  onChange={(e) =>
                    handleFormChange("observations", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingRequest(null);
                  setForm({});
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateOrUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                {editingRequest ? "Guardar y Enviar" : "Crear y Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
