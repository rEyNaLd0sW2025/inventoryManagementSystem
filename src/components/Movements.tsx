import { useState } from 'react';
import { Plus, Search, Filter, ArrowDown, ArrowUp, RefreshCw, Edit2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { movements as initialMovements, products, warehouses } from '../data/mockData';
import { Movement, MovementType, MovementStatus, User } from '../types';

interface MovementsProps {
  onNavigate: (page: string, data?: any) => void;
  currentUser: User;
}

export function Movements({ onNavigate, currentUser }: MovementsProps) {
  const [movements] = useState<Movement[]>(initialMovements);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<MovementType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<MovementStatus | 'all'>('all');
  const [filterWarehouse, setFilterWarehouse] = useState('all');

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = 
      movement.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || movement.type === filterType;
    const matchesStatus = filterStatus === 'all' || movement.status === filterStatus;
    const matchesWarehouse = filterWarehouse === 'all' || movement.warehouseId === filterWarehouse;
    
    return matchesSearch && matchesType && matchesStatus && matchesWarehouse;
  });

  const getTypeIcon = (type: MovementType) => {
    switch (type) {
      case 'entrada': return <ArrowDown className="w-4 h-4" />;
      case 'salida': return <ArrowUp className="w-4 h-4" />;
      case 'reintegro': return <RefreshCw className="w-4 h-4" />;
      case 'ajuste': return <Edit2 className="w-4 h-4" />;
      default: return <ArrowDown className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: MovementType) => {
    switch (type) {
      case 'entrada': return 'bg-green-100 text-green-800';
      case 'salida': return 'bg-red-100 text-red-800';
      case 'reintegro': return 'bg-blue-100 text-blue-800';
      case 'ajuste': return 'bg-purple-100 text-purple-800';
      case 'transferencia': return 'bg-orange-100 text-orange-800';
    }
  };

  const getStatusIcon = (status: MovementStatus) => {
    switch (status) {
      case 'aprobado': return <CheckCircle className="w-4 h-4" />;
      case 'rechazado': return <XCircle className="w-4 h-4" />;
      case 'pendiente': return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: MovementStatus) => {
    switch (status) {
      case 'aprobado': return 'bg-green-100 text-green-800';
      case 'rechazado': return 'bg-red-100 text-red-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Estadísticas rápidas
  const totalEntradas = movements.filter(m => m.type === 'entrada').length;
  const totalSalidas = movements.filter(m => m.type === 'salida').length;
  const totalPendientes = movements.filter(m => m.status === 'pendiente').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Movimientos</h2>
          <p className="text-gray-600 mt-1">
            {filteredMovements.length} de {movements.length} movimientos
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Registrar Movimiento
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Entradas</div>
              <div className="text-2xl text-gray-900 mt-1">{totalEntradas}</div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowDown className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Salidas</div>
              <div className="text-2xl text-gray-900 mt-1">{totalSalidas}</div>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <ArrowUp className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Pendientes</div>
              <div className="text-2xl text-gray-900 mt-1">{totalPendientes}</div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="lg:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filtro por tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as MovementType | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
            <option value="reintegro">Reintegros</option>
            <option value="ajuste">Ajustes</option>
            <option value="transferencia">Transferencias</option>
          </select>

          {/* Filtro por estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as MovementStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado">Rechazados</option>
          </select>

          {/* Filtro por almacén */}
          {currentUser.role === 'super_admin' && (
            <select
              value={filterWarehouse}
              onChange={(e) => setFilterWarehouse(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los almacenes</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tabla de movimientos */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Cantidad</th>
                {currentUser.role === 'super_admin' && (
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Almacén</th>
                )}
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Motivo</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Responsable</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMovements.map(movement => {
                const warehouse = warehouses.find(w => w.id === movement.warehouseId);
                
                return (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{new Date(movement.date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(movement.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full ${getTypeColor(movement.type)}`}>
                        {getTypeIcon(movement.type)}
                        {movement.type.charAt(0).toUpperCase() + movement.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{movement.productName}</div>
                      <div className="text-xs text-gray-500">{movement.productCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${movement.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.type === 'entrada' ? '+' : '-'}{Math.abs(movement.quantity)}
                      </span>
                    </td>
                    {currentUser.role === 'super_admin' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div 
                          className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs"
                          style={{ backgroundColor: `${warehouse?.color}20`, color: warehouse?.color }}
                        >
                          {movement.warehouseName}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {movement.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {movement.responsibleUser}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full ${getStatusColor(movement.status)}`}>
                        {getStatusIcon(movement.status)}
                        {movement.status.charAt(0).toUpperCase() + movement.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {movement.status === 'pendiente' && currentUser.role === 'super_admin' && (
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-green-600 hover:bg-green-50 rounded" title="Aprobar">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-red-600 hover:bg-red-50 rounded" title="Rechazar">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {movement.status !== 'pendiente' && (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredMovements.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <RefreshCw className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <div>No se encontraron movimientos</div>
            <div className="text-sm mt-1">Intenta ajustar los filtros de búsqueda</div>
          </div>
        )}
      </div>
    </div>
  );
}