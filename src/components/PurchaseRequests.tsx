import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Package,
  Pause,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
  Warehouse,
  Building,
  Factory,
  Store,
  Check,
  X,
  Eye,
  FileText,
  ShoppingBag,
  Truck,
  PackageCheck,
  PackageX,
  Grid,
  List,
  Filter,
  Star,
  Heart,
  ShoppingBasket,
  BarChart3,
  User,
  Bell,
  Home,
  Tag,
  DollarSign,
  Percent,
  Truck as TruckIcon,
  Minus,
  Trash2,
  MessageSquare,
  Info,
  Shield,
  Layers,
  TrendingUp,
  Zap,
} from "lucide-react";

import { PurchaseRequest, RequestStatus, User, Notification } from "../types";
import { warehouses, products } from "../data/mockData";
import { createNotification } from "../services/notifications";

import {
  getStatusIcon,
  getStatusColor,
  getStatusLabel,
  getUrgencyColor,
  getUrgencyLabel,
  calculateRequestTotal,
  classifyRequest,
  findSimilarRequests,
  canDelete,
  sortRequestsByUrgencyAndDate,
  calculateRequestStats,
  validatePurchaseRequest,
} from "../utils/purchaseRequestUtils";

import {
  usePurchaseRequestFiltering,
  usePurchaseRequestModals,
  usePurchaseRequestForm,
} from "../hooks/usePurchaseRequests";

import {
  handleApproveRequest,
  handleRejectRequest,
  handleObserveRequest,
  handlePutOnHoldRequest,
  handleUnifyRequests,
} from "../utils/purchaseRequestHandlers";

import {
  addItem,
  removeItem,
  updateItem,
  calculateItemsTotal,
} from "../utils/itemUtils";

interface PurchaseRequestsProps {
  onNavigate: (page: string, data?: any) => void;
  currentUser: User;
  requests: PurchaseRequest[];
  setRequests: (
    r: PurchaseRequest[] | ((prev: PurchaseRequest[]) => PurchaseRequest[])
  ) => void;
  setNotifications?: (
    n: Notification[] | ((prev: Notification[]) => Notification[])
  ) => void;
  products?: any[];
  setProducts?: (p: any[] | ((prev: any[]) => any[])) => void;
  movements?: any[];
  setMovements?: (m: any[] | ((prev: any[]) => any[])) => void;
  orders?: any[];
  setOrders?: (o: any[] | ((prev: any[]) => any[])) => void;
}

// Datos de ejemplo para categorías de productos
const productCategories = [
  {
    id: "all",
    name: "Todos",
    icon: Package,
    color: "bg-gray-100 text-gray-800",
  },
  {
    id: "herramientas",
    name: "Herramientas",
    icon: Package,
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "materiales",
    name: "Materiales",
    icon: Layers,
    color: "bg-green-100 text-green-800",
  },
  {
    id: "equipos",
    name: "Equipos",
    icon: Package,
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "suministros",
    name: "Suministros",
    icon: ShoppingBag,
    color: "bg-orange-100 text-orange-800",
  },
  {
    id: "electronicos",
    name: "Electrónicos",
    icon: Zap,
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    id: "oficina",
    name: "Oficina",
    icon: FileText,
    color: "bg-pink-100 text-pink-800",
  },
  {
    id: "seguridad",
    name: "Seguridad",
    icon: Shield,
    color: "bg-red-100 text-red-800",
  },
];

// Categorías de ejemplo para los productos
const categoryMapping: Record<string, string[]> = {
  herramientas: [
    "martillo",
    "taladro",
    "llave",
    "destornillador",
    "sierra",
    "herramienta",
  ],
  materiales: [
    "cemento",
    "arena",
    "ladrillo",
    "madera",
    "acero",
    "pintura",
    "material",
  ],
  equipos: ["equipo", "maquinaria", "generador", "compresor", "andamio"],
  suministros: ["guante", "mascarilla", "lente", "uniforme", "suministro"],
  electronicos: ["computadora", "tablet", "telefono", "monitor", "electronic"],
  oficina: ["papel", "lapiz", "cuaderno", "folder", "oficina"],
  seguridad: ["casco", "chaleco", "botas", "arnes", "seguridad"],
};

// Datos de ejemplo para productos del marketplace (enriquecidos)
const enhancedProducts = products.map((product) => {
  // Determinar categoría basada en el nombre del producto
  let category = "herramientas"; // default
  const productNameLower = product.name.toLowerCase();

  for (const [cat, keywords] of Object.entries(categoryMapping)) {
    if (keywords.some((keyword) => productNameLower.includes(keyword))) {
      category = cat;
      break;
    }
  }

  return {
    ...product,
    category: category,
    rating: (Math.random() * 0.5 + 4.0).toFixed(1), // Rating entre 4.0 y 4.5
    isPopular: Math.random() > 0.7,
    isNew: Math.random() > 0.8,
    deliveryTime: ["24h", "48h", "3-5 días"][Math.floor(Math.random() * 3)],
    description:
      product.description ||
      `Producto de alta calidad ${product.name} para uso industrial.`,
    supplier: ["Proveedor A", "Proveedor B", "Proveedor C"][
      Math.floor(Math.random() * 3)
    ],
    minOrder: Math.floor(Math.random() * 10) + 1,
    warranty: ["6 meses", "1 año", "2 años"][Math.floor(Math.random() * 3)],
  };
});

