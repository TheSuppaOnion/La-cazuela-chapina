import React from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "../context/AppContext";

const PopularProducts = () => {
  const { products } = useAppContext();

  // Mostrar los primeros 5 productos
  const popularProducts = products.slice(0, 5);

  return (
    <div className="mt-16">
      <p className="text-2xl md:text-3xl font-medium">Productos Populares</p>
      <p className="text-gray-600 mt-2">
        Nuestros productos más destacados
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 lg:grid-cols-5 mt-6">
        {popularProducts.map((product, index) => (
          <ProductCard key={index} product={product} />
        ))}
      </div>
    </div>
  );
};

export default PopularProducts;
