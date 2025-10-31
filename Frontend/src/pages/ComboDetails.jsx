import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const ComboDetails = () => {
  const { id } = useParams();
  const { navigate, combos, fetchCombos, addToCart, user, setShowUserLogin } = useAppContext();
  const [combo, setCombo] = useState(null);
  const [comboQuantity, setComboQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);


  useEffect(() => {
    const loadCombo = async () => {
      const comboId = parseInt(id);

      // Try to find in backend-provided combos first
      let found = null;
      if (combos && combos.length > 0) {
        found = combos.find(c => {
          const cid = c.ID_PRODUCTO ?? c.Id ?? c.id ?? c.ID;
          return String(cid) === String(comboId);
        });
      }

      // If not found, try to fetch combos then search the returned array.
      if (!found && typeof fetchCombos === 'function') {
        try {
          const fetched = await fetchCombos();
          if (fetched && fetched.length > 0) {
            found = fetched.find(c => {
              const cid = c.ID_PRODUCTO ?? c.Id ?? c.id ?? c.ID;
              return String(cid) === String(comboId);
            });
          }
        } catch (e) {
          // ignore fetch errors
        }
      }

      // If still not found, we don't fallback to local defaults anymore

      if (found) {
        // Normalize backend object shape to the expected fields and coerce numbers
        const rawItems = found.items ?? found.items_list ?? found.ITEMS ?? [];

        const normalizedItems = (Array.isArray(rawItems) && rawItems.length > 0)
          ? rawItems.map(it => {
              const nombre = it.NOMBRE_PRODUCTO ?? it.nombre ?? it.name ?? it.NOMBRE ?? "Artículo";
              const cantidad = Number(it.cantidad ?? it.CANTIDAD ?? it.quantity ?? it.QUANTITY ?? 1) || 1;
              const precioUnitario = Number(it.PRECIO ?? it.PRECIO_UNITARIO ?? it.precioUnitario ?? it.price ?? it.PRECIO_VENTA ?? 0) || 0;
              return { nombre, cantidad, precioUnitario };
            })
          : [];

        const normalized = {
          id: found.ID_PRODUCTO ?? found.Id ?? found.id ?? found.ID ?? found.id,
          nombre: found.NOMBRE_PRODUCTO ?? found.Name ?? found.nombre ?? found.nombre_producto ?? found.nombre_completo ?? found.nombre,
          tipo: found.TIPO_PRODUCTO ?? found.Type ?? found.tipo ?? found.tipo_producto ?? found.tipo,
          descripcion: found.DESCRIPCION ?? found.description ?? found.descripcion ?? found.descripcion_producto ?? found.descripcion,
          // accept PRECIO_BASE (backend) and other variants
          precioBase: Number(found.PRECIO_BASE ?? found.PRECIO ?? found.PRECIO_UNITARIO ?? found.precioBase ?? found.price ?? found.PRECIO_VENTA ?? 0) || 0,
          imagen_url: (found.IMAGEN_URL ?? found.imagen_url ?? found.imageUrl ?? found.ImageUrl ?? found.imagen) || "/placeholder.jpg",
          items: normalizedItems
        };

        // If precioBase is 0 but items have prices, derive precioBase from items
        if ((!normalized.precioBase || normalized.precioBase === 0) && normalized.items.length > 0) {
          const sum = normalized.items.reduce((s, it) => s + (Number(it.precioUnitario) || 0) * (Number(it.cantidad) || 1), 0);
          if (sum > 0) normalized.precioBase = sum;
        }

        // If no items provided, create a single-item array from the product using precioBase
        if (!normalized.items || normalized.items.length === 0) {
          normalized.items = [
            { nombre: normalized.nombre || "Producto", cantidad: 1, precioUnitario: Number(normalized.precioBase) || 0 }
          ];
        }

        setCombo(normalized);
        setComboQuantity(1); // Reset quantity to 1 when loading a new combo
      }
    };

    loadCombo();
  }, [id, combos]);

  useEffect(() => {
    if (combo) {
      // Compute total price robustly: prefer explicit precioBase, otherwise sum item prices
      const base = Number(combo.precioBase) || 0;
      if (base > 0) {
        setTotalPrice(base * comboQuantity);
      } else {
        const itemsTotal = (combo.items || []).reduce((s, it) => {
          const unit = Number(it.precioUnitario) || 0;
          const cnt = Number(it.cantidad) || 1;
          return s + unit * cnt;
        }, 0);
        setTotalPrice(itemsTotal * comboQuantity);
      }
    }
  }, [combo, comboQuantity]);

  const updateComboQuantity = (change) => {
    setComboQuantity(prev => Math.max(1, prev + change));
  };

  const handleQuantityChange = (e) => {
    // allow only positive integers, fallback to 1
    const raw = e.target.value;
    // if user clears the field, don't set to NaN — keep empty then coerce to 1 on blur
    const parsed = Number(raw);
    if (raw === "") {
      setComboQuantity("");
      return;
    }
    if (Number.isNaN(parsed)) return;
    setComboQuantity(Math.max(1, Math.floor(parsed)));
  };

  const handleQuantityBlur = () => {
    // ensure at least 1
    setComboQuantity(prev => (prev === "" || Number(prev) < 1 ? 1 : Number(prev)));
  };

  const handleAddToCart = () => {
    if (!user) {
      // Show login modal like other actions for non-authenticated users
      setShowUserLogin?.(true);
      return;
    }

    // Build a compact product object compatible with cart functions
    const productForCart = {
      ID_PRODUCTO: combo.id,
      NOMBRE_PRODUCTO: combo.nombre,
      PRECIO: Number(combo.precioBase) || totalPrice || 0,
      IMAGEN_URL: combo.imagen_url,
      // keep items for reference
      items: combo.items,
    };

    try {
      addToCart(productForCart, comboQuantity);
      toast.success(`${String(combo.nombre || "").replace(/^\s*combo\s+/i, "")} agregado al carrito`);
      navigate("/cart");
    } catch (err) {
      console.error("Error adding combo to cart", err);
      toast.error("No se pudo añadir al carrito");
    }
  };

  if (!combo) {
    return (
      <div className="mt-16 pb-16 max-w-4xl mx-auto">
        <div className="text-center">
          <p className="text-xl text-gray-500">Combo no encontrado</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col items-start mb-8">
        {/* show tipo only if it's provided and not the literal 'combo' to avoid repetition */}
        {combo.tipo && String(combo.tipo).toLowerCase() !== "combo" ? (
          <p className="text-2xl font-medium uppercase mb-2">{String(combo.tipo).toUpperCase()}</p>
        ) : null}

        {/* remove leading 'Combo' from display name */}
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{String(combo.nombre || "").replace(/^\s*combo\s+/i, "")}</h1>

        {/* show price base prominently */}
        {combo.precioBase !== undefined && combo.precioBase !== null ? (
          <div className="text-2xl font-bold text-sky-600 mb-2">Q{Number(combo.precioBase).toFixed(2)}</div>
        ) : null}

        <div className="w-16 h-0.5 bg-sky-500 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Imagen y descripción */}
        <div>
          <div className="rounded-lg overflow-hidden mb-6">
            <img
              src={combo.imagen_url}
              alt={String(combo.nombre || "").replace(/^\s*combo\s+/i, "")}
              className="w-full h-64 object-cover"
            />
          </div>
          <p className="text-gray-700 text-lg mb-4">{combo.descripcion}</p>
          <div className="flex items-center gap-2 mb-4">
            {combo.icon}
            {/* Only show tipo if it's not the generic word 'combo' */}
            {combo.tipo && String(combo.tipo).toLowerCase() !== "combo" ? (
              <span className="text-sky-600 font-medium">{combo.tipo}</span>
            ) : null}
          </div>
        </div>

        {/* Detalles y cantidad del combo */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">Detalles del Combo</h2>

          {/* Control de cantidad de combos */}
          <div className="mb-6">
            <p className="font-medium text-gray-800 mb-3">Cantidad de combos:</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateComboQuantity(-1)}
                className="w-10 h-10 rounded-full bg-sky-100 hover:bg-sky-200 flex items-center justify-center transition"
              >
                <Minus className="w-5 h-5 text-sky-600" />
              </button>

              <input
                type="number"
                min={1}
                value={comboQuantity}
                onChange={handleQuantityChange}
                onBlur={handleQuantityBlur}
                inputMode="numeric"
                className="w-20 text-center font-medium text-lg px-2 py-1 rounded border border-gray-200"
                aria-label="Cantidad de combos"
              />

              <button
                onClick={() => updateComboQuantity(1)}
                className="w-10 h-10 rounded-full bg-sky-100 hover:bg-sky-200 flex items-center justify-center transition"
              >
                <Plus className="w-5 h-5 text-sky-600" />
              </button>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {combo.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.nombre}</p>
                  <p className="text-sm text-gray-600">Q{item.precioUnitario.toFixed(2)} c/u</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-medium text-gray-800">
                    {item.cantidad * comboQuantity}
                  </span>
                  <p className="text-sm text-gray-600">unidades</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center text-xl font-bold mb-6">
              <span>Total:</span>
              <span className="text-sky-600">Q{totalPrice.toFixed(2)}</span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!user}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition font-medium ${!user ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-sky-500 hover:bg-sky-600 text-white'}`}
            >
              <ShoppingCart className="w-5 h-5" />
              Agregar al Carrito
            </button>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-12 bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Información del Combo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Incluye:</h4>
            <ul className="space-y-1">
              {combo.items.map((item, index) => (
                <li key={index} className="text-gray-600 flex items-center">
                  <span className="w-2 h-2 bg-sky-500 rounded-full mr-3"></span>
                  {item.nombre} ({item.cantidad * comboQuantity})
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Notas importantes:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Entrega disponible en zona metropolitana</li>
              <li>• Pedidos con 24 horas de anticipación</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComboDetails;