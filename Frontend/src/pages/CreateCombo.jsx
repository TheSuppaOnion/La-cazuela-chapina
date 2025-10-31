import React, { useState, useEffect } from "react";
import { Plus, Minus, ShoppingCart, Check } from "lucide-react";
import { useAppContext } from "../context/AppContext";

const CreateCombo = () => {
  const { navigate } = useAppContext();
  const [combo, setCombo] = useState({
    tamales: {
      cantidad: 0,
      tipoCantidad: 'unidad', // 'unidad', 'media-docena', 'docena'
      masa: 'maiz-amarillo',
      relleno: 'recado-rojo',
      envoltura: 'hoja-platano',
      picante: 'sin-chile'
    },
    bebidas: {
      cantidad: 0,
      tamano: '12oz',
      tipo: 'atol-elote',
      endulzante: 'sin-azucar',
      toppings: []
    }
  });

  const [totalPrice, setTotalPrice] = useState(0);

  // Precios base
  const precios = {
    tamales: {
      unidad: 3.50,
      'media-docena': 18.00, // 3.00 cada uno
      docena: 30.00 // 2.50 cada uno
    },
    bebidas: {
      '12oz': 8.00,
      '1L': 15.00
    },
    toppings: 2.00 // por topping
  };

  useEffect(() => {
    calcularTotal();
  }, [combo]);

  const calcularTotal = () => {
    let total = 0;

    // Calcular precio de tamales
    if (combo.tamales.cantidad > 0) {
      const precioBaseTamal = precios.tamales[combo.tamales.tipoCantidad];
      total += precioBaseTamal;
    }

    // Calcular precio de bebidas
    if (combo.bebidas.cantidad > 0) {
      const precioBaseBebida = precios.bebidas[combo.bebidas.tamano];
      total += precioBaseBebida * combo.bebidas.cantidad;

      // Agregar precio de toppings
      total += combo.bebidas.toppings.length * precios.toppings * combo.bebidas.cantidad;
    }

    setTotalPrice(total);
  };

  const updateTamales = (field, value) => {
    setCombo(prev => ({
      ...prev,
      tamales: {
        ...prev.tamales,
        [field]: value
      }
    }));
  };

  const updateBebidas = (field, value) => {
    setCombo(prev => ({
      ...prev,
      bebidas: {
        ...prev.bebidas,
        [field]: value
      }
    }));
  };

  const toggleTopping = (topping) => {
    setCombo(prev => ({
      ...prev,
      bebidas: {
        ...prev.bebidas,
        toppings: prev.bebidas.toppings.includes(topping)
          ? prev.bebidas.toppings.filter(t => t !== topping)
          : [...prev.bebidas.toppings, topping]
      }
    }));
  };

  const addToCart = () => {
    if (combo.tamales.cantidad === 0 && combo.bebidas.cantidad === 0) {
      alert('Por favor selecciona al menos un producto');
      return;
    }

    alert(`Combo personalizado agregado al carrito por Q${totalPrice.toFixed(2)}`);
    navigate("/");
  };

  return (
    <div className="mt-16 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col items-start mb-8">
        <p className="text-2xl font-medium uppercase">Crear Combo</p>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Personaliza tu Pedido</h1>
        <div className="w-16 h-0.5 bg-sky-500 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personalización de Tamales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tamales */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                🌽
              </span>
              Tamales Tradicionales
            </h2>

            {/* Cantidad */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cantidad
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'unidad', label: 'Por Unidad', precio: 'Q3.50' },
                  { value: 'media-docena', label: 'Media Docena (6)', precio: 'Q18.00' },
                  { value: 'docena', label: 'Docena (12)', precio: 'Q30.00' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateTamales('tipoCantidad', option.value)}
                    className={`p-3 border rounded-lg text-center transition ${
                      combo.tamales.tipoCantidad === option.value
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-gray-200 hover:border-sky-300'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.precio}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Personalización */}
            <div className="space-y-4">
              {/* Masa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Masa
                </label>
                <select
                  value={combo.tamales.masa}
                  onChange={(e) => updateTamales('masa', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="maiz-amarillo">Maíz Amarillo</option>
                  <option value="maiz-blanco">Maíz Blanco</option>
                  <option value="arroz">Arroz</option>
                </select>
              </div>

              {/* Relleno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relleno
                </label>
                <select
                  value={combo.tamales.relleno}
                  onChange={(e) => updateTamales('relleno', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="recado-rojo">Recado Rojo de Cerdo</option>
                  <option value="negro-pollo">Negro de Pollo</option>
                  <option value="chipilin">Chipilín Vegetariano</option>
                  <option value="chuchito">Mezcla Estilo Chuchito</option>
                </select>
              </div>

              {/* Envoltura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Envoltura
                </label>
                <div className="flex gap-4">
                  {[
                    { value: 'hoja-platano', label: 'Hoja de Plátano' },
                    { value: 'tusa-maiz', label: 'Tusa de Maíz' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="envoltura"
                        value={option.value}
                        checked={combo.tamales.envoltura === option.value}
                        onChange={(e) => updateTamales('envoltura', e.target.value)}
                        className="mr-2 text-sky-600 focus:ring-sky-500"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Picante */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel de Picante
                </label>
                <div className="flex gap-4">
                  {[
                    { value: 'sin-chile', label: 'Sin Chile' },
                    { value: 'suave', label: 'Suave' },
                    { value: 'chapin', label: 'Chapín 🔥' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="picante"
                        value={option.value}
                        checked={combo.tamales.picante === option.value}
                        onChange={(e) => updateTamales('picante', e.target.value)}
                        className="mr-2 text-sky-600 focus:ring-sky-500"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bebidas */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                ☕
              </span>
              Bebidas Artesanales
            </h2>

            {/* Cantidad */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cantidad
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => updateBebidas('cantidad', Math.max(0, combo.bebidas.cantidad - 1))}
                  className="w-10 h-10 rounded-full bg-sky-100 hover:bg-sky-200 flex items-center justify-center transition"
                >
                  <Minus className="w-4 h-4 text-sky-600" />
                </button>
                <span className="text-xl font-medium w-8 text-center">{combo.bebidas.cantidad}</span>
                <button
                  onClick={() => updateBebidas('cantidad', combo.bebidas.cantidad + 1)}
                  className="w-10 h-10 rounded-full bg-sky-100 hover:bg-sky-200 flex items-center justify-center transition"
                >
                  <Plus className="w-4 h-4 text-sky-600" />
                </button>
              </div>
            </div>

            {/* Tamaño */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tamaño
              </label>
              <div className="flex gap-4">
                {[
                  { value: '12oz', label: 'Vaso 12oz - Q8.00' },
                  { value: '1L', label: 'Jarro 1L - Q15.00' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="tamano"
                      value={option.value}
                      checked={combo.bebidas.tamano === option.value}
                      onChange={(e) => updateBebidas('tamano', e.target.value)}
                      className="mr-2 text-sky-600 focus:ring-sky-500"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Tipo de bebida */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Bebida
              </label>
              <select
                value={combo.bebidas.tipo}
                onChange={(e) => updateBebidas('tipo', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="atol-elote">Atol de Elote</option>
                <option value="atole-shuco">Atole Shuco</option>
                <option value="pinol">Pinol</option>
                <option value="cacao-batido">Cacao Batido</option>
              </select>
            </div>

            {/* Endulzante */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Endulzante
              </label>
              <div className="flex gap-4">
                {[
                  { value: 'panela', label: 'Panela' },
                  { value: 'miel', label: 'Miel' },
                  { value: 'sin-azucar', label: 'Sin Azúcar' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="endulzante"
                      value={option.value}
                      checked={combo.bebidas.endulzante === option.value}
                      onChange={(e) => updateBebidas('endulzante', e.target.value)}
                      className="mr-2 text-sky-600 focus:ring-sky-500"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Toppings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Toppings (+Q2.00 cada uno)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'malvaviscos', label: 'Malvaviscos' },
                  { value: 'canela', label: 'Canela' },
                  { value: 'ralladura-cacao', label: 'Ralladura de Cacao' }
                ].map((topping) => (
                  <label key={topping.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={combo.bebidas.toppings.includes(topping.value)}
                      onChange={() => toggleTopping(topping.value)}
                      className="mr-2 text-sky-600 focus:ring-sky-500 rounded"
                    />
                    {topping.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Resumen y Total */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
            <h3 className="text-xl font-semibold mb-4">Resumen del Pedido</h3>

            {/* Resumen de tamales */}
            {combo.tamales.tipoCantidad !== 'unidad' || combo.tamales.cantidad > 0 ? (
              <div className="mb-4 p-3 bg-sky-50 rounded-lg">
                <h4 className="font-medium text-sky-800 mb-2">Tamales</h4>
                <div className="text-sm text-sky-700 space-y-1">
                  <p>Cantidad: {combo.tamales.tipoCantidad === 'unidad' ? '1 unidad' :
                    combo.tamales.tipoCantidad === 'media-docena' ? '6 unidades' : '12 unidades'}</p>
                  <p>Masa: {combo.tamales.masa.replace('-', ' ')}</p>
                  <p>Relleno: {combo.tamales.relleno.replace('-', ' ')}</p>
                  <p>Envoltura: {combo.tamales.envoltura.replace('-', ' ')}</p>
                  <p>Picante: {combo.tamales.picante.replace('-', ' ')}</p>
                </div>
              </div>
            ) : null}

            {/* Resumen de bebidas */}
            {combo.bebidas.cantidad > 0 ? (
              <div className="mb-4 p-3 bg-sky-50 rounded-lg">
                <h4 className="font-medium text-sky-800 mb-2">Bebidas</h4>
                <div className="text-sm text-sky-700 space-y-1">
                  <p>Cantidad: {combo.bebidas.cantidad}</p>
                  <p>Tamaño: {combo.bebidas.tamano}</p>
                  <p>Tipo: {combo.bebidas.tipo.replace('-', ' ')}</p>
                  <p>Endulzante: {combo.bebidas.endulzante.replace('-', ' ')}</p>
                  {combo.bebidas.toppings.length > 0 && (
                    <p>Toppings: {combo.bebidas.toppings.join(', ')}</p>
                  )}
                </div>
              </div>
            ) : null}

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-xl font-bold mb-4">
                <span>Total:</span>
                <span className="text-sky-600">Q{totalPrice.toFixed(2)}</span>
              </div>

              <button
                onClick={addToCart}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition font-medium"
              >
                <ShoppingCart className="w-5 h-5" />
                Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCombo;