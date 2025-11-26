import { 
  Warehouse, 
  Product, 
  Movement, 
  Transfer, 
  PurchaseRequest, 
  Notification, 
  Alert,
  HistoryEntry,
  User 
} from '../types';

// Usuarios del sistema
export const users: User[] = [
  {
    id: '1',
    name: 'Admin Principal',
    email: 'admin@empresa.com',
    role: 'super_admin'
  },
  {
    id: '2',
    name: 'Carlos Mendez',
    email: 'carlos.mendez@empresa.com',
    role: 'warehouse_user',
    warehouseId: 'w2',
    warehouseName: 'Almacén de Producción'
  },
  {
    id: '3',
    name: 'María González',
    email: 'maria.gonzalez@empresa.com',
    role: 'warehouse_user',
    warehouseId: 'w3',
    warehouseName: 'Almacén de Mantenimiento'
  },
  {
    id: '4',
    name: 'Pedro Ramírez',
    email: 'pedro.ramirez@empresa.com',
    role: 'warehouse_user',
    warehouseId: 'w4',
    warehouseName: 'Almacén de TI'
  },
  {
    id: '5',
    name: 'Ana López',
    email: 'ana.lopez@empresa.com',
    role: 'warehouse_user',
    warehouseId: 'w5',
    warehouseName: 'Almacén de Calidad'
  }
];

// Usuario actual (puede cambiar para simular diferentes roles)
export let currentUser: User = users[0]; // Por defecto Super Admin

export const setCurrentUser = (userId: string) => {
  const user = users.find(u => u.id === userId);
  if (user) {
    currentUser = user;
  }
};

// Almacenes
export const warehouses: Warehouse[] = [
  {
    id: 'w1',
    name: 'Almacén Principal',
    area: 'Administración',
    location: 'Edificio A - Piso 1',
    responsible: 'Admin Principal',
    color: '#3b82f6'
  },
  {
    id: 'w2',
    name: 'Almacén de Producción',
    area: 'Producción',
    location: 'Planta Industrial - Zona A',
    responsible: 'Carlos Mendez',
    color: '#10b981'
  },
  {
    id: 'w3',
    name: 'Almacén de Mantenimiento',
    area: 'Mantenimiento',
    location: 'Edificio B - Piso 2',
    responsible: 'María González',
    color: '#f59e0b'
  },
  {
    id: 'w4',
    name: 'Almacén de TI',
    area: 'Tecnología',
    location: 'Edificio A - Piso 3',
    responsible: 'Pedro Ramírez',
    color: '#8b5cf6'
  },
  {
    id: 'w5',
    name: 'Almacén de Calidad',
    area: 'Control de Calidad',
    location: 'Planta Industrial - Zona B',
    responsible: 'Ana López',
    color: '#ec4899'
  }
];

