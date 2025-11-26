import { useState } from 'react';
import { AlertTriangle, Search, CheckCircle, Package, TrendingDown } from 'lucide-react';
import { alerts as initialAlerts, warehouses } from '../data/mockData';
import { Alert } from '../types';

interface AlertsProps {
  onNavigate: (page: string, data?: any) => void;
}

export function Alerts({ onNavigate }: AlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | Alert['type']>('all');
  const [filterResolved, setFilterResolved] = useState<'all' | 'active' | 'resolved'>('active');

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.warehouseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || alert.type === filterType;
    const matchesResolved = 
      filterResolved === 'all' || 
      (filterResolved === 'active' && !alert.resolved) ||
      (filterResolved === 'resolved' && alert.resolved);
    
    return matchesSearch && matchesType && matchesResolved;
  });

  const activeAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'stock_cero':
      case 'stock_minimo':
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getAlertColor = (severity: 'warning' | 'error') => {
    return severity === 'error' 
      ? 'bg-red-50 border-red-300 text-red-800'
      : 'bg-orange-50 border-orange-300 text-orange-800';
  };

  const getAlertTypeLabel = (type: Alert['type']) => {
    const labels: Record<Alert['type'], string> = {
      stock_minimo: 'Stock Mínimo',
      stock_cero: 'Stock Agotado',
      movimiento_sospechoso: 'Movimiento Sospechoso',
      sin_categoria: 'Sin Categoría',
      duplicado: 'Producto Duplicado',
      error_registro: 'Error en Registro'
    };
    return labels[type];
  };

  const resolveAlert = (id: string) => {
    setAlerts(alerts.map(a => 
      a.id === id ? { ...a, resolved: true } : a
    ));
  };

  const unresolveAlert = (id: string) => {
    setAlerts(alerts.map(a => 
      a.id === id ? { ...a, resolved: false } : a
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Alertas del Sistema</h2>
        <p className="text-gray-600 mt-1">
          Monitoreo y seguimiento de situaciones críticas
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Alertas Activas</div>
              <div className="text-2xl text-gray-900 mt-1">{activeAlerts.length}</div>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Alertas Resueltas</div>
              <div className="text-2xl text-gray-900 mt-1">{resolvedAlerts.length}</div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar alertas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="stock_cero">Stock Agotado</option>
            <option value="stock_minimo">Stock Mínimo</option>
            <option value="movimiento_sospechoso">Movimiento Sospechoso</option>
            <option value="sin_categoria">Sin Categoría</option>
            <option value="duplicado">Duplicado</option>
            <option value="error_registro">Error en Registro</option>
          </select>

          {/* Filtro por estado */}
          <select
            value={filterResolved}
            onChange={(e) => setFilterResolved(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Activas</option>
            <option value="resolved">Resueltas</option>
            <option value="all">Todas</option>
          </select>
        </div>
      </div>

      {/* Lista de alertas */}
      <div className="space-y-3">
        {filteredAlerts.map(alert => {
          const warehouse = warehouses.find(w => w.id === alert.warehouseId);

          return (
            <div 
              key={alert.id}
              className={`rounded-lg border-2 p-4 transition-all ${
                alert.resolved 
                  ? 'bg-gray-50 border-gray-200 opacity-60' 
                  : getAlertColor(alert.severity)
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 p-2 rounded-lg ${
                  alert.resolved 
                    ? 'bg-gray-200' 
                    : alert.severity === 'error' 
                      ? 'bg-red-200' 
                      : 'bg-orange-200'
                }`}>
                  {alert.resolved ? (
                    <CheckCircle className="w-5 h-5 text-gray-600" />
                  ) : (
                    getAlertIcon(alert.type)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-gray-900">{getAlertTypeLabel(alert.type)}</h4>
                        {alert.resolved && (
                          <span className="inline-flex px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                            Resuelta
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 mb-1">{alert.message}</div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-gray-600">
                        {new Date(alert.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(alert.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <button
                      onClick={() => onNavigate('inventory', { productId: alert.productId })}
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Package className="w-3 h-3" />
                      {alert.productName}
                    </button>
                    
                    {warehouse && (
                      <div 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                        style={{ backgroundColor: `${warehouse.color}20`, color: warehouse.color }}
                      >
                        {alert.warehouseName}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!alert.resolved ? (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Marcar como resuelta
                      </button>
                    ) : (
                      <button
                        onClick={() => unresolveAlert(alert.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Reabrir alerta
                      </button>
                    )}
                    
                    <button
                      onClick={() => onNavigate('inventory', { productId: alert.productId })}
                      className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Ver producto
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <div>No se encontraron alertas</div>
            <div className="text-sm mt-1">
              {filterResolved === 'active' 
                ? 'No hay alertas activas en este momento' 
                : 'Intenta ajustar los filtros de búsqueda'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
