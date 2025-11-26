// Tipos y interfaces del sistema

export type UserRole = "super_admin" | "warehouse_user";

export type MovementType =
  | "entrada"
  | "salida"
  | "reintegro"
  | "transferencia"
  | "ajuste";

export type MovementStatus = "pendiente" | "aprobado" | "rechazado";

export type ProductStatus = "activo" | "en_revision" | "inactivo" | "obsoleto";

export type RequestStatus =
  | "borrador"
  | "pendiente"
  | "urgente"
  | "observada"
  | "en_correccion"
  | "en_espera"
  | "aprobado"
  | "rechazado"
  | "en_proceso_compra"
  | "cancelada"
  | "en_produccion"
  | "cerrada";

export type NotificationType =
  | "nuevo_producto"
  | "modificacion_inventario"
  | "entrada_salida"
  | "transferencia"
  | "reintegro"
  | "ajuste"
  | "solicitud_compra"
  | "observacion"
  | "aprobacion"
  | "rechazo"
  | "stock_minimo"
  | "stock_cero";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  warehouseId?: string;
  warehouseName?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  area: string;
  location: string;
  responsible: string;
  color: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  subcategory: string;
  unit: string;
  technicalDescription: string;
  warehouseId: string;
  warehouseName: string;
  physicalLocation?: string;
  minStock: number;
  maxStock: number;
  currentStock: number;
  cost?: number;
  status: ProductStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Movement {
  id: string;
  type: MovementType;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  warehouseId: string;
  warehouseName: string;
  date: string;
  reason: string;
  document?: string;
  responsibleUser: string;
  status: MovementStatus;
  observations?: string;
  destinationWarehouseId?: string;
  destinationWarehouseName?: string;
}

export interface Transfer {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  originWarehouseId: string;
  originWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  requestDate: string;
  status: MovementStatus;
  reason: string;
  observations?: string;
  requestedBy: string;
  approvedBy?: string;
  receivedDate?: string;
}

export interface PurchaseRequest {
  id: string;
  productId?: string;
  productName: string;
  productCode?: string;
  quantity: number;
  items?: Array<{
    itemNumber: number;
    productId?: string;
    productCode?: string;
    description?: string;
    unit?: string;
    quantity: number;
    unitPrice?: number;
    subtotal?: number;
  }>;
  warehouseId: string;
  warehouseName: string;
  requestDate: string;
  reason: string;
  urgency: "baja" | "media" | "alta" | "urgente";
  observations?: string;
  status: RequestStatus;
  requestedBy: string;
  reviewedBy?: string;
  reviewDate?: string;
  reviewNotes?: string;
  estimatedPrice?: number;
  supplier?: string;
  estimatedDeliveryTime?: string;
  relatedRequestIds?: string[]; // Para detectar duplicados o compras relacionadas
  purchaseOrderNumber?: string;
  deliveryDate?: string;
  cancelReason?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  warehouseId?: string;
  warehouseName?: string;
  date: string;
  read: boolean;
  relatedId?: string;
  severity: "info" | "warning" | "error" | "success";
}

export interface HistoryEntry {
  id: string;
  productId: string;
  action: string;
  date: string;
  user: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

export interface Alert {
  id: string;
  type:
    | "stock_minimo"
    | "stock_cero"
    | "movimiento_sospechoso"
    | "sin_categoria"
    | "duplicado"
    | "error_registro";
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  message: string;
  severity: "warning" | "error";
  date: string;
  resolved: boolean;
}
