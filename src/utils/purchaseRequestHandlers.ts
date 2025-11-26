import { PurchaseRequest, User, Notification } from "../types";
import { warehouses } from "../data/mockData";
import {
  sendToPurchasingSystem,
  simulatePurchaseLifecycle,
} from "../services/purchases";

interface ActionHandlerParams {
  selectedRequest: PurchaseRequest;
  currentUser: User;
  actionNotes: string;
  requests: PurchaseRequest[];
  setRequests: (
    r: PurchaseRequest[] | ((prev: PurchaseRequest[]) => PurchaseRequest[])
  ) => void;
  onNotification: (notification: Omit<Notification, "id" | "date">) => void;
  onSuccess?: () => void;
}

/**
 * Maneja la aprobación de una solicitud de compra
 */
export const handleApproveRequest = async (params: ActionHandlerParams) => {
  const {
    selectedRequest,
    currentUser,
    actionNotes,
    requests,
    setRequests,
    onNotification,
    onSuccess,
  } = params;

  try {
    // Marcar como aprobado localmente
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

    // Enviar a servicio simulado
    const res = await sendToPurchasingSystem({
      ...selectedRequest,
      reviewedBy: currentUser.name,
    } as any);

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
    onNotification({
      type: "aprobacion",
      title: "Solicitud enviada a Compras",
      message: `Su solicitud ${selectedRequest.productName} fue aprobada y enviada al sistema de compras (OC: ${res.purchaseOrderNumber})`,
      warehouseId: selectedRequest.warehouseId,
      warehouseName: selectedRequest.warehouseName,
      read: false,
      relatedId: selectedRequest.id,
      severity: "info",
    });

    // Simular ciclo de compra
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
        onNotification({
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
        onNotification({
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
        onNotification({
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
        onNotification({
          type: "aprobacion",
          title: "Compra ejecutada",
          message: `La OC ${res.purchaseOrderNumber} ha sido ejecutada.`,
          warehouseId: selectedRequest.warehouseId,
          warehouseName: selectedRequest.warehouseName,
          read: false,
          relatedId: selectedRequest.id,
          severity: "info",
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
        onNotification({
          type: "aprobacion",
          title: "Producto recibido",
          message: `La OC ${res.purchaseOrderNumber} ha sido recibida en almacén.`,
          warehouseId: selectedRequest.warehouseId,
          warehouseName: selectedRequest.warehouseName,
          read: false,
          relatedId: selectedRequest.id,
          severity: "info",
        });
      }
    });

    onSuccess?.();
  } catch (error) {
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
    onNotification({
      type: "observacion",
      title: "Error al integrar con Compras",
      message: `No fue posible enviar la solicitud ${selectedRequest.productName} al sistema de compras.`,
      warehouseId: selectedRequest.warehouseId,
      warehouseName: selectedRequest.warehouseName,
      read: false,
      relatedId: selectedRequest.id,
      severity: "error",
    });
  }
};

/**
 * Maneja el rechazo de una solicitud
 */
export const handleRejectRequest = (params: ActionHandlerParams) => {
  const {
    selectedRequest,
    currentUser,
    actionNotes,
    requests,
    setRequests,
    onSuccess,
  } = params;

  if (!actionNotes.trim()) return;

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

  onSuccess?.();
};

/**
 * Maneja observaciones a una solicitud
 */
export const handleObserveRequest = (params: ActionHandlerParams) => {
  const {
    selectedRequest,
    currentUser,
    actionNotes,
    requests,
    setRequests,
    onSuccess,
  } = params;

  if (!actionNotes.trim()) return;

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

  onSuccess?.();
};

/**
 * Maneja poner en espera una solicitud
 */
export const handlePutOnHoldRequest = (params: ActionHandlerParams) => {
  const {
    selectedRequest,
    currentUser,
    actionNotes,
    requests,
    setRequests,
    onSuccess,
  } = params;

  if (!actionNotes.trim()) return;

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

  onSuccess?.();
};

/**
 * Maneja unificación de solicitudes similares
 */
export const handleUnifyRequests = (
  selectedRequest: PurchaseRequest,
  allRequests: PurchaseRequest[],
  setRequests: (
    r: PurchaseRequest[] | ((prev: PurchaseRequest[]) => PurchaseRequest[])
  ) => void,
  findSimilarRequests: (r: PurchaseRequest) => PurchaseRequest[]
) => {
  const similar = findSimilarRequests(selectedRequest);
  setRequests(
    allRequests.map((r) => {
      if (r.id === selectedRequest.id)
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
};
