import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";

const ProductCategory = () => {
  const { products } = useAppContext();
  const { category } = useParams();
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Info de tipos de productos
  const typesInfo = {
    tamal: {
      text: "Tamales",
      bgColor: "#FEF3E2",
      description: "Deliciosos tamales tradicionales guatemaltecos",
    },
    bebida: {
      text: "Bebidas",
      bgColor: "#DBEAFE",
      description: "Refréscate con nuestras bebidas tradicionales",
    },
    combo: {
      text: "Combos",
      bgColor: "#FFF4E6",
      description: "Combos especiales para ocasiones especiales",
    },
  };

  // Función para cargar productos por tipo
  const loadCategoryProducts = async () => {
    if (!category) return;

    setLoading(true);
    console.log(`Cargando productos de tipo: ${category}`);

    try {
      const filtered = products.filter(p => p.TIPO_PRODUCTO === category);
      setCategoryProducts(filtered);
      console.log(`${filtered.length} productos cargados para ${category}`);
    } catch (error) {
  console.error("Error loading category products:", error);
  setCategoryProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Effect que se ejecuta cuando cambia la categoría
  useEffect(() => {
    loadCategoryProducts();
  }, [category, products]);

  // Mostrar loading mientras carga
  if (loading) {
    return (
      <div className="mt-16">
        <div className="flex flex-col items-end w-max mb-8">
          <div className="w-32 h-6 bg-gray-200 animate-pulse rounded"></div>
          <div className="w-16 h-0.5 bg-gray-200 animate-pulse rounded-full mt-2"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-200 h-80 rounded-lg"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16">
      {typesInfo[category] && (
        <div className="mb-8">
          <div className="flex flex-col items-end w-max mb-4">
            <p className="text-2xl font-medium uppercase">
              {typesInfo[category].text}
            </p>
            <div className="w-16 h-0.5 bg-sky-500 rounded-full"></div>
          </div>
          <p className="text-gray-600 max-w-2xl">{typesInfo[category].description}</p>
        </div>
      )}

      {categoryProducts.length > 0 ? (
        <>
          <div className="mb-6">
            <p className="text-gray-600">
              {categoryProducts.length} producto
              {categoryProducts.length !== 1 ? "s" : ""} encontrado
              {categoryProducts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {categoryProducts.map((product, index) => (
              <ProductCard key={index} product={product} />
            ))}
          </div>
        </>
      ) : (
  <div className="flex flex-col items-center justify-center h-[60vh] bg-sky-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-medium text-gray-500 mb-4">
              No hay productos en este tipo aún
            </p>
            <p className="text-gray-400 mb-6">
              {category
                ? `Tipo: ${typesInfo[category]?.text || category}`
                : "Tipo no especificado"}
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition"
            >
              Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCategory;
