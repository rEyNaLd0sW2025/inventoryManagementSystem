import { PurchaseRequest } from "../types";

// Servicio simulado que representa el sistema de compras externo.
// En desarrollo se usa para simular la asignación de OC, proveedores y progreso.

export interface PurchaseResult {
  purchaseOrderNumber: string;
  supplier?: string;
  estimatedDelivery?: string;
}

export const sendToPurchasingSystem = async (
  request: PurchaseRequest
): Promise<PurchaseResult> => {
  // Simulamos una llamada async (p.ej. a una API externa)
  return new Promise((resolve) => {
    setTimeout(() => {
      const po = `OC-${Date.now()}`;
      resolve({
        purchaseOrderNumber: po,
        supplier: "Proveedor Simulado S.A.",
        estimatedDelivery: new Date(
          Date.now() + 1000 * 60 * 60 * 24 * 7
        ).toISOString(), // +7 días
      });
    }, 700);
  });
};

// Simula el progreso de la compra (no conectado automáticamente).
export const simulatePurchaseLifecycle = (
  purchaseOrderNumber: string,
  onUpdate?: (stage: string) => void
) => {
  // Llamadas temporizadas para simular: en_cotizacion -> en_proceso_compra -> compra_ejecutada -> producto_recibido
  setTimeout(() => onUpdate?.("en_cotizacion"), 800);
  setTimeout(() => onUpdate?.("proveedor_asignado"), 2000);
  setTimeout(() => onUpdate?.("en_proceso_compra"), 3500);
  setTimeout(() => onUpdate?.("compra_ejecutada"), 6500);
  setTimeout(() => onUpdate?.("producto_recibido"), 9500);
};
