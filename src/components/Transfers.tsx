import { useState } from 'react';
import { Plus, Search, ArrowRightLeft, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import { transfers as initialTransfers, warehouses } from '../data/mockData';
import { Transfer, MovementStatus, User } from '../types';

interface TransfersProps {
  onNavigate: (page: string, data?: any) => void;
  currentUser: User;
}

export function Transfers({ onNavigate, currentUser }: TransfersProps) {
  const [transfers] = useState<Transfer[]>(initialTransfers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<MovementStatus | 'all'>('all');

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = 
      transfer.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || transfer.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: MovementStatus) => {
    switch (status) {
      case 'aprobado': return <CheckCircle className="w-4 h-4" />;
      case 'rechazado': return <XCircle className="w-4 h-4" />;
      case 'pendiente': return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: MovementStatus) => {
    switch (status) {
      case 'aprobado': return 'bg-green-100 text-green-800 border-green-200';
      case 'rechazado': return 'bg-red-100 text-red-800 border-red-200';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  // Estadísticas
  const totalPendientes = transfers.filter(t => t.status === 'pendiente').length;
  const totalAprobadas = transfers.filter(t => t.status === 'aprobado').length;
  const totalRechazadas = transfers.filter(t => t.status === 'rechazado').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Transferencias entre Almacenes</h2>
          <p className="text-gray-600 mt-1">
            {filteredTransfers.length} de {transfers.length} transferencias
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Nueva Transferencia
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Aprobadas</div>
              <div className="text-2xl text-gray-900 mt-1">{totalAprobadas}</div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Rechazadas</div>
              <div className="text-2xl text-gray-900 mt-1">{totalRechazadas}</div>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar transferencias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as MovementStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobado">Aprobadas</option>
            <option value="rechazado">Rechazadas</option>
          </select>
        </div>
      </div>

      {/* Lista de transferencias */}
      <div className="space-y-4">
        {filteredTransfers.map(transfer => {
          const originWarehouse = warehouses.find(w => w.id === transfer.originWarehouseId);
          const destinationWarehouse = warehouses.find(w => w.id === transfer.destinationWarehouseId);

          return (
            <div 
              key={transfer.id} 
              className={`bg-white rounded-lg border-2 ${getStatusColor(transfer.status)} p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-gray-900">{transfer.productName}</h3>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full ${getStatusColor(transfer.status)}`}>
                      {getStatusIcon(transfer.status)}
                      {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">Código: {transfer.productCode}</div>
                  <div className="text-sm text-gray-600">Cantidad: {transfer.quantity} unidades</div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-500">Fecha de solicitud</div>
                  <div className="text-sm text-gray-900">{new Date(transfer.requestDate).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(transfer.requestDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Flujo de transferencia */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Origen</div>
                  <div 
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm"
                    style={{ backgroundColor: `${originWarehouse?.color}20`, color: originWarehouse?.color }}
                  >
                    <Package className="w-3 h-3" />
                    {transfer.originWarehouseName}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <ArrowRightLeft className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Destino</div>
                  <div 
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm"
                    style={{ backgroundColor: `${destinationWarehouse?.color}20`, color: destinationWarehouse?.color }}
                  >
                    <Package className="w-3 h-3" />
                    {transfer.destinationWarehouseName}
                  </div>
                </div>
              </div>

              {/* Motivo */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Motivo de la transferencia</div>
                <div className="text-sm text-gray-900">{transfer.reason}</div>
              </div>

              {/* Información adicional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Solicitado por: </span>
                  <span className="text-gray-900">{transfer.requestedBy}</span>
                </div>
                
                {transfer.approvedBy && (
                  <div>
                    <span className="text-gray-500">Aprobado por: </span>
                    <span className="text-gray-900">{transfer.approvedBy}</span>
                  </div>
                )}
                
                {transfer.receivedDate && (
                  <div>
                    <span className="text-gray-500">Fecha de recepción: </span>
                    <span className="text-gray-900">{new Date(transfer.receivedDate).toLocaleDateString()}</span>
                  </div>
                )}

                {transfer.observations && (
                  <div className="md:col-span-2">
                    <span className="text-gray-500">Observaciones: </span>
                    <span className="text-gray-900">{transfer.observations}</span>
                  </div>
                )}
              </div>

              {/* Acciones (solo para pendientes y super admin) */}
              {transfer.status === 'pendiente' && currentUser.role === 'super_admin' && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <CheckCircle className="w-4 h-4" />
                    Aprobar
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    <XCircle className="w-4 h-4" />
                    Rechazar
                  </button>
                </div>
              )}

              {/* Confirmar recepción (solo para aprobadas, almacén destino) */}
              {transfer.status === 'aprobado' && !transfer.receivedDate && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <CheckCircle className="w-4 h-4" />
                    Confirmar Recepción
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredTransfers.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <div>No se encontraron transferencias</div>
            <div className="text-sm mt-1">Intenta ajustar los filtros de búsqueda</div>
          </div>
        )}
      </div>
    </div>
  );
}