// Productos
export const products: Product[] = [
  {
    id: 'p1',
    code: 'PROD-001',
    name: 'Tornillo Hexagonal M8',
    category: 'Ferretería',
    subcategory: 'Tornillería',
    unit: 'Unidad',
    technicalDescription: 'Tornillo hexagonal de acero inoxidable M8x20mm, acabado brillante, resistencia 8.8',
    warehouseId: 'w2',
    warehouseName: 'Almacén de Producción',
    physicalLocation: 'Estante A-12',
    minStock: 500,
    maxStock: 5000,
    currentStock: 1250,
    cost: 0.25,
    status: 'activo',
    createdBy: 'Carlos Mendez',
    createdAt: '2024-01-15T10:30:00',
    updatedAt: '2024-11-20T14:22:00'
  },
  {
    id: 'p2',
    code: 'PROD-002',
    name: 'Aceite Lubricante Industrial 5L',
    category: 'Lubricantes',
    subcategory: 'Aceites',
    unit: 'Litro',
    technicalDescription: 'Aceite mineral de grado industrial ISO VG 68, temperatura de trabajo -20°C a 120°C',
    warehouseId: 'w3',
    warehouseName: 'Almacén de Mantenimiento',
    physicalLocation: 'Zona Inflamables - Estante C-05',
    minStock: 20,
    maxStock: 200,
    currentStock: 45,
    cost: 12.50,
    status: 'activo',
    createdBy: 'María González',
    createdAt: '2024-02-10T09:15:00',
    updatedAt: '2024-11-22T11:30:00'
  },
  {
    id: 'p3',
    code: 'PROD-003',
    name: 'Cable de Red Cat6 UTP',
    category: 'Informática',
    subcategory: 'Cables',
    unit: 'Metro',
    technicalDescription: 'Cable UTP categoría 6, 4 pares trenzados, certificación TIA/EIA-568-B, color azul',
    warehouseId: 'w4',
    warehouseName: 'Almacén de TI',
    physicalLocation: 'Rack R-07',
    minStock: 100,
    maxStock: 1000,
    currentStock: 15,
    cost: 0.80,
    status: 'activo',
    createdBy: 'Pedro Ramírez',
    createdAt: '2024-01-20T13:45:00',
    updatedAt: '2024-11-25T09:15:00'
  },
  {
    id: 'p4',
    code: 'PROD-004',
    name: 'Rodamiento 6205-2RS',
    category: 'Mecánica',
    subcategory: 'Rodamientos',
    unit: 'Unidad',
    technicalDescription: 'Rodamiento rígido de bolas 6205-2RS, sellado doble, diámetro interior 25mm, exterior 52mm',
    warehouseId: 'w2',
    warehouseName: 'Almacén de Producción',
    physicalLocation: 'Estante B-08',
    minStock: 50,
    maxStock: 300,
    currentStock: 85,
    cost: 8.75,
    status: 'activo',
    createdBy: 'Carlos Mendez',
    createdAt: '2024-03-05T11:20:00',
    updatedAt: '2024-11-23T16:45:00'
  },
  {
    id: 'p5',
    code: 'PROD-005',
    name: 'Guantes de Nitrilo Talla M',
    category: 'Seguridad',
    subcategory: 'EPP',
    unit: 'Caja',
    technicalDescription: 'Guantes desechables de nitrilo, color azul, sin polvo, ambidiestros, caja x100 unidades',
    warehouseId: 'w5',
    warehouseName: 'Almacén de Calidad',
    physicalLocation: 'Estante EPP-03',
    minStock: 30,
    maxStock: 200,
    currentStock: 48,
    cost: 15.00,
    status: 'activo',
    createdBy: 'Ana López',
    createdAt: '2024-02-28T08:30:00',
    updatedAt: '2024-11-24T10:00:00'
  },
  {
    id: 'p6',
    code: 'PROD-006',
    name: 'Válvula Neumática 1/4"',
    category: 'Neumática',
    subcategory: 'Válvulas',
    unit: 'Unidad',
    technicalDescription: 'Válvula solenoide neumática 5/2 vías, rosca 1/4" NPT, presión máx 10 bar, 24VDC',
    warehouseId: 'w3',
    warehouseName: 'Almacén de Mantenimiento',
    physicalLocation: 'Estante D-15',
    minStock: 10,
    maxStock: 50,
    currentStock: 22,
    cost: 45.00,
    status: 'activo',
    createdBy: 'María González',
    createdAt: '2024-04-12T14:10:00',
    updatedAt: '2024-11-21T15:20:00'
  },
  {
    id: 'p7',
    code: 'PROD-007',
    name: 'Switch Gigabit 24 puertos',
    category: 'Informática',
    subcategory: 'Redes',
    unit: 'Unidad',
    technicalDescription: 'Switch Ethernet no administrable 24 puertos 10/100/1000 Mbps, montaje en rack 19"',
    warehouseId: 'w4',
    warehouseName: 'Almacén de TI',
    physicalLocation: 'Rack R-02',
    minStock: 2,
    maxStock: 10,
    currentStock: 5,
    cost: 180.00,
    status: 'activo',
    createdBy: 'Pedro Ramírez',
    createdAt: '2024-03-18T10:50:00',
    updatedAt: '2024-11-19T13:35:00'
  },
  {
    id: 'p8',
    code: 'PROD-008',
    name: 'Pasta Térmica 5g',
    category: 'Informática',
    subcategory: 'Consumibles',
    unit: 'Unidad',
    technicalDescription: 'Pasta térmica de alta conductividad 5g, rango temperatura -50°C a 150°C',
    warehouseId: 'w4',
    warehouseName: 'Almacén de TI',
    physicalLocation: 'Estante E-04',
    minStock: 20,
    maxStock: 100,
    currentStock: 0,
    cost: 3.50,
    status: 'activo',
    createdBy: 'Pedro Ramírez',
    createdAt: '2024-05-22T09:25:00',
    updatedAt: '2024-11-25T08:00:00'
  },
  {
    id: 'p9',
    code: 'PROD-009',
    name: 'Sensor de Temperatura PT100',
    category: 'Instrumentación',
    subcategory: 'Sensores',
    unit: 'Unidad',
    technicalDescription: 'Sensor PT100 clase A, rango -50°C a 250°C, conexión 3 hilos, vaina L=100mm',
    warehouseId: 'w2',
    warehouseName: 'Almacén de Producción',
    physicalLocation: 'Estante F-20',
    minStock: 5,
    maxStock: 30,
    currentStock: 12,
    cost: 65.00,
    status: 'en_revision',
    createdBy: 'Carlos Mendez',
    createdAt: '2024-06-15T11:40:00',
    updatedAt: '2024-11-24T14:10:00'
  },
  {
    id: 'p10',
    code: 'PROD-010',
    name: 'Cinta Adhesiva Doble Cara',
    category: 'Oficina',
    subcategory: 'Adhesivos',
    unit: 'Rollo',
    technicalDescription: 'Cinta adhesiva doble cara 12mm x 10m, base espuma, uso interior',
    warehouseId: 'w1',
    warehouseName: 'Almacén Principal',
    physicalLocation: 'Estante G-01',
    minStock: 50,
    maxStock: 300,
    currentStock: 180,
    cost: 2.20,
    status: 'activo',
    createdBy: 'Admin Principal',
    createdAt: '2024-07-08T15:30:00',
    updatedAt: '2024-11-20T16:50:00'
  }
];

