import React from "react";
import { useAppContext } from "../context/AppContext";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const Cart = () => {
  const { user, cart, removeFromCart, updateCartQty, getCartTotal, clearCart, navigate, setShowUserLogin } = useAppContext();

  if (!user) {
    return (
      <div className="mt-16 text-center">
        <p className="text-xl text-gray-600 mb-4">Debes iniciar sesión para ver tu carrito</p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setShowUserLogin(true)} className="px-6 py-3 bg-sky-500 text-white rounded">Iniciar sesión</button>
          <button onClick={() => navigate("/")} className="px-6 py-3 border rounded">Ir al inicio</button>
        </div>
      </div>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <div className="mt-16 text-center">
        <p className="text-xl text-gray-600 mb-4">Tu carrito está vacío</p>
        <button onClick={() => navigate("/all-products")} className="px-6 py-3 bg-sky-500 text-white rounded">Ver productos</button>
      </div>
    );
  }

  const handleCheckout = () => {
    // Simple simulated checkout
    toast.success("Compra simulada. Gracias por tu pedido.");
    clearCart();
    navigate("/profile");
  };

  return (
    <div className="mt-16 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Carrito ({cart.length})</h2>

      <div className="bg-white border rounded-lg p-4 mb-6">
        {cart.map((item) => {
          const product = item.product;
          const id = item.id;
          const price = product?.PRECIO ?? product?.PRECIO_BASE ?? product?.price ?? 0;
          return (
            <div key={id} className="flex items-center gap-4 py-3 border-b last:border-b-0">
              <img src={product?.IMAGEN_URL ?? product?.image?.[0] ?? "/placeholder.jpg"} alt={product?.NOMBRE_PRODUCTO ?? product?.title} className="w-20 h-20 object-cover rounded" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{product?.NOMBRE_PRODUCTO ?? product?.title}</div>
                    <div className="text-sm text-gray-500">Q{Number(price).toFixed(2)}</div>
                  </div>
                  <button onClick={() => removeFromCart(id)} className="text-red-500"><Trash2 /></button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => updateCartQty(id, Math.max(1, (item.qty || 1) - 1))} className="px-3 py-1 border rounded">-</button>
                  <input value={item.qty} onChange={(e) => updateCartQty(id, Math.max(1, Number(e.target.value || 1)))} className="w-16 text-center border rounded p-1" />
                  <button onClick={() => updateCartQty(id, (item.qty || 1) + 1)} className="px-3 py-1 border rounded">+</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-4">
        <div className="text-lg font-semibold">Total: Q{getCartTotal().toFixed(2)}</div>
        <button onClick={handleCheckout} className="px-6 py-3 bg-sky-500 text-white rounded">Pagar</button>
      </div>
    </div>
  );
};

export default Cart;
