import React from "react";
import { Heart, Clock, Users, ChefHat } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

// ProductCard now receives a `product` prop (terminology normalized)
const ProductCard = ({ product }) => {
  const { navigate, addToCart } = useAppContext();

  if (!product) return null;

  const id = product.ID_PRODUCTO ?? product._id ?? product.id;
  const image = product.IMAGEN_URL ?? product.image?.[0] ?? "/placeholder.jpg";
  const rawTitle = product.NOMBRE_PRODUCTO ?? product.title ?? "Producto";
  const title = String(rawTitle).replace(/^\s*combo\s+/i, "");
  const description = product.DESCRIPCION ?? product.description ?? "";
  // Support multiple price field names (PRECIO, PRECIO_BASE, price)
  const price = product.PRECIO ?? product.PRECIO_BASE ?? product.Precio_base ?? product.PRECIOBASE ?? product.price;

  return (
    <div
      onClick={() => {
        navigate(`/product/${id}`);
        scrollTo(0, 0);
      }}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group min-w-64 max-w-64 w-full"
    >
      {/* Imagen */}
      <div className="relative h-48 overflow-hidden">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          src={image}
          alt={title}
        />
      </div>

      {/* Contenido */}
      <div className="p-4 min-w-0">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
          {title}
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {description}
        </p>

        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-sky-600 whitespace-nowrap flex-shrink-0">{price !== undefined && price !== null ? `Q${Number(price).toFixed(2)}` : ""}</span>
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }} className="px-3 py-1.5 bg-sky-500 text-white rounded text-sm hover:bg-sky-600 transition">Agregar</button>
            <span className="text-xs text-gray-500 truncate">Ver producto →</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