// Movimientos
export const movements: Movement[] = [
  {
    id: 'm1',
    type: 'entrada',
    productId: 'p1',
    productName: 'Tornillo Hexagonal M8',
    productCode: 'PROD-001',
    quantity: 500,
    warehouseId: 'w2',
    warehouseName: 'Almacén de Producción',
    date: '2024-11-20T09:30:00',
    reason: 'Compra a proveedor ACME Corp',
    document: 'OC-2024-1145',
    responsibleUser: 'Carlos Mendez',
    status: 'aprobado'
  },
  {
    id: 'm2',
    type: 'salida',
    productId: 'p3',
    productName: 'Cable de Red Cat6 UTP',
    productCode: 'PROD-003',
    quantity: 85,
    warehouseId: 'w4',
    warehouseName: 'Almacén de TI',
    date: '2024-11-25T08:15:00',
    reason: 'Instalación de red en edificio C',
    document: 'REQ-TI-552',
    responsibleUser: 'Pedro Ramírez',
    status: 'aprobado'
  },
  {
    id: 'm3',
    type: 'reintegro',
    productId: 'p5',
    productName: 'Guantes de Nitrilo Talla M',
    productCode: 'PROD-005',
    quantity: 10,
    warehouseId: 'w5',
    warehouseName: 'Almacén de Calidad',
    date: '2024-11-24T14:20:00',
    reason: 'Material no utilizado de proyecto finalizado',
    document: 'PROY-QA-088',
    responsibleUser: 'Ana López',
    status: 'aprobado'
  },
  {
    id: 'm4',
    type: 'salida',
    productId: 'p8',
    productName: 'Pasta Térmica 5g',
    productCode: 'PROD-008',
    quantity: 15,
    warehouseId: 'w4',
    warehouseName: 'Almacén de TI',
    date: '2024-11-25T07:45:00',
    reason: 'Mantenimiento preventivo servidores',
    responsibleUser: 'Pedro Ramírez',
    status: 'aprobado'
  },
  {
    id: 'm5',
    type: 'entrada',
    productId: 'p2',
    productName: 'Aceite Lubricante Industrial 5L',
    productCode: 'PROD-002',
    quantity: 30,
    warehouseId: 'w3',
    warehouseName: 'Almacén de Mantenimiento',
    date: '2024-11-22T10:00:00',
    reason: 'Reposición stock regular',
    document: 'OC-2024-1189',
    responsibleUser: 'María González',
    status: 'aprobado'
  },
  {
    id: 'm6',
    type: 'ajuste',
    productId: 'p4',
    productName: 'Rodamiento 6205-2RS',
    productCode: 'PROD-004',
    quantity: -5,
    warehouseId: 'w2',
    warehouseName: 'Almacén de Producción',
    date: '2024-11-23T16:30:00',
    reason: 'Ajuste por conteo físico - diferencia encontrada',
    responsibleUser: 'Carlos Mendez',
    status: 'pendiente',
    observations: 'Requiere aprobación del Super Admin'
  },
  {
    id: 'm7',
    type: 'salida',
    productId: 'p6',
    productName: 'Válvula Neumática 1/4"',
    productCode: 'PROD-006',
    quantity: 3,
    warehouseId: 'w3',
    warehouseName: 'Almacén de Mantenimiento',
    date: '2024-11-21T13:15:00',
    reason: 'Reparación línea producción 3',
    document: 'OT-MANT-778',
    responsibleUser: 'María González',
    status: 'aprobado'
  }
];

