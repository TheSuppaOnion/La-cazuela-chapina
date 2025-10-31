import React, { useEffect, useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import ProductCard from "../components/ProductCard";

const AllCombos = () => {
  const { combos, searchQuery, setSearchQuery, fetchCombos } = useAppContext();
  const [filteredCombos, setFilteredCombos] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxPrice: "",
  });

  useEffect(() => {
    console.log("[AllCombos] combos length:", Array.isArray(combos) ? combos.length : typeof combos, "searchQuery:", searchQuery);
    let filtered = Array.isArray(combos) ? [...combos] : [];

    // Filtro por búsqueda — proteger campos que podrían ser undefined
    if (searchQuery && searchQuery.length > 0) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((combo) => {
        const name = (combo?.NOMBRE_PRODUCTO ?? combo?.Name ?? "").toString().toLowerCase();
        const desc = (combo?.DESCRIPCION ?? combo?.description ?? "").toString().toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }

    // Filtros adicionales
    if (filters.maxPrice) {
      filtered = filtered.filter(
        (combo) => combo.PRECIO <= parseFloat(filters.maxPrice)
      );
    }

    setFilteredCombos(filtered);
  }, [combos, searchQuery, filters]);

  // If combos weren't loaded for some reason, try fetching once on mount
  useEffect(() => {
    if (!Array.isArray(combos) || combos.length === 0) {
      console.log("[AllCombos] combos empty, invoking fetchCombos()");
      try {
        fetchCombos && fetchCombos();
      } catch (e) {
        console.warn("[AllCombos] fetchCombos failed:", e);
      }
    }
  }, []);

  const clearFilters = () => {
    setFilters({
      maxPrice: "",
    });
  };

  return (
    <div className="mt-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Nuestros Combos
        </h1>
        <p className="text-gray-600 text-lg">
          Descubre nuestros combos especiales para cada ocasión
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar combos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <Filter className="w-5 h-5" />
          Filtros
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio máximo
              </label>
              <input
                type="number"
                placeholder="Q"
                value={filters.maxPrice}
                onChange={(e) =>
                  setFilters({ ...filters, maxPrice: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          {filteredCombos.length} combo{filteredCombos.length !== 1 ? "s" : ""} encontrado{filteredCombos.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Combos Grid */}
      {filteredCombos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredCombos.map((combo, index) => (
            <ProductCard key={index} product={combo} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-medium text-gray-600 mb-2">
            No se encontraron combos
          </h3>
          <p className="text-gray-500">
            Intenta ajustar tus filtros de búsqueda
          </p>
        </div>
      )}
    </div>
  );
};

export default AllCombos;