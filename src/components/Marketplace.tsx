import React, { useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import CartDrawer from "./CartDrawer";
import { Search } from "lucide-react";

export function Marketplace({
  onNavigate,
  products,
  setProducts,
  currentUser,
  setRequests,
  requests,
  setNotifications,
  setMovements,
  setOrders,
}: any) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [openCart, setOpenCart] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products || [];
    return (products || []).filter((p: any) =>
      `${p.code} ${p.name} ${p.category}`.toLowerCase().includes(q)
    );
  }, [products, query]);

  const addToCart = (product: any) => {
    const exists = cart.find((c) => c.id === product.id);
    if (exists) {
      setCart((prev) =>
        prev.map((c) =>
          c.id === product.id ? { ...c, quantity: (c.quantity || 1) + 1 } : c
        )
      );
    } else {
      setCart((prev) => [{ ...product, quantity: 1 }, ...prev]);
    }
    setOpenCart(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Marketplace de Inventarios</h2>
          <p className="text-gray-600">
            Visualiza productos del Almacén Principal y solicita directamente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por código, nombre o categoría"
              className="pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={() => setOpenCart(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded"
          >
            Carrito ({cart.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((p: any) => (
          <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
        ))}
      </div>

      <CartDrawer
        cart={cart}
        setCart={setCart}
        open={openCart}
        onClose={() => setOpenCart(false)}
        setRequests={setRequests}
        setNotifications={setNotifications}
        setMovements={setMovements}
        setOrders={setOrders}
        currentUser={currentUser}
      />
    </div>
  );
}

export default Marketplace;