// Transferencias
export const transfers: Transfer[] = [
  {
    id: 't1',
    productId: 'p1',
    productName: 'Tornillo Hexagonal M8',
    productCode: 'PROD-001',
    quantity: 200,
    originWarehouseId: 'w2',
    originWarehouseName: 'Almacén de Producción',
    destinationWarehouseId: 'w3',
    destinationWarehouseName: 'Almacén de Mantenimiento',
    requestDate: '2024-11-24T11:00:00',
    status: 'aprobado',
    reason: 'Necesarios para proyecto de mantenimiento preventivo',
    requestedBy: 'María González',
    approvedBy: 'Carlos Mendez',
    receivedDate: '2024-11-24T15:30:00'
  },
  {
    id: 't2',
    productId: 'p3',
    productName: 'Cable de Red Cat6 UTP',
    productCode: 'PROD-003',
    quantity: 50,
    originWarehouseId: 'w1',
    originWarehouseName: 'Almacén Principal',
    destinationWarehouseId: 'w4',
    destinationWarehouseName: 'Almacén de TI',
    requestDate: '2024-11-25T09:00:00',
    status: 'pendiente',
    reason: 'Reposición urgente para instalación en curso',
    requestedBy: 'Pedro Ramírez',
    observations: 'Urgente - proyecto con plazo cercano'
  },
  {
    id: 't3',
    productId: 'p5',
    productName: 'Guantes de Nitrilo Talla M',
    productCode: 'PROD-005',
    quantity: 15,
    originWarehouseId: 'w5',
    originWarehouseName: 'Almacén de Calidad',
    destinationWarehouseId: 'w2',
    destinationWarehouseName: 'Almacén de Producción',
    requestDate: '2024-11-23T14:20:00',
    status: 'rechazado',
    reason: 'Solicitud para operarios de línea',
    requestedBy: 'Carlos Mendez',
    observations: 'Rechazado: Los EPP deben solicitarse directamente a RRHH'
  },
  {
    id: 't4',
    productId: 'p2',
    productName: 'Aceite Lubricante Industrial 5L',
    productCode: 'PROD-002',
    quantity: 10,
    originWarehouseId: 'w3',
    originWarehouseName: 'Almacén de Mantenimiento',
    destinationWarehouseId: 'w2',
    destinationWarehouseName: 'Almacén de Producción',
    requestDate: '2024-11-25T10:30:00',
    status: 'pendiente',
    reason: 'Lubricación de maquinaria en planta',
    requestedBy: 'Carlos Mendez'
  }
];