export function PurchaseRequests({
  onNavigate,
  currentUser,
  requests,
  setRequests,
  setNotifications,
  products: productsProp,
  setProducts: setProductsProp,
  movements: movementsProp,
  setMovements: setMovementsProp,
  orders: ordersProp,
  setOrders: setOrdersProp,
}: PurchaseRequestsProps) {
  const [viewMode, setViewMode] = useState<"market" | "requests">("market");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "stock" | "price">("name");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] =
    useState<string>("all");
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterUrgency,
    setFilterUrgency,
    filteredRequests,
    userRequests,
  } = usePurchaseRequestFiltering(requests, currentUser);

  const {
    showCreateModal,
    setShowCreateModal,
    showActionModal,
    setShowActionModal,
    selectedRequest,
    setSelectedRequest,
    actionNotes,
    setActionNotes,
    openActionModal,
    closeActionModal,
  } = usePurchaseRequestModals();

  const {
    editingRequest,
    form,
    setForm,
    expandedRequests,
    toggleRequestDetails,
    openEditModal,
    openCreateModal,
    closeModal,
    handleFormChange,
  } = usePurchaseRequestForm();

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockVerificationData, setStockVerificationData] = useState<any>(null);
  const [selectedRequestForStock, setSelectedRequestForStock] =
    useState<PurchaseRequest | null>(null);

  const sortedRequests = sortRequestsByUrgencyAndDate(filteredRequests);
  const stats = calculateRequestStats(userRequests);

  // Productos para el marketplace
  const marketplaceProducts = productsProp || enhancedProducts;

  // Filtrar y ordenar productos del marketplace
  const filteredProducts = marketplaceProducts
    .filter((product) => {
      if (categoryFilter === "all") return true;
      return product.category === categoryFilter;
    })
    .filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((product) => {
      if (selectedWarehouseFilter === "all") return true;
      return product.warehouseId === selectedWarehouseFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "stock":
          return b.currentStock - a.currentStock;
        case "price":
          return (b.price || 0) - (a.price || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Agregar producto al carrito
  const addToCart = (product: any) => {
    const existingItem = cartItems.find(
      (item) => item.productId === product.id
    );
    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          id: `cart_${Date.now()}_${product.id}`,
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          unit: product.unit || "unidad",
          unitPrice: product.price || 0,
          quantity: 1,
          warehouseId: product.warehouseId,
          warehouseName: product.warehouseName,
          availableStock: product.currentStock,
          category: product.category,
          image: product.image,
          minOrder: product.minOrder,
          deliveryTime: product.deliveryTime,
        },
      ]);
    }
  };

  // Remover del carrito
  const removeFromCart = (itemId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  // Actualizar cantidad en carrito
  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setCartItems(
      cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  // Ver detalles del producto
  const viewProductDetails = (product: any) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  // Enviar solicitud desde carrito
  const submitCartRequest = () => {
    if (cartItems.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    const newReq: PurchaseRequest = {
      id: `pr_${Date.now()}`,
      productId: cartItems[0].productId,
      productName:
        cartItems.length === 1
          ? cartItems[0].productName
          : "Solicitud múltiple desde Marketplace",
      productCode: cartItems[0].productCode,
      quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      items: cartItems.map((item, idx) => ({
        itemNumber: idx + 1,
        productId: item.productId,
        productCode: item.productCode,
        description: item.productName,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice,
      })),
      warehouseId: currentUser.warehouseId || "w1",
      warehouseName: currentUser.warehouseName || "Almacén Principal",
      requestDate: new Date().toISOString(),
      reason: `Solicitud desde marketplace - ${cartItems.length} productos`,
      urgency: "media",
      status: "pendiente",
      requestedBy: currentUser.name,
      estimatedPrice: cartItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      ),
      source: "marketplace",
    };

    setRequests([newReq, ...requests]);
    setCartItems([]);
    setShowCart(false);

    const notif = createNotification({
      type: "solicitud_compra",
      title: "🛒 Nueva solicitud desde Marketplace",
      message: `${currentUser.name} ha creado una solicitud con ${cartItems.length} productos`,
      warehouseId: newReq.warehouseId,
      warehouseName: newReq.warehouseName,
      read: false,
      relatedId: newReq.id,
      severity: "success",
    });

    if (setNotifications) setNotifications((prev) => [notif, ...prev]);
    alert("✅ Solicitud enviada exitosamente desde el carrito");
  };

  // Función original para verificar stock
  const getStockDataForRequest = (request: PurchaseRequest) => {
    const productList = productsProp ?? products;
    const product = productList.find(
      (p) =>
        p.id === request.productId ||
        p.code === request.productCode ||
        p.name === request.productName
    );

    let mainWarehouseStock = 0;
    let subWarehousesStock: Array<{ id: string; name: string; stock: number }> =
      [];

    if (product) {
      mainWarehouseStock =
        product.warehouseId === "w1" ? product.currentStock : 0;

      subWarehousesStock = productList
        .filter(
          (p) =>
            (p.id === request.productId ||
              p.code === request.productCode ||
              p.name === request.productName) &&
            p.warehouseId !== "w1" &&
            p.currentStock > 0
        )
        .map((p) => ({
          id: p.warehouseId,
          name: p.warehouseName,
          stock: p.currentStock,
        }));
    }

    if (!product) {
      if (request.quantity <= 1000) {
        mainWarehouseStock = 1500;
        subWarehousesStock = [
          { id: "w2", name: "Almacén de Producción", stock: 800 },
          { id: "w3", name: "Almacén de Mantenimiento", stock: 300 },
        ];
      } else {
        mainWarehouseStock = 100;
        subWarehousesStock = [
          { id: "w2", name: "Almacén de Producción", stock: 50 },
          { id: "w4", name: "Almacén de TI", stock: 75 },
        ];
      }
    }

    const isSufficient = mainWarehouseStock >= request.quantity;
    const missingQuantity = isSufficient
      ? 0
      : request.quantity - mainWarehouseStock;

    return {
      request,
      mainWarehouseStock,
      subWarehousesStock,
      isSufficient,
      missingQuantity,
      comparison: {
        requested: request.quantity,
        available: mainWarehouseStock,
        difference: request.quantity - mainWarehouseStock,
        percentage: Math.min(
          100,
          (mainWarehouseStock / request.quantity) * 100
        ),
      },
    };
  };

  // Funciones originales (se mantienen exactamente igual)
  const openStockVerificationModal = (request: PurchaseRequest) => {
    setSelectedRequestForStock(request);
    const stockData = getStockDataForRequest(request);
    setStockVerificationData(stockData);
    setShowStockModal(true);
  };

  const handleGenerateOutputOrder = () => {
    if (!selectedRequestForStock) return;

    const updatedRequests = requests.map((r) =>
      r.id === selectedRequestForStock.id
        ? {
            ...r,
            status: "en_curso" as RequestStatus,
            reviewedBy: currentUser.name,
            reviewDate: new Date().toISOString(),
            reviewNotes: `Orden de Salida generada - Stock AP: ${stockVerificationData?.mainWarehouseStock}, Solicitado: ${selectedRequestForStock.quantity}`,
            stockStatus: {
              previousStock: stockVerificationData?.mainWarehouseStock,
              newStock:
                stockVerificationData?.mainWarehouseStock -
                selectedRequestForStock.quantity,
              updatedAt: new Date().toISOString(),
            },
          }
        : r
    );

    setRequests(updatedRequests);

    const notif = createNotification({
      type: "solicitud_compra",
      title: "✅ Orden de Salida generada",
      message: `Se generó OS para ${selectedRequestForStock.productName} (${selectedRequestForStock.quantity} unidades)`,
      warehouseId: selectedRequestForStock.warehouseId,
      warehouseName: selectedRequestForStock.warehouseName,
      read: false,
      relatedId: selectedRequestForStock.id,
      severity: "success",
    });

    if (setNotifications) setNotifications((prev) => [notif, ...prev]);

    try {
      const osId = `OS-${selectedRequestForStock.id}-${Date.now()}`;
      const oiId = `OI-${selectedRequestForStock.id}-${Date.now()}`;

      const os = {
        id: osId,
        type: "salida",
        productId: selectedRequestForStock.productId || "",
        productName: selectedRequestForStock.productName,
        productCode: selectedRequestForStock.productCode || "",
        quantity: selectedRequestForStock.quantity,
        warehouseId: "w1",
        warehouseName: "Almacén Principal",
        date: new Date().toISOString(),
        reason: `OS generada desde solicitud ${selectedRequestForStock.id}`,
        document: undefined,
        responsibleUser: currentUser.name,
        status: "pendiente",
        destinationWarehouseId: selectedRequestForStock.warehouseId,
        destinationWarehouseName: selectedRequestForStock.warehouseName,
      };

      const oi = {
        id: oiId,
        type: "entrada",
        productId: selectedRequestForStock.productId || "",
        productName: selectedRequestForStock.productName,
        productCode: selectedRequestForStock.productCode || "",
        quantity: selectedRequestForStock.quantity,
        warehouseId: "w1",
        warehouseName: "Almacén Principal",
        date: new Date().toISOString(),
        reason: `OI generada desde solicitud ${selectedRequestForStock.id}`,
        document: undefined,
        responsibleUser: currentUser.name,
        status: "pendiente",
        destinationWarehouseId: selectedRequestForStock.warehouseId,
        destinationWarehouseName: selectedRequestForStock.warehouseName,
      };

      if (setMovementsProp)
        setMovementsProp((prev: any) => [os, oi, ...(prev || [])]);

      if (setOrdersProp) {
        const newOrder = {
          id: `op_${selectedRequestForStock.id}`,
          opNumber: `OP-${Date.now()}`,
          requester: selectedRequestForStock.requestedBy || currentUser.name,
          requesterId: selectedRequestForStock.requestedBy || "",
          warehouseId: selectedRequestForStock.warehouseId,
          warehouseName: selectedRequestForStock.warehouseName,
          requestDate: new Date().toISOString(),
          items: (selectedRequestForStock.items || []).map(
            (it: any, i: number) => ({
              itemNumber: i + 1,
              productId: it.productId,
              description: it.description,
              unit: it.unit,
              quantity: it.quantity,
              approvedQuantity: it.quantity,
              status: "disponible",
            })
          ),
          priority: selectedRequestForStock.urgency || "media",
          status: "procesada",
          generatedOS: [osId],
          generatedOI: [oiId],
        };
        setOrdersProp((prev: any) => [newOrder, ...(prev || [])]);
      }

      setShowStockModal(false);
      alert(
        `✅ Orden de Salida generada exitosamente para: ${selectedRequestForStock.productName}`
      );
    } catch (e) {
      setShowStockModal(false);
      alert("Error al generar documentos. Revisa la consola.");
      console.error(e);
    }
  };

  const handleGeneratePurchaseOrder = () => {
    if (!selectedRequestForStock) return;

    const updatedRequests = requests.map((r) =>
      r.id === selectedRequestForStock.id
        ? {
            ...r,
            status: "en_proceso_compra" as RequestStatus,
            reviewedBy: currentUser.name,
            reviewDate: new Date().toISOString(),
            reviewNotes: `Orden de Compra generada - Faltan ${stockVerificationData?.missingQuantity} unidades en AP`,
            purchaseOrderData: {
              missingQuantity: stockVerificationData?.missingQuantity,
              generatedAt: new Date().toISOString(),
              estimatedCost:
                stockVerificationData?.missingQuantity *
                (selectedRequestForStock.items?.[0]?.unitPrice || 0),
            },
          }
        : r
    );

    setRequests(updatedRequests);

    const notif = createNotification({
      type: "aprobacion",
      title: "📋 Orden de Compra generada",
      message: `Se generó OC para ${selectedRequestForStock.productName} (Faltan: ${stockVerificationData?.missingQuantity} unidades)`,
      warehouseId: selectedRequestForStock.warehouseId,
      warehouseName: selectedRequestForStock.warehouseName,
      read: false,
      relatedId: selectedRequestForStock.id,
      severity: "warning",
    });

    if (setNotifications) setNotifications((prev) => [notif, ...prev]);

    try {
      const ocId = `OC-${selectedRequestForStock.id}-${Date.now()}`;
      const oc = {
        id: ocId,
        type: "entrada",
        productId: selectedRequestForStock.productId || "",
        productName: selectedRequestForStock.productName,
        productCode: selectedRequestForStock.productCode || "",
        quantity: stockVerificationData?.missingQuantity || 0,
        warehouseId: "w1",
        warehouseName: "Almacén Principal",
        date: new Date().toISOString(),
        reason: `OC generada para solicitud ${selectedRequestForStock.id}`,
        document: ocId,
        responsibleUser: currentUser.name,
        status: "pendiente",
      };

      if (setMovementsProp)
        setMovementsProp((prev: any) => [oc, ...(prev || [])]);

      setShowStockModal(false);
      alert(
        `📋 Orden de Compra generada para: ${selectedRequestForStock.productName}`
      );
    } catch (e) {
      setShowStockModal(false);
      alert("Error al generar OC en el sistema.");
      console.error(e);
    }
  };

  const handleCreateOrUpdate = () => {
    const validation = validatePurchaseRequest(form);
    if (!validation.valid) {
      alert(validation.errors.join("\n"));
      return;
    }

    const totalQuantity = (form.items || []).reduce(
      (s: any, it: any) => s + (Number(it.quantity) || 0),
      0
    );

    if (editingRequest) {
      setRequests(
        requests.map((r) =>
          r.id === editingRequest.id
            ? ({
                ...r,
                ...(form as any),
                items: form.items,
                quantity: totalQuantity,
                status: "pendiente",
                requestDate: new Date().toISOString(),
              } as PurchaseRequest)
            : r
        )
      );

      const notif = createNotification({
        type: "solicitud_compra",
        title: "Solicitud modificada",
        message: `La solicitud ${editingRequest.productName} fue modificada y reenviada.`,
        warehouseId: editingRequest.warehouseId,
        warehouseName: editingRequest.warehouseName,
        read: false,
        relatedId: editingRequest.id,
        severity: "info",
      });

      if (setNotifications)
        setNotifications((prev: Notification[]) => [notif, ...prev]);
    } else {
      const newReq: PurchaseRequest = {
        id: `pr_${Date.now()}`,
        productId: form.productId,
        productName: form.items?.[0]?.description || "Solicitud múltiple",
        productCode: form.productCode,
        quantity: totalQuantity,
        items: form.items,
        warehouseId: form.warehouseId as string,
        warehouseName:
          warehouses.find((w) => w.id === form.warehouseId)?.name ||
          "Desconocido",
        requestDate: new Date().toISOString(),
        reason: form.reason || "",
        urgency: (form.urgency as any) || "media",
        observations: form.observations,
        status: "pendiente",
        requestedBy: currentUser.name,
        estimatedPrice: form.estimatedPrice,
      };

      setRequests([newReq, ...requests]);

      const notif = createNotification({
        type: "solicitud_compra",
        title: "Nueva solicitud de compra",
        message: `${currentUser.name} ha creado una nueva solicitud: ${newReq.productName}`,
        warehouseId: newReq.warehouseId,
        warehouseName: newReq.warehouseName,
        read: false,
        relatedId: newReq.id,
        severity: "warning",
      });

      if (setNotifications)
        setNotifications((prev: Notification[]) => [notif, ...prev]);
    }

    setShowCreateModal(false);
    closeModal();
  };

  const handleDelete = (request: PurchaseRequest) => {
    if (!canDelete(request)) return;
    if (!confirm("¿Eliminar esta solicitud? Esta acción no se puede deshacer."))
      return;
    setRequests(requests.filter((r) => r.id !== request.id));
  };

  const handleUnify = (request: PurchaseRequest) => {
    const similar = findSimilarRequests(request, requests);
    handleUnifyRequests(request, requests, setRequests, () => similar);
    alert("Solicitudes similares marcadas como 'En Espera' y vinculadas.");
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    await handleApproveRequest({
      selectedRequest,
      currentUser,
      actionNotes,
      requests,
      setRequests,
      onNotification: (notifData) => {
        const notif = createNotification(notifData);
        if (setNotifications)
          setNotifications((prev: Notification[]) => [notif, ...prev]);
      },
      onSuccess: () => {
        closeActionModal();
        setSelectedRequest(null);
        setActionNotes("");
      },
    });
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    handleRejectRequest({
      selectedRequest,
      currentUser,
      actionNotes,
      requests,
      setRequests,
      onNotification: (notifData) => {
        const notif = createNotification(notifData);
        if (setNotifications)
          setNotifications((prev: Notification[]) => [notif, ...prev]);
      },
      onSuccess: () => {
        closeActionModal();
        setSelectedRequest(null);
        setActionNotes("");
      },
    });
  };

  const handleObserve = () => {
    if (!selectedRequest) return;
    handleObserveRequest({
      selectedRequest,
      currentUser,
      actionNotes,
      requests,
      setRequests,
      onNotification: (notifData) => {
        const notif = createNotification(notifData);
        if (setNotifications)
          setNotifications((prev: Notification[]) => [notif, ...prev]);
      },
      onSuccess: () => {
        closeActionModal();
        setSelectedRequest(null);
        setActionNotes("");
      },
    });
  };

  const handlePutOnHold = () => {
    if (!selectedRequest) return;
    handlePutOnHoldRequest({
      selectedRequest,
      currentUser,
      actionNotes,
      requests,
      setRequests,
      onNotification: (notifData) => {
        const notif = createNotification(notifData);
        if (setNotifications) setNotifications((p) => [notif, ...p]);
      },
      onSuccess: () => {
        closeActionModal();
        setSelectedRequest(null);
        setActionNotes("");
      },
    });
  };

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Marketplace */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <ShoppingBasket className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Almacén<span className="text-blue-600">Market</span>
                  </h1>
                  <p className="text-xs text-gray-500">
                    Sistema de gestión de inventario
                  </p>
                </div>
              </div>

              <div className="hidden md:flex items-center space-x-6">
                <button
                  onClick={() => setViewMode("market")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    viewMode === "market"
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  <span>Marketplace</span>
                  {marketplaceProducts.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                      {marketplaceProducts.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setViewMode("requests")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors relative ${
                    viewMode === "requests"
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>Mis Solicitudes</span>
                  {userRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem]">
                      {userRequests.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={
                    viewMode === "market"
                      ? "Buscar productos..."
                      : "Buscar solicitudes..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>

              {/* Cart Button */}
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative p-2 hover:bg-gray-100 rounded-lg"
              >
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </button>

              {/* New Request Button */}
              <button
                onClick={() => {
                  openCreateModal();
                  setShowCreateModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva Solicitud</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === "market" ? (
          <>
            {/* Marketplace Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Catálogo de Productos
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Selecciona productos para solicitar al almacén principal
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 text-sm">Ordenar por:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="name">Nombre</option>
                      <option value="stock">Stock disponible</option>
                      <option value="price">Precio</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={selectedWarehouseFilter}
                      onChange={(e) =>
                        setSelectedWarehouseFilter(e.target.value)
                      }
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todos los almacenes</option>
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6 overflow-x-auto">
                <div className="flex space-x-2 pb-2">
                  {productCategories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setCategoryFilter(category.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                          categoryFilter === category.id
                            ? `${category.color
                                .replace("text-", "text-white ")
                                .replace("bg-", "bg-")} border-0`
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 font-medium">
                        Productos disponibles
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        {filteredProducts.length}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        en catálogo
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Package className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 font-medium">
                        En tu carrito
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        {cartItems.length}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        productos seleccionados
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <ShoppingCart className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 font-medium">
                        Stock total
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        {filteredProducts
                          .reduce((sum, p) => sum + p.currentStock, 0)
                          .toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        unidades disponibles
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <Warehouse className="w-6 h-6 text-purple-500" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 font-medium">
                        Valor total
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        $
                        {filteredProducts
                          .reduce(
                            (sum, p) => sum + p.currentStock * (p.price || 0),
                            0
                          )
                          .toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        en inventario
                      </div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <DollarSign className="w-6 h-6 text-orange-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-gray-600 mb-4">
                  Intenta con otros términos de búsqueda o ajusta los filtros
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("all");
                    setSelectedWarehouseFilter("all");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                    onViewDetails={() => viewProductDetails(product)}
                    cartItems={cartItems}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Existing Requests View (manteniendo las funcionalidades originales) */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentUser.role === "super_admin"
                    ? "Cola de Revisión de Ordenes de Pedido"
                    : "Mis Solicitudes de Ordenes de Pedido"}
                </h2>
                <p className="text-gray-600 mt-1">
                  {currentUser.role === "super_admin"
                    ? `${filteredRequests.length} solicitudes en revisión`
                    : `${filteredRequests.length} de ${userRequests.length} solicitudes`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode("market")}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Grid className="w-4 h-4" />
                  <span className="hidden sm:inline">Ir al Marketplace</span>
                </button>
                <button
                  onClick={() => {
                    openCreateModal();
                    setShowCreateModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nueva Solicitud</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                label="Pendientes"
                value={stats.totalPendientes}
                icon={Clock}
                bgColor="bg-yellow-100"
                textColor="text-yellow-600"
                iconColor="text-yellow-600"
              />
              <StatCard
                label="Aprobadas"
                value={stats.totalAprobadas}
                icon={CheckCircle}
                bgColor="bg-green-100"
                textColor="text-green-600"
                iconColor="text-green-600"
              />
              <StatCard
                label="Observadas"
                value={stats.totalObservadas}
                icon={Edit}
                bgColor="bg-orange-100"
                textColor="text-orange-600"
                iconColor="text-orange-600"
              />
              <StatCard
                label="En Espera"
                value={stats.totalEnEspera}
                icon={Pause}
                bgColor="bg-gray-100"
                textColor="text-gray-600"
                iconColor="text-gray-600"
              />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar solicitudes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as RequestStatus | "all")
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="urgente">Urgentes</option>
                  <option value="observada">Observadas</option>
                  <option value="en_espera">En Espera</option>
                  <option value="aprobado">Aprobadas</option>
                  <option value="rechazado">Rechazadas</option>
                  <option value="en_proceso_compra">En Proceso</option>
                  <option value="cerrada">Cerradas</option>
                </select>

                <select
                  value={filterUrgency}
                  onChange={(e) => setFilterUrgency(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tipo de Prioridad</option>
                  <option value="urgente">Urgente</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {sortedRequests.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <div className="text-gray-700">
                    No se encontraron solicitudes
                  </div>
                  <div className="text-sm mt-1 text-gray-500">
                    {currentUser.role === "super_admin"
                      ? "No hay solicitudes pendientes de revisión"
                      : "No tienes solicitudes. Crea una nueva para comenzar"}
                  </div>
                </div>
              ) : (
                sortedRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    currentUser={currentUser}
                    isExpanded={expandedRequests.has(request.id)}
                    onToggleExpand={() => toggleRequestDetails(request.id)}
                    onEdit={() => {
                      openEditModal(request);
                      setShowCreateModal(true);
                    }}
                    onDelete={() => handleDelete(request)}
                    onApprove={() => openActionModal("aprobar", request)}
                    onReject={() => openActionModal("rechazar", request)}
                    onObserve={() => openActionModal("observar", request)}
                    onPutOnHold={() => openActionModal("espera", request)}
                    onUnify={() => handleUnify(request)}
                    onVerifyStock={() => openStockVerificationModal(request)}
                    similarRequests={findSimilarRequests(request, requests)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      {showProductDetails && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Detalles del Producto
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Información completa del producto seleccionado
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProductDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Image/Info */}
                <div>
                  <div className="h-64 bg-gradient-to-br from-blue-50 to-gray-100 rounded-xl flex items-center justify-center mb-6">
                    <Package className="w-32 h-32 text-gray-400" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {selectedProduct.name}
                      </h4>
                      <p className="text-gray-600">
                        {selectedProduct.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">Código</div>
                        <div className="font-semibold text-gray-900">
                          {selectedProduct.code}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">Categoría</div>
                        <div className="font-semibold text-gray-900">
                          {productCategories.find(
                            (c) => c.id === selectedProduct.category
                          )?.name || "General"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Información de Stock y Precio
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600">
                            Stock disponible
                          </div>
                          <div
                            className={`text-2xl font-bold ${
                              selectedProduct.currentStock > 100
                                ? "text-green-700"
                                : selectedProduct.currentStock > 50
                                ? "text-yellow-700"
                                : "text-red-700"
                            }`}
                          >
                            {selectedProduct.currentStock} unidades
                          </div>
                        </div>
                        <Warehouse className="w-8 h-8 text-blue-600" />
                      </div>

                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-600">
                            Precio unitario
                          </div>
                          <div className="text-lg font-bold text-green-700">
                            ${(selectedProduct.price || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">
                          IVA incluido
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Especificaciones
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Unidad de medida:</span>
                        <span className="font-medium">
                          {selectedProduct.unit || "Unidad"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Almacén:</span>
                        <span className="font-medium">
                          {selectedProduct.warehouseName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Proveedor:</span>
                        <span className="font-medium">
                          {selectedProduct.supplier}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Pedido mínimo:</span>
                        <span className="font-medium">
                          {selectedProduct.minOrder} unidades
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">
                          Tiempo de entrega:
                        </span>
                        <span className="font-medium">
                          {selectedProduct.deliveryTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Garantía:</span>
                        <span className="font-medium">
                          {selectedProduct.warranty}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Calificación
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <=
                              Math.floor(parseFloat(selectedProduct.rating))
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">
                        {selectedProduct.rating}/5.0
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <button
                      onClick={() => {
                        addToCart(selectedProduct);
                        setShowProductDetails(false);
                      }}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Añadir al Carrito
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shopping Cart Sidebar - CORREGIDO */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
            {/* Cart Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="w-6 h-6 text-gray-700" />
                  <h3 className="text-lg font-semibold">
                    Carrito de Solicitudes
                  </h3>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {cartItems.length} productos seleccionados
              </p>
            </div>

            {/* Cart Items - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <ShoppingCart className="w-12 h-12 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Carrito vacío
                  </h4>
                  <p className="text-gray-600 text-center mb-6">
                    Agrega productos desde el marketplace para crear una
                    solicitud
                  </p>
                  <button
                    onClick={() => {
                      setShowCart(false);
                      setViewMode("market");
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Explorar Marketplace
                  </button>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {item.productName}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {item.productCode}
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-600">
                              Stock:{" "}
                              <span className="font-medium">
                                {item.availableStock}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Precio:{" "}
                              <span className="font-medium">
                                ${item.unitPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() =>
                              updateCartQuantity(item.id, item.quantity - 1)
                            }
                            className="px-3 py-1 hover:bg-gray-100 rounded-l-lg transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-1 text-center min-w-[3rem]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(item.id, item.quantity + 1)
                            }
                            className="px-3 py-1 hover:bg-gray-100 rounded-r-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Subtotal</div>
                          <div className="font-medium text-gray-900">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer - Siempre visible */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 p-6 bg-white">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="text-gray-900">
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Productos:</span>
                    <span className="text-gray-900">{cartItems.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-semibold pt-4 border-t border-gray-200">
                    <span className="text-gray-900">Total estimado:</span>
                    <span className="text-blue-600">
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-3 pt-4">
                    <button
                      onClick={submitCartRequest}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <TruckIcon className="w-5 h-5" />
                      Enviar Solicitud al Almacén
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setCartItems([])}
                        className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Vaciar Carrito
                      </button>
                      <button
                        onClick={() => setShowCart(false)}
                        className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Seguir Comprando
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Existing Modals (se mantienen exactamente igual) */}
      {showStockModal && stockVerificationData && (
        <StockVerificationModal
          stockData={stockVerificationData}
          onGenerateOS={handleGenerateOutputOrder}
          onGenerateOC={handleGeneratePurchaseOrder}
          onCancel={() => setShowStockModal(false)}
        />
      )}

      {showActionModal && selectedRequest && (
        <ActionModal
          action={showActionModal}
          selectedRequest={selectedRequest}
          actionNotes={actionNotes}
          setActionNotes={setActionNotes}
          onConfirm={() => {
            if (showActionModal === "aprobar") handleApprove();
            else if (showActionModal === "rechazar") handleReject();
            else if (showActionModal === "observar") handleObserve();
            else if (showActionModal === "espera") handlePutOnHold();
          }}
          onCancel={closeActionModal}
          isApproving={showActionModal === "aprobar"}
        />
      )}

      {showCreateModal && (
        <CreateEditModal
          isEditing={!!editingRequest}
          form={form}
          onFormChange={handleFormChange}
          onAddItem={() =>
            setForm((prev) => ({
              ...prev,
              items: addItem(prev.items || []),
            }))
          }
          onUpdateItem={(idx: number, key: string, value: any) =>
            setForm((prev) => ({
              ...prev,
              items: updateItem(prev.items || [], idx, key, value),
            }))
          }
          onRemoveItem={(idx: number) =>
            setForm((prev) => ({
              ...prev,
              items: removeItem(prev.items || [], idx),
            }))
          }
          onSubmit={handleCreateOrUpdate}
          onCancel={() => {
            setShowCreateModal(false);
            closeModal();
          }}
        />
      )}
    </div>
  );
}

// Componentes auxiliares actualizados

function StatCard({
  label,
  value,
  icon: IconComponent,
  bgColor,
  textColor,
  iconColor,
}: {
  label: string;
  value: number;
  icon: any;
  bgColor: string;
  textColor: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-2xl text-gray-900 mt-1">{value}</div>
        </div>
        <div className={`p-3 ${bgColor} rounded-lg`}>
          <IconComponent className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onAddToCart, onViewDetails, cartItems }: any) {
  const cartItem = cartItems.find((item: any) => item.productId === product.id);
  const inCart = !!cartItem;
  const cartQuantity = cartItem?.quantity || 0;

  const getStockColor = (stock: number) => {
    if (stock >= 100) return "text-green-600 bg-green-50";
    if (stock >= 50) return "text-yellow-600 bg-yellow-50";
    if (stock > 0) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const getStockLabel = (stock: number) => {
    if (stock >= 100) return "Disponible";
    if (stock >= 50) return "Limitado";
    if (stock > 0) return "Bajo stock";
    return "Agotado";
  };

  const categoryInfo = productCategories.find((c) => c.id === product.category);
  const categoryColor = categoryInfo?.color || "bg-gray-100 text-gray-800";

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Product Image/Placeholder */}
      <div className="h-40 bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center relative">
        <Package className="w-12 h-12 text-gray-400" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew && (
            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
              Nuevo
            </span>
          )}
          {product.isPopular && (
            <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded">
              Popular
            </span>
          )}
        </div>

        <div className="absolute top-2 right-2">
          <span
            className={`text-xs px-2 py-1 rounded-full ${getStockColor(
              product.currentStock
            )}`}
          >
            {getStockLabel(product.currentStock)}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2">
          <span className={`text-xs px-2 py-1 rounded ${categoryColor}`}>
            {categoryInfo?.name || "General"}
          </span>
        </div>

        <h3 className="font-medium text-gray-900 mb-1 truncate">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mb-2">{product.code}</p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600">
              {product.warehouseName}
            </span>
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm ml-1">{product.rating}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-bold text-gray-900">
              ${(product.price || 0).toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">por unidad</div>
          </div>
          <div className="text-sm text-gray-600">
            Stock: <span className="font-medium">{product.currentStock}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {inCart ? (
            <div className="flex items-center justify-between border border-blue-200 bg-blue-50 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-blue-700">
                  {cartQuantity} en carrito
                </span>
              </div>
              <button
                onClick={() => onAddToCart(product)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                + Agregar
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(product)}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Añadir al Carrito
            </button>
          )}

          <button
            onClick={() => onViewDetails(product)}
            className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Ver Detalles
          </button>
        </div>
      </div>
    </div>
  );
}

// RequestCard y otros componentes se mantienen EXACTAMENTE iguales
function RequestCard({
  request,
  currentUser,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onObserve,
  onPutOnHold,
  onUnify,
  onVerifyStock,
  similarRequests,
}: any) {
  const warehouse = warehouses.find((w) => w.id === request.warehouseId);
  const requestTotal = calculateRequestTotal(request);
  const hasItems = request.items && request.items.length > 0;
  const StatusIconComponent = getStatusIcon(request.status);

  return (
    <div
      className={`bg-white rounded-lg border-2 ${getStatusColor(
        request.status
      )} p-6 hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="text-gray-900 font-semibold">
              {request.productName}
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
              <StatusIconComponent className="w-3 h-3" />
              {getStatusLabel(request.status)}
            </span>
            <span
              className={`inline-flex px-2 py-1 text-xs rounded-full ${getUrgencyColor(
                request.urgency
              )}`}
            >
              {getUrgencyLabel(request.urgency)}
            </span>
            <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              {classifyRequest(request) === "mayor" ? "Entrada" : "Salida"}
            </span>
            {similarRequests.length > 0 &&
              currentUser.role === "super_admin" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">
                  <Copy className="w-3 h-3" />
                  {similarRequests.length} similar
                </span>
              )}
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <div>
              <span className="font-medium">Total: </span>$
              {requestTotal.toFixed(2)}
            </div>
            {hasItems && (
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  Ítems: {request.items?.length}
                </span>
                <button
                  onClick={onToggleExpand}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" /> Ocultar
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" /> Ver
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500">Fecha</div>
          <div className="text-sm text-gray-900">
            {new Date(request.requestDate).toLocaleDateString()}
          </div>
        </div>
      </div>

      {isExpanded && hasItems && (
        <ItemsTable items={request.items} total={requestTotal} />
      )}

      <div className="mb-4">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
          style={{
            backgroundColor: `${warehouse?.color}20`,
            color: warehouse?.color,
          }}
        >
          <Package className="w-4 h-4" />
          {request.warehouseName}
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-500 mb-1">Motivo</div>
        <div className="text-sm text-gray-900">{request.reason}</div>
      </div>

      {request.reviewedBy && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">
            Revisado por {request.reviewedBy} -{" "}
            {new Date(request.reviewDate).toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-900">{request.reviewNotes}</div>
        </div>
      )}

      {similarRequests.length > 0 && currentUser.role === "super_admin" && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="text-xs text-amber-700 mb-1">
                  Compra similar detectada
                </div>
                {/* <button
                  onClick={onUnify}
                  className="text-xs text-amber-800 underline hover:text-amber-900"
                >
                  Unificar
                </button> */}
              </div>
              <div className="text-sm text-amber-900">
                {similarRequests.map((sr: any) => (
                  <div key={sr.id}>
                    • {sr.warehouseName} - {sr.quantity} unidades
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentUser.role === "super_admin" &&
        (request.status === "pendiente" || request.status === "urgente") && (
          <div className="mb-4">
            <button
              onClick={() => onVerifyStock(request)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PackageCheck className="w-4 h-4" />
              Verificar Stock en Almacén Principal
            </button>
          </div>
        )}

      {currentUser.role === "super_admin" &&
        (request.status === "pendiente" || request.status === "urgente") && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={onApprove}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Aprobar
            </button>
            <button
              onClick={onObserve}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Observar
            </button>
            <button
              onClick={onPutOnHold}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Pause className="w-4 h-4" />
              En Espera
            </button>
            <button
              onClick={onReject}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Rechazar
            </button>
          </div>
        )}

      {currentUser.role === "warehouse_user" &&
        request.status === "observada" && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={onEdit}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Edit className="w-4 h-4" />
              Corregir y Reenviar
            </button>
          </div>
        )}

      {currentUser.role === "warehouse_user" && canDelete(request) && (
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onDelete}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
          >
            <XCircle className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

function ItemsTable({ items, total }: { items: any; total: number }) {
  return (
    <div className="mb-4 border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <h4 className="font-medium text-gray-900 text-sm">Detalles de Ítems</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left font-medium text-gray-700">#</th>
              <th className="p-3 text-left font-medium text-gray-700">
                Código
              </th>
              <th className="p-3 text-left font-medium text-gray-700">
                Descripción
              </th>
              <th className="p-3 text-left font-medium text-gray-700">
                Unidad
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
            </tr>
          </thead>
          <tbody>
            {items.map((it: any, idx: number) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                <td className="p-3 text-gray-600">{it.itemNumber}</td>
                <td className="p-3 text-gray-900">{it.productCode || "N/A"}</td>
                <td className="p-3 text-gray-900">{it.description || "—"}</td>
                <td className="p-3 text-gray-600">{it.unit || "—"}</td>
                <td className="p-3 text-right text-gray-900">{it.quantity}</td>
                <td className="p-3 text-right text-gray-900">
                  ${(it.unitPrice || 0).toFixed(2)}
                </td>
                <td className="p-3 text-right font-medium text-green-700">
                  ${(it.subtotal || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t">
            <tr>
              <td
                colSpan={6}
                className="p-3 text-right font-medium text-gray-700"
              >
                Total:
              </td>
              <td className="p-3 text-right font-bold text-lg text-green-700">
                ${total.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function ActionModal({
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
            {selectedRequest.productName}
          </div>
          <div className="text-sm text-gray-600">
            Cantidad: {selectedRequest.quantity} | Almacén:{" "}
            {selectedRequest.warehouseName}
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

function CreateEditModal({
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

function StockVerificationModal({
  stockData,
  onGenerateOS,
  onGenerateOC,
  onCancel,
}: {
  stockData: any;
  onGenerateOS: () => void;
  onGenerateOC: () => void;
  onCancel: () => void;
}) {
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

  const getStatusColor = (sufficient: boolean) => {
    return sufficient ? "text-green-600" : "text-red-600";
  };

  const getStatusIcon = (sufficient: boolean) => {
    return sufficient ? (
      <PackageCheck className="w-8 h-8 text-green-600" />
    ) : (
      <PackageX className="w-8 h-8 text-red-600" />
    );
  };

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

            {!isSufficient && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-red-800">
                      Stock insuficiente en el Almacén Principal
                    </div>
                    <div className="text-sm text-red-700 mt-1">
                      No hay suficiente stock para completar la solicitud de{" "}
                      {request.quantity} unidades. Solo hay {mainWarehouseStock}{" "}
                      unidades disponibles.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">
                    Stock en otros SubAlmacenes
                  </h4>
                  <p className="text-sm text-gray-600">
                    (Solo visualización, no se descuenta automáticamente)
                  </p>
                </div>
                <Eye className="w-5 h-5 text-gray-400" />
              </div>

              {subWarehousesStock.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {subWarehousesStock.map((sub: any, index: number) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>{getWarehouseIcon(sub.name)}</div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {sub.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              SubAlmacén
                            </div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-green-700">
                          {sub.stock.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        Disponible para transferencia interna
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Warehouse className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <div>No hay stock disponible en otros subalmacenes</div>
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
            <div className="flex justify-between gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>

              <div className="flex gap-3">
                {isSufficient ? (
                  <button
                    onClick={onGenerateOS}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Truck className="w-4 h-4" />
                    Generar Orden de Salida (OS)
                  </button>
                ) : (
                  <button
                    onClick={onGenerateOC}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Generar Orden de Compra (OC)
                  </button>
                )}

                <button
                  onClick={() => {
                    alert("Mostrando detalles completos del stock...");
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Ver detalle
                </button>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500 text-center">
              {isSufficient
                ? "✅ Se generará una Orden de Salida para despachar el producto desde el Almacén Principal"
                : "📋 Se generará una Orden de Compra para adquirir el producto faltante"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PurchaseRequests;
