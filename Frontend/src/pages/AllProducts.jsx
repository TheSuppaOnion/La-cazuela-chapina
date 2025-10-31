import React, { useEffect, useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import ProductCard from "../components/ProductCard";

const AllProducts = () => {
  const { products, searchQuery, setSearchQuery, fetchProducts } = useAppContext();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tipo: "",
    maxPrice: "",
  });

  useEffect(() => {
    console.log("[AllProducts] products length:", Array.isArray(products) ? products.length : typeof products, "searchQuery:", searchQuery);
    let filtered = Array.isArray(products) ? [...products] : [];

    // Filtro por búsqueda — proteger campos que podrían ser undefined
    if (searchQuery && searchQuery.length > 0) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((product) => {
        const name = (product?.NOMBRE_PRODUCTO ?? product?.Name ?? "").toString().toLowerCase();
        const desc = (product?.DESCRIPCION ?? product?.description ?? "").toString().toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }

    // Filtros adicionales
    if (filters.tipo) {
      filtered = filtered.filter(
        (product) =>
          product.TIPO_PRODUCTO.toLowerCase() === filters.tipo.toLowerCase()
      );
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(
        (product) => product.PRECIO <= parseFloat(filters.maxPrice)
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, filters]);

  // If products weren't loaded for some reason, try fetching once on mount
  useEffect(() => {
    if (!Array.isArray(products) || products.length === 0) {
      console.log("[AllProducts] products empty on mount, invoking fetchProducts()");
      try {
        fetchProducts && fetchProducts();
      } catch (e) {
        console.warn("[AllProducts] fetchProducts failed:", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProducts]);

  // If the user performs a search but products are still empty, trigger fetch
  useEffect(() => {
    if (searchQuery && (!Array.isArray(products) || products.length === 0)) {
      console.log("[AllProducts] search triggered and products empty — fetching products");
      try {
        fetchProducts && fetchProducts();
      } catch (e) {
        console.warn("[AllProducts] fetchProducts failed on search:", e);
      }
    }
  }, [searchQuery, products, fetchProducts]);

  const clearFilters = () => {
    setFilters({
      tipo: "",
      maxPrice: "",
    });
    setSearchQuery("");
  };

  const hasActiveFilters =
    searchQuery || filters.tipo || filters.maxPrice;

  return (
    <div className="mt-16 flex flex-col">
      <div className="flex flex-col items-end w-max mb-8">
        <p className="text-2xl font-medium uppercase">Todos los Productos</p>
    <div className="w-16 h-0.5 bg-sky-500 rounded-full"></div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="mb-8 space-y-4">
        {/* Búsqueda */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos por nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition ${
              showFilters
                ? "border-sky-500 text-sky-600"
                : "border-gray-300"
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtros
          </button>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtro por tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Producto
                </label>
                <select
                  value={filters.tipo}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      tipo: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Todos los tipos</option>
                  <option value="tamal">Tamal</option>
                  <option value="bebida">Bebida</option>
                  <option value="combo">Combo</option>
                </select>
              </div>

              {/* Filtro por precio máximo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio máximo (Q)
                </label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))
                  }
                  placeholder="Ej: 50"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Botón limpiar filtros */}
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 transition"
                >
                  <X className="w-4 h-4" />
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}

        {/* Resultados */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {filteredProducts.length} producto
            {filteredProducts.length !== 1 ? "s" : ""}
            {hasActiveFilters ? " encontrado" : " disponible"}
            {filteredProducts.length !== 1 ? "s" : ""}
          </p>
          {searchQuery && (
            <p className="text-sm text-gray-500">
              Buscando: "<span className="font-medium">{searchQuery}</span>"
            </p>
          )}
        </div>
      </div>

      {/* Grid de productos */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredProducts.map((product, index) => (
            <ProductCard key={index} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[40vh] bg-gray-50 rounded-lg">
          <Search className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-xl font-medium text-gray-500 mb-2">
            No se encontraron productos
          </p>
          <p className="text-gray-400 text-center mb-4">
            {searchQuery
              ? `No hay productos que coincidan con "${searchQuery}"`
              : "Intenta ajustar los filtros de búsqueda"}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AllProducts;