// Solicitudes de compra
export const purchaseRequests: PurchaseRequest[] = [
  {
    id: 'pr1',
    productId: 'p8',
    productName: 'Pasta Térmica 5g',
    productCode: 'PROD-008',
    quantity: 50,
    warehouseId: 'w4',
    warehouseName: 'Almacén de TI',
    requestDate: '2024-11-25T08:30:00',
    reason: 'Stock en cero - necesario para mantenimiento programado',
    urgency: 'urgente',
    observations: 'Stock completamente agotado, mantenimiento programado para próxima semana',
    status: 'pendiente',
    requestedBy: 'Pedro Ramírez'
  },
  {
    id: 'pr2',
    productId: 'p3',
    productName: 'Cable de Red Cat6 UTP',
    productCode: 'PROD-003',
    quantity: 300,
    warehouseId: 'w4',
    warehouseName: 'Almacén de TI',
    requestDate: '2024-11-25T09:00:00',
    reason: 'Stock crítico - por debajo del mínimo',
    urgency: 'alta',
    observations: 'Proyecto de expansión de red requiere material en 2 semanas',
    status: 'pendiente',
    requestedBy: 'Pedro Ramírez'
  },
  {
    id: 'pr3',
    productId: 'p4',
    productName: 'Rodamiento 6205-2RS',
    productCode: 'PROD-004',
    quantity: 100,
    warehouseId: 'w2',
    warehouseName: 'Almacén de Producción',
    requestDate: '2024-11-20T11:15:00',
    reason: 'Reposición stock preventivo',
    urgency: 'media',
    status: 'aprobado',
    requestedBy: 'Carlos Mendez',
    reviewedBy: 'Admin Principal',
    reviewDate: '2024-11-21T09:00:00',
    reviewNotes: 'Aprobado - proceder con orden de compra'
  },
  {
    id: 'pr4',
    productName: 'Cinta Teflon 1/2"',
    quantity: 200,
    warehouseId: 'w3',
    warehouseName: 'Almacén de Mantenimiento',
    requestDate: '2024-11-22T15:45:00',
    reason: 'Producto nuevo - no existe en sistema',
    urgency: 'media',
    observations: 'Material para mantenimiento de sistemas de aire comprimido',
    status: 'en_correccion',
    requestedBy: 'María González',
    reviewedBy: 'Admin Principal',
    reviewDate: '2024-11-23T10:30:00',
    reviewNotes: 'Requiere especificaciones técnicas completas antes de aprobar'
  },
  {
    id: 'pr5',
    productId: 'p7',
    productName: 'Switch Gigabit 24 puertos',
    productCode: 'PROD-007',
    quantity: 5,
    warehouseId: 'w4',
    warehouseName: 'Almacén de TI',
    requestDate: '2024-11-18T14:20:00',
    reason: 'Expansión de infraestructura de red',
    urgency: 'baja',
    status: 'rechazado',
    requestedBy: 'Pedro Ramírez',
    reviewedBy: 'Admin Principal',
    reviewDate: '2024-11-19T09:15:00',
    reviewNotes: 'Rechazado - stock actual suficiente. Reevaluar en próximo trimestre'
  }
];

// Notificaciones
export const notifications: Notification[] = [
  {
    id: 'n1',
    type: 'stock_minimo',
    title: 'Stock crítico',
    message: 'Cable de Red Cat6 UTP está por debajo del stock mínimo (15/100)',
    warehouseId: 'w4',
    warehouseName: 'Almacén de TI',
    date: '2024-11-25T09:15:00',
    read: false,
    relatedId: 'p3',
    severity: 'error'
  },
  {
    id: 'n2',
    type: 'stock_cero',
    title: 'Stock agotado',
    message: 'Pasta Térmica 5g tiene stock en cero',
    warehouseId: 'w4',
    warehouseName: 'Almacén de TI',
    date: '2024-11-25T08:00:00',
    read: false,
    relatedId: 'p8',
    severity: 'error'
  },
  {
    id: 'n3',
    type: 'solicitud_compra',
    title: 'Nueva solicitud de compra',
    message: 'Pedro Ramírez ha creado una solicitud urgente para Pasta Térmica 5g',
    warehouseId: 'w4',
    warehouseName: 'Almacén de TI',
    date: '2024-11-25T08:30:00',
    read: false,
    relatedId: 'pr1',
    severity: 'warning'
  },
  {
    id: 'n4',
    type: 'transferencia',
    title: 'Solicitud de transferencia pendiente',
    message: 'Pedro Ramírez solicita transferencia de 50m de Cable de Red Cat6 UTP',
    warehouseId: 'w4',
    warehouseName: 'Almacén de TI',
    date: '2024-11-25T09:00:00',
    read: false,
    relatedId: 't2',
    severity: 'info'
  },
  {
    id: 'n5',
    type: 'ajuste',
    title: 'Ajuste de inventario pendiente',
    message: 'Carlos Mendez ha registrado un ajuste de -5 unidades en Rodamiento 6205-2RS',
    warehouseId: 'w2',
    warehouseName: 'Almacén de Producción',
    date: '2024-11-23T16:30:00',
    read: true,
    relatedId: 'm6',
    severity: 'warning'
  },
  {
    id: 'n6',
    type: 'aprobacion',
    title: 'Solicitud de compra aprobada',
    message: 'Su solicitud de Rodamiento 6205-2RS ha sido aprobada',
    warehouseId: 'w2',
    warehouseName: 'Almacén de Producción',
    date: '2024-11-21T09:00:00',
    read: true,
    relatedId: 'pr3',
    severity: 'success'
  },
  {
    id: 'n7',
    type: 'nuevo_producto',
    title: 'Nuevo producto creado',
    message: 'Se ha creado el producto Sensor de Temperatura PT100 en estado de revisión',
    warehouseId: 'w2',
    warehouseName: 'Almacén de Producción',
    date: '2024-11-24T14:10:00',
    read: true,
    relatedId: 'p9',
    severity: 'info'
  },
  {
    id: 'n8',
    type: 'entrada_salida',
    title: 'Movimiento significativo detectado',
    message: 'Salida de 85m de Cable de Red Cat6 UTP del Almacén de TI',
    warehouseId: 'w4',
    warehouseName: 'Almacén de TI',
    date: '2024-11-25T08:15:00',
    read: false,
    relatedId: 'm2',
    severity: 'info'
  }
];

