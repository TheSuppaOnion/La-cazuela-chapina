import React, { useEffect } from "react";
import { Users } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const Combos = () => {
  const { combos, loading, fetchCombos } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!combos || combos.length === 0) {
      fetchCombos();
    }
  }, [combos, fetchCombos]);

  if (loading) {
    return (
      <div className="mt-16">
        <p className="text-2xl md:text-3xl font-medium">Nuestros Combos</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mt-6 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-200 h-48 rounded-lg"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16">
      <p className="text-2xl md:text-3xl font-medium">Nuestros Combos</p>
      <p className="text-gray-600 mt-2">
        Descubre nuestros combos especiales para cada ocasión
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mt-6 gap-6">
        {combos && combos.length > 0 ? (
          combos.map((combo) => (
            <div
              key={combo.ID_PRODUCTO}
              className="group cursor-pointer p-6 rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105 bg-white"
              onClick={() => {
                navigate(`/combos/${combo.ID_PRODUCTO}`);
                scrollTo(0, 0);
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:scale-110 transition overflow-hidden">
                  {combo.IMAGEN_URL ? (
                    <img
                      src={combo.IMAGEN_URL}
                      alt={combo.NOMBRE_PRODUCTO}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="text-sky-500">
                      <Users className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {/* Removed redundant 'Combo' label */}
                  <p className="text-lg font-bold text-sky-600">
                    {(() => {
                      const price = combo.PRECIO ?? combo.PRECIO_BASE ?? combo.Precio_base ?? combo.precioBase ?? combo.PRECIOBASE ?? combo.price;
                      return price !== undefined && price !== null ? `Q${Number(price).toFixed(2)}` : "";
                    })()}
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-2">{String(combo.NOMBRE_PRODUCTO ?? combo.nombre ?? "").replace(/^\s*combo\s+/i, "")}</h3>
              <p className="text-gray-700 text-sm mb-3">{combo.DESCRIPCION}</p>

              <p className="text-xs text-gray-500">Haz clic para ver detalles</p>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">Cargando combos...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Combos;