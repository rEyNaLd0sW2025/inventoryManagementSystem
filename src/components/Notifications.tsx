import { useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, XCircle, Trash2, Check } from 'lucide-react';
import { notifications as initialNotifications } from '../data/mockData';
import { Notification, NotificationType } from '../types';

interface NotificationsProps {
  onNavigate: (page: string, data?: any) => void;
}

export function Notifications({ onNavigate }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(n => 
    filter === 'all' || !n.read
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: NotificationType, severity: string) => {
    if (severity === 'success') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (severity === 'error') return <XCircle className="w-5 h-5 text-red-600" />;
    if (severity === 'warning') return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    return <Info className="w-5 h-5 text-blue-600" />;
  };

  const getNotificationColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-orange-50 border-orange-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Navegar según el tipo de notificación
    if (notification.relatedId) {
      if (notification.type === 'solicitud_compra') {
        onNavigate('purchases');
      } else if (notification.type === 'transferencia') {
        onNavigate('transfers');
      } else if (notification.type === 'stock_minimo' || notification.type === 'stock_cero') {
        onNavigate('inventory');
      } else if (notification.type === 'nuevo_producto') {
        onNavigate('inventory');
      } else {
        onNavigate('movements');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Notificaciones</h2>
          <p className="text-gray-600 mt-1">
            {unreadCount} {unreadCount === 1 ? 'notificación no leída' : 'notificaciones no leídas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Check className="w-4 h-4" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'unread' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            No leídas ({unreadCount})
          </button>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id}
              className={`bg-white rounded-lg border-2 transition-all ${
                notification.read 
                  ? 'border-gray-200 opacity-75' 
                  : `${getNotificationColor(notification.severity)} border-2`
              } hover:shadow-md cursor-pointer`}
            >
              <div 
                className="p-4"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type, notification.severity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h4 className="text-gray-900">{notification.title}</h4>
                      {!notification.read && (
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{new Date(notification.date).toLocaleDateString()}</span>
                      <span>{new Date(notification.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {notification.warehouseName && (
                        <>
                          <span>•</span>
                          <span>{notification.warehouseName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Marcar como leída"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <div>No hay notificaciones</div>
            <div className="text-sm mt-1">
              {filter === 'unread' 
                ? 'No tienes notificaciones sin leer' 
                : 'No tienes ninguna notificación'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
