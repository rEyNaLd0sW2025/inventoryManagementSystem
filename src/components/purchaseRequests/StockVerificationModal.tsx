import React from "react";
import {
  Factory,
  Building,
  Warehouse,
  Store,
  AlertCircle,
  PackageCheck,
  PackageX,
  X,
} from "lucide-react";

export default function StockVerificationModal({
  stockData,
  onGenerateOS,
  onGenerateOC,
  onCancel,
}: any) {
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

  const getStatusColor = (sufficient: boolean) =>
    sufficient ? "text-green-600" : "text-red-600";
  const getStatusIcon = (sufficient: boolean) =>
    sufficient ? (
      <PackageCheck className="w-8 h-8 text-green-600" />
    ) : (
      <PackageX className="w-8 h-8 text-red-600" />
    );
  const getProgressColor = () => {
    const percentage = comparison.percentage;
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

        <div className="p-6 space-y-6">
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

            <div className="flex gap-2 justify-end">
              {isSufficient ? (
                <button
                  onClick={onGenerateOS}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Generar Orden de Salida
                </button>
              ) : (
                <button
                  onClick={onGenerateOC}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Generar Orden de Compra
                </button>
              )}
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
