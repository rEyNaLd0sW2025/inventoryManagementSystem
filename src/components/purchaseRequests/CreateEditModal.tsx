import React from "react";
import { Plus, XCircle } from "lucide-react";
import { warehouses } from "../../data/mockData";
import { calculateItemsTotal } from "../../utils/itemUtils";

export default function CreateEditModal({
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
