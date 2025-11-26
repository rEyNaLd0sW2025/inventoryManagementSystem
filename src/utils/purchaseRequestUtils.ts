import { PurchaseRequest, RequestStatus } from "../types";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Edit,
  Pause,
  ShoppingCart,
  FileText,
  TrendingUp,
} from "lucide-react";

/**
 * Obtiene el icono correspondiente a cada estado de solicitud
 */
export const getStatusIcon = (status: RequestStatus) => {
  switch (status) {
    case "aprobado":
      return CheckCircle;
    case "rechazado":
      return XCircle;
    case "pendiente":
      return Clock;
    case "urgente":
      return AlertTriangle;
    case "observada":
      return Edit;
    case "en_correccion":
      return Edit;
    case "en_espera":
      return Pause;
    case "en_proceso_compra":
      return ShoppingCart;
    case "cerrada":
      return FileText;
    case "cancelada":
      return XCircle;
    case "en_produccion":
      return TrendingUp;
    case "borrador":
      return Edit;
    default:
      return Clock;
  }
};

/**
 * Obtiene las clases Tailwind para el color del estado
 */
export const getStatusColor = (status: RequestStatus) => {
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
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

/**
 * Obtiene la etiqueta legible del estado
 */
export const getStatusLabel = (status: RequestStatus) => {
  const labels: Record<RequestStatus, string> = {
    aprobado: "Aprobada",
    rechazado: "Rechazada",
    pendiente: "Pendiente",
    urgente: "Urgente",
    observada: "Observada",
    en_correccion: "En Corrección",
    en_espera: "En Espera",
    en_proceso_compra: "En Proceso de Compra",
    cerrada: "Cerrada",
    cancelada: "Cancelada",
    en_produccion: "En Producción",
    borrador: "Borrador",
  };
  return labels[status] || status;
};

/**
 * Obtiene las clases de color para urgencia
 */
export const getUrgencyColor = (urgency: string) => {
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

/**
 * Obtiene la etiqueta legible de urgencia
 */
export const getUrgencyLabel = (urgency: string) => {
  const labels: Record<string, string> = {
    urgente: "Urgente",
    alta: "Alta",
    media: "Media",
    baja: "Baja",
  };
  return labels[urgency] || urgency;
};

/**
 * Calcula el total de una solicitud considerando todos sus ítems
 */
export const calculateRequestTotal = (request: PurchaseRequest): number => {
  if (request.items && request.items.length > 0) {
    return request.items.reduce(
      (total: number, item: any) => total + (item.subtotal || 0),
      0
    );
  }
  return (request.estimatedPrice || 0) * (request.quantity || 0);
};

/**
 * Clasifica una solicitud como "mayor" o "menor" según el monto
 * Umbral: $1000 USD
 */
export const classifyRequest = (r: PurchaseRequest): "mayor" | "menor" => {
  const total = calculateRequestTotal(r);
  return total >= 1000 ? "mayor" : "menor";
};

/**
 * Encontrar solicitudes similares (mismo producto, estados activos)
 */
export const findSimilarRequests = (
  request: PurchaseRequest,
  allRequests: PurchaseRequest[]
): PurchaseRequest[] => {
  return allRequests.filter(
    (r) =>
      r.id !== request.id &&
      r.productId === request.productId &&
      (r.status === "pendiente" ||
        r.status === "urgente" ||
        r.status === "aprobado" ||
        r.status === "en_proceso_compra")
  );
};

/**
 * Puede eliminarse si está en estado borrador u observada
 */
export const canDelete = (request: PurchaseRequest): boolean => {
  return request.status === "borrador" || request.status === "observada";
};

/**
 * Orden de urgencia para ordenamiento
 */
const URGENCY_ORDER = { urgente: 0, alta: 1, media: 2, baja: 3 };

/**
 * Ordena solicitudes por urgencia primero, luego por fecha
 */
export const sortRequestsByUrgencyAndDate = (
  requests: PurchaseRequest[]
): PurchaseRequest[] => {
  return [...requests].sort((a, b) => {
    if (a.urgency !== b.urgency) {
      return URGENCY_ORDER[a.urgency as keyof typeof URGENCY_ORDER] -
        URGENCY_ORDER[b.urgency as keyof typeof URGENCY_ORDER] >
        (URGENCY_ORDER[b.urgency as keyof typeof URGENCY_ORDER] || 3)
        ? -1
        : 1;
    }
    return (
      new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
    );
  });
};

/**
 * Calcula estadísticas rápidas sobre las solicitudes
 */
export interface RequestStats {
  totalPendientes: number;
  totalAprobadas: number;
  totalObservadas: number;
  totalEnEspera: number;
  totalRechazadas: number;
  totalEnProcesoCompra: number;
}

export const calculateRequestStats = (
  requests: PurchaseRequest[]
): RequestStats => {
  return {
    totalPendientes: requests.filter(
      (r) => r.status === "pendiente" || r.status === "urgente"
    ).length,
    totalAprobadas: requests.filter((r) => r.status === "aprobado").length,
    totalObservadas: requests.filter((r) => r.status === "observada").length,
    totalEnEspera: requests.filter((r) => r.status === "en_espera").length,
    totalRechazadas: requests.filter((r) => r.status === "rechazado").length,
    totalEnProcesoCompra: requests.filter(
      (r) => r.status === "en_proceso_compra"
    ).length,
  };
};

/**
 * Valida que una solicitud cumpla con los requisitos mínimos
 */
export const validatePurchaseRequest = (
  form: Partial<PurchaseRequest>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!form.items || form.items.length === 0) {
    errors.push("Debe agregar al menos un ítem");
  }

  if (!form.warehouseId) {
    errors.push("Debe seleccionar un almacén");
  }

  if (!form.reason || !form.reason.trim()) {
    errors.push("El motivo es obligatorio");
  }

  // Validar ítems
  if (form.items) {
    form.items.forEach((item: any, idx: number) => {
      if (!item.description?.trim()) {
        errors.push(`Ítem ${idx + 1}: Descripción es obligatoria`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Ítem ${idx + 1}: Cantidad debe ser mayor a 0`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
