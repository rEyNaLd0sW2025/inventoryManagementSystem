import React from "react";
import { X } from "lucide-react";
import { createNotification } from "../../services/notifications";

export default function ActionModal({
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
            {selectedRequest?.productName}
          </div>
          <div className="text-sm text-gray-600">
            Cantidad: {selectedRequest?.quantity} | Almacén:{" "}
            {selectedRequest?.warehouseName}
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
