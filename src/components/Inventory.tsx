import { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  ChevronDown,
  ChevronUp,
  Package,
  AlertCircle,
  X,
  Save,
} from "lucide-react";
import { products as initialProducts, warehouses } from "../data/mockData";
import { Product, ProductStatus, User } from "../types";

interface InventoryProps {
  onNavigate: (page: string, data?: any) => void;
  currentUser: User;
}

export function Inventory({ onNavigate, currentUser }: InventoryProps) {
  const [products, setProducts] = useState<Product[]>(() => {
    // Cargar desde localStorage o usar initialProducts
    const savedProducts = localStorage.getItem("inventory-products");
    return savedProducts ? JSON.parse(savedProducts) : initialProducts;
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState<ProductStatus | "all">(
    "all"
  );
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    code: "",
    category: "",
    subcategory: "",
    technicalDescription: "",
    unit: "unidades",
    minStock: 0,
    maxStock: 100,
    currentStock: 0,
    cost: 0,
    warehouseId: "",
    physicalLocation: "",
    status: "activo" as ProductStatus,
  });

  // Guardar en localStorage cuando products cambie
  useState(() => {
    localStorage.setItem("inventory-products", JSON.stringify(products));
  });

  // Filtrar productos
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarehouse =
      filterWarehouse === "all" || product.warehouseId === filterWarehouse;
    const matchesCategory =
      filterCategory === "all" || product.category === filterCategory;
    const matchesStatus =
      filterStatus === "all" || product.status === filterStatus;

    return (
      matchesSearch && matchesWarehouse && matchesCategory && matchesStatus
    );
  });

  // Obtener categorías únicas
  const categories = [...new Set(products.map((p) => p.category))];

  const getStatusColor = (status: ProductStatus) => {
    switch (status) {
      case "activo":
        return "bg-green-100 text-green-800";
      case "en_revision":
        return "bg-yellow-100 text-yellow-800";
      case "inactivo":
        return "bg-gray-100 text-gray-800";
      case "obsoleto":
        return "bg-red-100 text-red-800";
    }
  };

  const getStatusLabel = (status: ProductStatus) => {
    switch (status) {
      case "activo":
        return "Activo";
      case "en_revision":
        return "En Revisión";
      case "inactivo":
        return "Inactivo";
      case "obsoleto":
        return "Obsoleto";
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.currentStock === 0)
      return { label: "Sin Stock", color: "text-red-600" };
    if (product.currentStock <= product.minStock)
      return { label: "Stock Crítico", color: "text-orange-600" };
    if (product.currentStock >= product.maxStock)
      return { label: "Stock Alto", color: "text-blue-600" };
    return { label: "Stock Normal", color: "text-green-600" };
  };

  // Handler para crear nuevo producto
  const handleCreateProduct = () => {
    if (
      !newProduct.name ||
      !newProduct.code ||
      !newProduct.category ||
      !newProduct.warehouseId
    ) {
      alert("Por favor complete todos los campos obligatorios");
      return;
    }

    if (newProduct.minStock >= newProduct.maxStock) {
      alert("El stock mínimo debe ser menor al stock máximo");
      return;
    }

    const selectedWarehouse = warehouses.find(
      (w) => w.id === newProduct.warehouseId
    );

    const product: Product = {
      id: `PROD-${Date.now()}`,
      name: newProduct.name,
      code: newProduct.code,
      category: newProduct.category,
      subcategory: newProduct.subcategory,
      technicalDescription: newProduct.technicalDescription,
      unit: newProduct.unit,
      minStock: newProduct.minStock,
      maxStock: newProduct.maxStock,
      currentStock: newProduct.currentStock,
      cost: newProduct.cost,
      warehouseId: newProduct.warehouseId,
      warehouseName: selectedWarehouse?.name || "",
      physicalLocation: newProduct.physicalLocation,
      status: newProduct.status,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedProducts = [product, ...products];
    setProducts(updatedProducts);
    localStorage.setItem("inventory-products", JSON.stringify(updatedProducts));

    // Reset form and close modal
    setNewProduct({
      name: "",
      code: "",
      category: "",
      subcategory: "",
      technicalDescription: "",
      unit: "unidades",
      minStock: 0,
      maxStock: 100,
      currentStock: 0,
      cost: 0,
      warehouseId: "",
      physicalLocation: "",
      status: "activo",
    });
    setShowCreateModal(false);
  };

  // Handler para editar producto
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      code: product.code,
      category: product.category,
      subcategory: product.subcategory,
      technicalDescription: product.technicalDescription,
      unit: product.unit,
      minStock: product.minStock,
      maxStock: product.maxStock,
      currentStock: product.currentStock,
      cost: product.cost || 0,
      warehouseId: product.warehouseId,
      physicalLocation: product.physicalLocation || "",
      status: product.status,
    });
    setShowCreateModal(true);
  };

  // Handler para guardar producto editado
  const handleSaveEditedProduct = () => {
    if (
      !newProduct.name ||
      !newProduct.code ||
      !newProduct.category ||
      !newProduct.warehouseId
    ) {
      alert("Por favor complete todos los campos obligatorios");
      return;
    }

    if (newProduct.minStock >= newProduct.maxStock) {
      alert("El stock mínimo debe ser menor al stock máximo");
      return;
    }

    const selectedWarehouse = warehouses.find(
      (w) => w.id === newProduct.warehouseId
    );

    const updatedProduct: Product = {
      ...editingProduct!,
      name: newProduct.name,
      code: newProduct.code,
      category: newProduct.category,
      subcategory: newProduct.subcategory,
      technicalDescription: newProduct.technicalDescription,
      unit: newProduct.unit,
      minStock: newProduct.minStock,
      maxStock: newProduct.maxStock,
      currentStock: newProduct.currentStock,
      cost: newProduct.cost,
      warehouseId: newProduct.warehouseId,
      warehouseName: selectedWarehouse?.name || "",
      physicalLocation: newProduct.physicalLocation,
      status: newProduct.status,
      updatedAt: new Date().toISOString(),
    };

    const updatedProducts = products.map((p) =>
      p.id === editingProduct!.id ? updatedProduct : p
    );

    setProducts(updatedProducts);
    localStorage.setItem("inventory-products", JSON.stringify(updatedProducts));

    // Reset form and close modal
    setEditingProduct(null);
    setNewProduct({
      name: "",
      code: "",
      category: "",
      subcategory: "",
      technicalDescription: "",
      unit: "unidades",
      minStock: 0,
      maxStock: 100,
      currentStock: 0,
      cost: 0,
      warehouseId: "",
      physicalLocation: "",
      status: "activo",
    });
    setShowCreateModal(false);
  };

  // Generar código automático basado en el nombre
  const generateProductCode = (name: string) => {
    if (!name) return "";
    const initials = name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 3);
    const timestamp = Date.now().toString().slice(-4);
    return `${initials}-${timestamp}`;
  };

  // Handler para cuando cambia el nombre del producto
  const handleNameChange = (name: string) => {
    setNewProduct((prev) => ({
      ...prev,
      name,
      code: prev.code || generateProductCode(name),
    }));
  };

  // Handler para cerrar modal
  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingProduct(null);
    setNewProduct({
      name: "",
      code: "",
      category: "",
      subcategory: "",
      technicalDescription: "",
      unit: "unidades",
      minStock: 0,
      maxStock: 100,
      currentStock: 0,
      cost: 0,
      warehouseId: "",
      physicalLocation: "",
      status: "activo",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Inventario</h2>
          <p className="text-gray-600 mt-1">
            {filteredProducts.length} de {products.length} productos
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Crear Producto
        </button>
      </div>

      {/* Modal de Crear/Editar Producto */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                {editingProduct ? "Editar Producto" : "Crear Nuevo Producto"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">
                  Información Básica
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ingrese el nombre del producto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código del Producto *
                  </label>
                  <input
                    type="text"
                    value={newProduct.code}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="Código único del producto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!!editingProduct} // No permitir editar código cuando se está editando
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Código único para identificar el producto
                    {editingProduct && " (No editable)"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="otra">Otra categoría</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subcategoría
                    </label>
                    <input
                      type="text"
                      value={newProduct.subcategory}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          subcategory: e.target.value,
                        }))
                      }
                      placeholder="Subcategoría"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        unit: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="unidades">Unidades</option>
                    <option value="litros">Litros</option>
                    <option value="kilogramos">Kilogramos</option>
                    <option value="metros">Metros</option>
                    <option value="cajas">Cajas</option>
                    <option value="paquetes">Paquetes</option>
                  </select>
                </div>
              </div>

              {/* Información de Inventario */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">
                  Información de Inventario
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Almacén *
                  </label>
                  <select
                    value={newProduct.warehouseId}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        warehouseId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar almacén</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación Física
                  </label>
                  <input
                    type="text"
                    value={newProduct.physicalLocation}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        physicalLocation: e.target.value,
                      }))
                    }
                    placeholder="Ej: Estante A, Nivel 2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Actual
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newProduct.currentStock}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          currentStock: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Mínimo
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newProduct.minStock}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          minStock: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Máximo
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newProduct.maxStock}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          maxStock: parseInt(e.target.value) || 100,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo Unitario ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.cost}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        cost: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={newProduct.status}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        status: e.target.value as ProductStatus,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="activo">Activo</option>
                    <option value="en_revision">En Revisión</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="obsoleto">Obsoleto</option>
                  </select>
                </div>
              </div>

              {/* Descripción Técnica */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción Técnica
                </label>
                <textarea
                  value={newProduct.technicalDescription}
                  onChange={(e) =>
                    setNewProduct((prev) => ({
                      ...prev,
                      technicalDescription: e.target.value,
                    }))
                  }
                  placeholder="Descripción detallada del producto, especificaciones técnicas, características, etc."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={
                  editingProduct ? handleSaveEditedProduct : handleCreateProduct
                }
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingProduct ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {editingProduct ? "Guardar Cambios" : "Crear Producto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resto del código existente (Filtros, Tabla, Tarjetas) */}
      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Búsqueda */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filtro por almacén */}
          {currentUser.role === "super_admin" && (
            <select
              value={filterWarehouse}
              onChange={(e) => setFilterWarehouse(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los almacenes</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}

          {/* Filtro por categoría */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Filtro por estado */}
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as ProductStatus | "all")
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="en_revision">En Revisión</option>
            <option value="inactivo">Inactivo</option>
            <option value="obsoleto">Obsoleto</option>
          </select>
        </div>

        {/* Botones de vista */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              viewMode === "table"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Tabla
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              viewMode === "cards"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Tarjetas
          </button>
        </div>
      </div>

      {/* Vista de tabla */}
      {viewMode === "table" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  {currentUser.role === "super_admin" && (
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Almacén
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const isExpanded = expandedProduct === product.id;
                  const warehouse = warehouses.find(
                    (w) => w.id === product.warehouseId
                  );

                  return (
                    <>
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.code}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.subcategory}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {product.category}
                        </td>
                        {currentUser.role === "super_admin" && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div
                              className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs"
                              style={{
                                backgroundColor: `${warehouse?.color}20`,
                                color: warehouse?.color,
                              }}
                            >
                              {product.warehouseName}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.currentStock} {product.unit}
                          </div>
                          <div className={`text-xs ${stockStatus.color}`}>
                            {stockStatus.label}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(
                              product.status
                            )}`}
                          >
                            {getStatusLabel(product.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setExpandedProduct(
                                  isExpanded ? null : product.id
                                )
                              }
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Ver detalles"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                onNavigate("history", { productId: product.id })
                              }
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              title="Ver historial"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td
                            colSpan={currentUser.role === "super_admin" ? 7 : 6}
                            className="px-6 py-4 bg-gray-50"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-gray-500">
                                  Descripción Técnica
                                </div>
                                <div className="text-gray-900 mt-1">
                                  {product.technicalDescription}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-gray-500">
                                    Ubicación física:{" "}
                                  </span>
                                  <span className="text-gray-900">
                                    {product.physicalLocation ||
                                      "No especificada"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Stock mínimo:{" "}
                                  </span>
                                  <span className="text-gray-900">
                                    {product.minStock} {product.unit}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Stock máximo:{" "}
                                  </span>
                                  <span className="text-gray-900">
                                    {product.maxStock} {product.unit}
                                  </span>
                                </div>
                                {product.cost && (
                                  <div>
                                    <span className="text-gray-500">
                                      Costo unitario:{" "}
                                    </span>
                                    <span className="text-gray-900">
                                      ${product.cost.toFixed(2)}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-gray-500">
                                    Creado por:{" "}
                                  </span>
                                  <span className="text-gray-900">
                                    {product.createdBy}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Fecha de creación:{" "}
                                  </span>
                                  <span className="text-gray-900">
                                    {new Date(
                                      product.createdAt
                                    ).toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Última actualización:{" "}
                                  </span>
                                  <span className="text-gray-900">
                                    {new Date(
                                      product.updatedAt
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <div>No se encontraron productos</div>
              <div className="text-sm mt-1">
                Intenta ajustar los filtros de búsqueda
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vista de tarjetas */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product);
            const warehouse = warehouses.find(
              (w) => w.id === product.warehouseId
            );

            return (
              <div
                key={product.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">{product.code}</div>
                    <h4 className="text-gray-900 mt-1">{product.name}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      {product.category} · {product.subcategory}
                    </div>
                  </div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(
                      product.status
                    )}`}
                  >
                    {getStatusLabel(product.status)}
                  </span>
                </div>

                {currentUser.role === "super_admin" && warehouse && (
                  <div
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs mb-3"
                    style={{
                      backgroundColor: `${warehouse.color}20`,
                      color: warehouse.color,
                    }}
                  >
                    <Package className="w-3 h-3" />
                    {product.warehouseName}
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Stock actual</span>
                    <span className={`text-sm ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="text-2xl text-gray-900">
                      {product.currentStock}
                    </div>
                    <div className="text-sm text-gray-600 pb-1">
                      {product.unit}
                    </div>
                  </div>
                  <div className="mt-2 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${
                        product.currentStock === 0
                          ? "bg-red-500"
                          : product.currentStock <= product.minStock
                          ? "bg-orange-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          (product.currentStock / product.maxStock) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Min: {product.minStock}</span>
                    <span>Max: {product.maxStock}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4 mx-auto" />
                  </button>
                  <button
                    onClick={() =>
                      onNavigate("history", { productId: product.id })
                    }
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <div>No se encontraron productos</div>
              <div className="text-sm mt-1">
                Intenta ajustar los filtros de búsqueda
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
