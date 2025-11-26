/**
 * Utilidades para manipular ítems en las solicitudes de compra
 */

export interface FormItem {
  itemNumber: number;
  productId?: string;
  productCode?: string;
  description?: string;
  unit?: string;
  quantity: number;
  unitPrice?: number;
  subtotal?: number;
}

/**
 * Agrega un nuevo ítem a la lista
 */
export const addItem = (items: FormItem[] = []): FormItem[] => {
  const next: FormItem = {
    itemNumber: items.length + 1,
    productId: undefined,
    productCode: "",
    description: "",
    unit: "",
    quantity: 1,
    unitPrice: 0,
    subtotal: 0,
  };
  return [...items, next];
};

/**
 * Actualiza un ítem específico
 */
export const updateItem = (
  items: FormItem[],
  index: number,
  key: string,
  value: any
): FormItem[] => {
  const updated = [...items];
  const item = { ...updated[index] };

  (item as any)[key] = value;

  // Auto-calcular subtotal si se cambia cantidad o precio
  if (key === "quantity" || key === "unitPrice") {
    const q = Number(item.quantity || 0);
    const p = Number(item.unitPrice || 0);
    item.subtotal = q * p;
  }

  updated[index] = item;
  return updated;
};

/**
 * Elimina un ítem de la lista y renumera
 */
export const removeItem = (items: FormItem[], index: number): FormItem[] => {
  const updated = [...items];
  updated.splice(index, 1);

  // Renumerar
  return updated.map((it, i) => ({
    ...it,
    itemNumber: i + 1,
  }));
};

/**
 * Calcula el total de todos los ítems
 */
export const calculateItemsTotal = (items: FormItem[] = []): number => {
  return items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
};

/**
 * Agrupa ítems por código de producto y precio unitario (útil para OC combinada)
 */
export const groupItemsByProductAndPrice = (items: FormItem[]): FormItem[] => {
  const map = new Map<string, FormItem>();

  items.forEach((item) => {
    const key = `${item.productCode || item.description}__${
      item.unitPrice || 0
    }`;
    const existing = map.get(key);

    if (existing) {
      existing.quantity += item.quantity;
      existing.subtotal = existing.quantity * (Number(existing.unitPrice) || 0);
    } else {
      map.set(key, { ...item });
    }
  });

  return Array.from(map.values()).map((it, idx) => ({
    ...it,
    itemNumber: idx + 1,
  }));
};

/**
 * Valida que los ítems sean correctos
 */
export const validateItems = (
  items: FormItem[] = []
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (items.length === 0) {
    errors.push("Debes agregar al menos un ítem");
  }

  items.forEach((item, idx) => {
    if (!item.description?.trim()) {
      errors.push(`Ítem ${idx + 1}: Descripción es obligatoria`);
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Ítem ${idx + 1}: Cantidad debe ser mayor a 0`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};
