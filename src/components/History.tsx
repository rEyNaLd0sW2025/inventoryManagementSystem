import { useState } from 'react';
import { History as HistoryIcon, Search, Filter, ArrowRight, Clock } from 'lucide-react';
import { history as initialHistory, products } from '../data/mockData';
import { HistoryEntry } from '../types';

interface HistoryProps {
  initialFilter?: { productId?: string };
}

export function History({ initialFilter }: HistoryProps) {
  const [history] = useState<HistoryEntry[]>(initialHistory);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProduct, setFilterProduct] = useState(initialFilter?.productId || 'all');

  const filteredHistory = history.filter(entry => {
    const matchesSearch = 
      entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = filterProduct === 'all' || entry.productId === filterProduct;
    
    return matchesSearch && matchesProduct;
  });

  const getProduct = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  // Agrupar historial por producto
  const historyByProduct = filteredHistory.reduce((acc, entry) => {
    if (!acc[entry.productId]) {
      acc[entry.productId] = [];
    }
    acc[entry.productId].push(entry);
    return acc;
  }, {} as Record<string, HistoryEntry[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Historial de Productos</h2>
        <p className="text-gray-600 mt-1">
          Registro completo de cambios y movimientos
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en historial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por producto */}
          <select
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los productos</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline por producto */}
      <div className="space-y-6">
        {Object.keys(historyByProduct).map(productId => {
          const product = getProduct(productId);
          const entries = historyByProduct[productId].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          if (!product) return null;

          return (
            <div key={productId} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Product Header */}
              <div className="bg-gray-50 border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-900">{product.name}</h3>
                    <div className="text-sm text-gray-600">Código: {product.code}</div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {entries.length} {entries.length === 1 ? 'registro' : 'registros'}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-6">
                <div className="relative">
                  {/* Línea vertical */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                  {/* Entradas del historial */}
                  <div className="space-y-6">
                    {entries.map((entry, index) => (
                      <div key={entry.id} className="relative pl-12">
                        {/* Círculo indicador */}
                        <div className="absolute left-2.5 top-1.5 w-5 h-5 bg-blue-600 rounded-full border-4 border-white"></div>

                        {/* Contenido */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-gray-900">{entry.action}</h4>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {new Date(entry.date).toLocaleDateString()}
                            </div>
                          </div>

                          <p className="text-sm text-gray-700 mb-3">{entry.details}</p>

                          {(entry.previousValue || entry.newValue) && (
                            <div className="flex items-center gap-3 text-sm">
                              {entry.previousValue && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">Anterior:</span>
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                                    {entry.previousValue}
                                  </span>
                                </div>
                              )}
                              {entry.previousValue && entry.newValue && (
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                              )}
                              {entry.newValue && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">Nuevo:</span>
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                                    {entry.newValue}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                            Realizado por: <span className="text-gray-900">{entry.user}</span>
                            <span className="ml-3">
                              {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {Object.keys(historyByProduct).length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            <HistoryIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <div>No se encontró historial</div>
            <div className="text-sm mt-1">Intenta ajustar los filtros de búsqueda</div>
          </div>
        )}
      </div>
    </div>
  );
}
