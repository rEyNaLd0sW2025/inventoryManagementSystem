import { useState, useMemo } from "react";
import { PurchaseRequest, RequestStatus, User } from "../types";

/**
 * Hook que encapsula toda la lógica de filtrado y búsqueda de solicitudes
 */
export function usePurchaseRequestFiltering(
  requests: PurchaseRequest[],
  currentUser: User
) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "all">(
    "all"
  );
  const [filterUrgency, setFilterUrgency] = useState<
    "all" | "baja" | "media" | "alta" | "urgente"
  >("all");

  // Filtrar por rol
  const userRequests = useMemo(
    () =>
      currentUser.role === "super_admin"
        ? requests
        : requests.filter((r) => r.warehouseId === currentUser.warehouseId),
    [requests, currentUser]
  );

  // Filtrar por búsqueda y criterios
  const filteredRequests = useMemo(() => {
    return userRequests.filter((request) => {
      const matchesSearch =
        request.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.productCode &&
          request.productCode
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        request.reason?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || request.status === filterStatus;
      const matchesUrgency =
        filterUrgency === "all" || request.urgency === filterUrgency;

      return matchesSearch && matchesStatus && matchesUrgency;
    });
  }, [userRequests, searchTerm, filterStatus, filterUrgency]);

  return {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterUrgency,
    setFilterUrgency,
    filteredRequests,
    userRequests,
  };
}

/**
 * Hook para manejar el estado de selección de solicitudes para crear OC combinada
 */
export function usePurchaseOrderSelection() {
  const [selectedForPO, setSelectedForPO] = useState<string[]>([]);

  const toggleSelectForPO = (id: string) => {
    setSelectedForPO((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedForPO([]);
  };

  return {
    selectedForPO,
    toggleSelectForPO,
    clearSelection,
    selectionCount: selectedForPO.length,
  };
}

/**
 * Hook para manejar modales de acciones
 */
export function usePurchaseRequestModals() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState<
    "aprobar" | "rechazar" | "observar" | "espera" | null
  >(null);
  const [selectedRequest, setSelectedRequest] =
    useState<PurchaseRequest | null>(null);
  const [actionNotes, setActionNotes] = useState("");

  const openActionModal = (
    action: typeof showActionModal,
    request: PurchaseRequest
  ) => {
    setSelectedRequest(request);
    setShowActionModal(action);
    setActionNotes("");
  };

  const closeActionModal = () => {
    setShowActionModal(null);
    setSelectedRequest(null);
    setActionNotes("");
  };

  return {
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
  };
}

/**
 * Hook para manejar el formulario de creación/edición
 */
export function usePurchaseRequestForm() {
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(
    null
  );
  const [form, setForm] = useState<Partial<PurchaseRequest>>({});
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(
    new Set()
  );

  const openEditModal = (request: PurchaseRequest) => {
    setEditingRequest(request);
    setForm({ ...request });
  };

  const openCreateModal = () => {
    setEditingRequest(null);
    setForm({
      urgency: "media",
      items: [],
    });
  };

  const closeModal = () => {
    setEditingRequest(null);
    setForm({});
  };

  const handleFormChange = (key: keyof PurchaseRequest, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleRequestDetails = (requestId: string) => {
    setExpandedRequests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  return {
    editingRequest,
    setEditingRequest,
    form,
    setForm,
    expandedRequests,
    toggleRequestDetails,
    openEditModal,
    openCreateModal,
    closeModal,
    handleFormChange,
  };
}