// Alertas
export const alerts: Alert[] = [
  {
    id: 'a1',
    type: 'stock_cero',
    productId: 'p8',
    productName: 'Pasta Térmica 5g',
    warehouseId: 'w4',
    warehouseName: 'Almacén de TI',
    message: 'El producto tiene stock en cero',
    severity: 'error',
    date: '2024-11-25T08:00:00',
    resolved: false
  },
  {
    id: 'a2',
    type: 'stock_minimo',
    productId: 'p3',
    productName: 'Cable de Red Cat6 UTP',
    warehouseId: 'w4',
    warehouseName: 'Almacén de TI',
    message: 'Stock por debajo del mínimo permitido (15/100)',
    severity: 'warning',
    date: '2024-11-25T09:15:00',
    resolved: false
  },
  {
    id: 'a3',
    type: 'movimiento_sospechoso',
    productId: 'p2',
    productName: 'Aceite Lubricante Industrial 5L',
    warehouseId: 'w3',
    warehouseName: 'Almacén de Mantenimiento',
    message: 'Movimiento de cantidad elevada detectado (30 unidades)',
    severity: 'warning',
    date: '2024-11-22T10:00:00',
    resolved: true
  }
];

// Historial
export const history: HistoryEntry[] = [
  {
    id: 'h1',
    productId: 'p3',
    action: 'Salida de material',
    date: '2024-11-25T08:15:00',
    user: 'Pedro Ramírez',
    details: 'Salida de 85 metros para instalación de red en edificio C',
    previousValue: '100m',
    newValue: '15m'
  },
  {
    id: 'h2',
    productId: 'p3',
    action: 'Actualización de stock',
    date: '2024-11-20T14:22:00',
    user: 'Admin Principal',
    details: 'Corrección de inventario después de auditoría',
    previousValue: '95m',
    newValue: '100m'
  },
  {
    id: 'h3',
    productId: 'p8',
    action: 'Salida de material',
    date: '2024-11-25T07:45:00',
    user: 'Pedro Ramírez',
    details: 'Utilizado en mantenimiento preventivo de servidores',
    previousValue: '15 unidades',
    newValue: '0 unidades'
  },
  {
    id: 'h4',
    productId: 'p1',
    action: 'Entrada de material',
    date: '2024-11-20T09:30:00',
    user: 'Carlos Mendez',
    details: 'Compra a proveedor ACME Corp - OC-2024-1145',
    previousValue: '750 unidades',
    newValue: '1250 unidades'
  },
  {
    id: 'h5',
    productId: 'p9',
    action: 'Cambio de estado',
    date: '2024-11-24T14:10:00',
    user: 'Admin Principal',
    details: 'Estado cambiado a "En revisión" para validación técnica',
    previousValue: 'Activo',
    newValue: 'En revisión'
  },
  {
    id: 'h6',
    productId: 'p9',
    action: 'Creación de producto',
    date: '2024-06-15T11:40:00',
    user: 'Carlos Mendez',
    details: 'Producto creado para área de producción',
    previousValue: '-',
    newValue: 'Creado'
  }
];