import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const AdminPanel = () => {
  const { user, products, fetchProducts, API_URL_DIRECT, createProduct, combos } = useAppContext();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [localProducts, setLocalProducts] = useState(products || []);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [llmPrompt, setLlmPrompt] = useState("");
  const [llmResponse, setLlmResponse] = useState(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmParsed, setLlmParsed] = useState(null);

  // --- Add single product/combo form state & handlers (moved here to avoid conditional hooks) ---
  const [newProduct, setNewProduct] = useState({
    Nombre_producto: "",
    Tipo_producto: "",
    Precio_base: "",
    Personalizable: false,
    Atributos: "",
    Disponible: true,
  });
  const [newImageFile, setNewImageFile] = useState(null);
  const [adding, setAdding] = useState(false);

  // --- Bulk CSV upload state (also must be declared unconditionally) ---
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ total: 0, done: 0, failed: 0 });

  useEffect(() => {
    setLocalProducts(products || []);
  }, [products]);

  // Helpers to normalize product fields coming from different sources (DB vs frontend)
  const getId = (p) => {
    return (
      p?.id ??
      p?._id ??
      p?.ID_Producto ??
      p?.ID_PRODUCTO ??
      p?.ID_PRODUCTO ??
      p?.ID ??
      p?.Id ??
      JSON.stringify(p) // fallback to avoid undefined keys (rare)
    );
  };

  const getName = (p) => {
    return (
      p?.title ??
      p?.name ??
      p?.Nombre_producto ??
      p?.NOMBRE_PRODUCTO ??
      p?.nombre_producto ??
      p?.descripcion ??
      p?.descripcion_producto ??
      "Sin nombre"
    );
  };

  useEffect(() => {
    // try to fetch server analytics if endpoint exists
    const load = async () => {
      try {
        const res = await fetch(`${API_URL_DIRECT}/admin/analytics`);
        if (!res.ok) return;
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        // ignore if not available
      }
    };
    load();
  }, []);

  if (!user || !user.isAdmin) {
    return (
      <div className="mt-16 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-semibold mb-4">Acceso denegado</h2>
        <p className="text-gray-600">Debes ser administrador para ver este panel.</p>
      </div>
    );
  }

  const startEdit = (p) => {
    // Normalize fields into the editing shape so inputs are pre-filled
    const charToBool = (v) => {
      if (v === undefined || v === null) return false;
      if (typeof v === "boolean") return v;
      const s = String(v).toUpperCase();
      return s === "S" || s === "Y" || s === "1" || s === "T" || s === "TRUE";
    };

    setEditing({
      // ID (readonly)
      id: getId(p),
      // DB column: Nombre_producto
      Nombre_producto: p?.Nombre_producto ?? p?.NOMBRE_PRODUCTO ?? p?.Nombre_producto ?? getName(p),
      // DB column: Tipo_producto
      Tipo_producto: p?.Tipo_producto ?? p?.TIPO_PRODUCTO ?? p?.Tipo_producto ?? "",
      // DB column: Precio_base
      Precio_base: p?.Precio_base ?? p?.PRECIO_BASE ?? p?.Precio ?? p?.price ?? 0,
      // DB column: Personalizable (CHAR(1)) -> normalize to boolean in the form
      Personalizable: charToBool(p?.Personalizable ?? p?.PERSONALIZABLE ?? p?.Personalizable ?? p?.Personalizable_flag),
      // DB column: Atributos (CLOB)
      Atributos: p?.Atributos ?? p?.ATRIBUTOS ?? p?.atributos ?? p?.Descripcion ?? p?.DESCRIPCION ?? "",
      // DB column: Disponible (CHAR(1)) -> boolean
      Disponible: charToBool(p?.Disponible ?? p?.DISPONIBLE ?? p?.Disponible),
      raw: p,
    });
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      // Map booleans to CHAR(1) expected by the DB (assumption: 'S' = true, 'N' = false)
      const boolToChar = (b) => (b ? "S" : "N");

      // Attempt to update product fields (backend should support PUT).
      // Use DB column names that match the Productos table.
      const payload = {
        Nombre_producto: editing.Nombre_producto ?? editing.title ?? editing.name,
        Tipo_producto: editing.Tipo_producto ?? null,
        Precio_base: editing.Precio_base ?? editing.price ?? 0,
        Personalizable: boolToChar(!!editing.Personalizable),
        Atributos: editing.Atributos ?? editing.description ?? null,
        Disponible: boolToChar(!!editing.Disponible),
      };

      const res = await fetch(`${API_URL_DIRECT}/products/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (res.ok) {
        // If an image was selected, upload it separately
        if (imageFile) {
          try {
            console.log("[AdminPanel] Subiendo imagen para producto", editing.id, { name: imageFile.name, size: imageFile.size, type: imageFile.type });
            const form = new FormData();
            // add filename explicitly
            form.append("image", imageFile, imageFile.name);
            const up = await fetch(`${API_URL_DIRECT}/products/${editing.id}/image`, {
              method: "POST",
              body: form,
            });
            if (!up.ok) {
              const txt = await up.text().catch(() => null);
              console.error("[AdminPanel] Error subiendo imagen, status:", up.status, txt);
              throw new Error(txt || "Image upload failed");
            }
            console.log("[AdminPanel] Imagen subida correctamente para producto", editing.id);
          } catch (imgErr) {
            console.error(imgErr);
            toast.error("Error subiendo la imagen: " + (imgErr?.message ?? ""));
          }
        }

        toast.success("Producto actualizado");
        await fetchProducts();
        setEditing(null);
        setImageFile(null);
      } else {
        toast.error(data?.message || "Error actualizando producto");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (p) => {
    const pid = getId(p);
    if (!confirm(`¿Eliminar producto ${getName(p)}?`)) return;
    try {
      const res = await fetch(`${API_URL_DIRECT}/products/${pid}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Producto eliminado");
        await fetchProducts();
      } else {
        const data = await res.json();
        toast.error(data?.message || "Error eliminando producto");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión");
    }
  };

  

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.Nombre_producto) return toast.error("El nombre es requerido");
    setAdding(true);
    try {
      // Map fields to expected payload shape (DB column names)
      const payload = {
        Nombre_producto: newProduct.Nombre_producto,
        Tipo_producto: newProduct.Tipo_producto || "producto",
        Precio_base: Number(newProduct.Precio_base) || 0,
        Personalizable: newProduct.Personalizable ? "S" : "N",
        Atributos: newProduct.Atributos || null,
        Disponible: newProduct.Disponible ? "S" : "N",
      };

      // Use createProduct (it appends userId) so we reuse gateway logic
      const result = await createProduct(payload);
      if (result && result.success && result.productId) {
        toast.success("Producto creado correctamente");
        // If an image was selected, upload it using the same endpoint used for edits
        if (newImageFile) {
          try {
            console.log("[AdminPanel] Subiendo imagen para nuevo producto", result.productId, { name: newImageFile.name, size: newImageFile.size, type: newImageFile.type });
            const form = new FormData();
            form.append("image", newImageFile, newImageFile.name);
            const up = await fetch(`${API_URL_DIRECT}/products/${result.productId}/image`, {
              method: "POST",
              body: form,
            });
            if (!up.ok) {
              const txt = await up.text().catch(() => null);
              console.error("[AdminPanel] Error subiendo imagen (nuevo producto), status:", up.status, txt);
              throw new Error(txt || "Image upload failed");
            }
            console.log("[AdminPanel] Imagen subida correctamente para nuevo producto", result.productId);
          } catch (imgErr) {
            console.error(imgErr);
            toast.error("Producto creado pero fallo la subida de imagen: " + (imgErr?.message ?? ""));
          }
        }
        // reset form and refresh list
        setNewProduct({ Nombre_producto: "", Tipo_producto: "", Precio_base: "", Personalizable: false, Atributos: "", Disponible: true });
        setNewImageFile(null);
        await fetchProducts();
      } else {
        toast.error(result?.message || "No se pudo crear el producto");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creando el producto");
    } finally {
      setAdding(false);
    }
  };

  // --- Bulk CSV upload ---
  const handleBulkFile = (f) => {
    setBulkFile(f);
  };

  const parseCsvText = (text) => {
    // Robust CSV parser that supports quoted fields and escaped quotes (double-double quotes)
    // Returns array of objects using the first non-empty line as header
    const lines = text.split(/\r?\n/);
    const rows = [];
    // Parse CSV into array of arrays (cells)
    const records = [];
    let current = [];
    let cell = "";
    let inQuotes = false;
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (ch === '"') {
        if (inQuotes && text[i + 1] === '"') {
          // escaped double quote
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = !inQuotes;
        i++;
        continue;
      }
      if (!inQuotes && (ch === ',')) {
        current.push(cell);
        cell = "";
        i++;
        continue;
      }
      if (!inQuotes && (ch === '\n' || (ch === '\r' && text[i + 1] === '\n'))) {
        // handle CRLF or LF
        current.push(cell);
        records.push(current);
        current = [];
        cell = "";
        if (ch === '\r' && text[i + 1] === '\n') i += 2; else i++;
        continue;
      }
      // normal character
      cell += ch;
      i++;
    }
    // push last cell/row
    if (cell !== "" || inQuotes || current.length > 0) {
      current.push(cell);
      records.push(current);
    }

    // Filter out empty lines and trim cells
    const cleaned = records.map(r => r.map(c => {
      let v = c ?? "";
      v = v.trim();
      // Remove surrounding quotes if present
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      return v;
    })).filter(r => r.length > 0 && r.some(c => c !== ""));

    if (cleaned.length === 0) return [];

    const headers = cleaned[0].map(h => h.trim());
    const dataRows = cleaned.slice(1);
    const objs = dataRows.map(cols => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx] ?? "";
      });
      return obj;
    });
    return objs;
  };

  const processBulkCsv = async () => {
    if (!bulkFile) return toast.error("Selecciona un archivo CSV");
    setBulkProcessing(true);
    setBulkProgress({ total: 0, done: 0, failed: 0 });
    try {
      const text = await bulkFile.text();
      const rows = parseCsvText(text);
      setBulkProgress(p => ({ ...p, total: rows.length }));
      let done = 0, failed = 0;
      for (const r of rows) {
        // Map CSV columns to payload (accept headers in Spanish or English)
        const payload = {
          Nombre_producto: r.Nombre_producto ?? r.NOMBRE_PRODUCTO ?? r.name ?? r.nombre ?? "",
          Tipo_producto: r.Tipo_producto ?? r.TIPO_PRODUCTO ?? r.type ?? r.tipo ?? "producto",
          Precio_base: Number(r.Precio_base ?? r.PRECIO_BASE ?? r.price ?? r.Precio ?? 0) || 0,
          Personalizable: (String(r.Personalizable ?? r.PERSONALIZABLE ?? r.personalizable ?? "").toUpperCase() === "S" || String(r.Personalizable ?? r.PERSONALIZABLE ?? "").toUpperCase() === "Y" || String(r.Personalizable ?? r.PERSONALIZABLE ?? "").toUpperCase() === "TRUE") ? "S" : "N",
          Atributos: r.Atributos ?? r.ATRIBUTOS ?? r.attributes ?? r.descripcion ?? r.DESCRIPCION ?? null,
          Disponible: (String(r.Disponible ?? r.DISPONIBLE ?? r.disponible ?? "").toUpperCase() === "S" || String(r.Disponible ?? r.DISPONIBLE ?? "").toUpperCase() === "Y" || String(r.Disponible ?? r.DISPONIBLE ?? "").toUpperCase() === "TRUE") ? "S" : "N",
        };

        try {
          const res = await createProduct(payload);
          if (res && res.success && res.productId) {
            done++;
          } else {
            failed++;
            console.warn("Row failed", payload, res);
          }
        } catch (err) {
          failed++;
          console.error("Bulk row error", err);
        }
        setBulkProgress(p => ({ ...p, done, failed }));
      }
      toast.success(`Carga finalizada. Creado: ${done}, Fallidos: ${failed}`);
      await fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error("Error procesando CSV");
    } finally {
      setBulkProcessing(false);
    }
  };

  // Basic client-side indicators as fallback
  const totalProducts = localProducts.length;
  const totalCombos = 0; // could be wired if combos are provided via context

  const topProducts = [...localProducts]
    .sort((a, b) => (b.sales || b.ventas || 0) - (a.sales || a.ventas || 0))
    .slice(0, 5);

  return (
    <div className="mt-16 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Panel de Administrador</h1>
        <div className="text-sm text-gray-600">Bienvenido, {user.name}</div>
      </div>

      <div className="mb-6">
        <nav className="flex gap-2">
          <button onClick={() => setActiveTab("dashboard")} className={`px-4 py-2 rounded ${activeTab === "dashboard" ? "bg-sky-500 text-white" : "bg-sky-50 text-sky-600"}`}>
            Dashboard
          </button>
          <button onClick={() => setActiveTab("products")} className={`px-4 py-2 rounded ${activeTab === "products" ? "bg-sky-500 text-white" : "bg-sky-50 text-sky-600"}`}>
            Gestionar Productos
          </button>
        </nav>
      </div>

      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-white border rounded-lg">
            <p className="text-sm text-gray-600">Ventas diarias</p>
            <p className="text-2xl font-bold">{analytics?.dailySales !== undefined ? `Q${Number(analytics.dailySales).toFixed(2)}` : "N/A"}</p>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <p className="text-sm text-gray-600">Ventas mensuales</p>
            <p className="text-2xl font-bold">{analytics?.monthlySales !== undefined ? `Q${Number(analytics.monthlySales).toFixed(2)}` : "N/A"}</p>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <p className="text-sm text-gray-600">Productos totales</p>
            <p className="text-2xl font-bold">{totalProducts}</p>
          </div>

          <div className="p-4 bg-white border rounded-lg md:col-span-2">
            <p className="text-sm text-gray-600">Tamales más vendidos</p>
            <ul className="mt-2 list-disc pl-5">
              {analytics?.topTamales?.length ? (
                analytics.topTamales.map((t, i) => (
                  <li key={(t?.name ?? "top") + "-" + i}>{t.name} — {t.sales}</li>
                ))
              ) : (
                topProducts.length ? topProducts.map((p, i) => (
                  <li key={getId(p) + "-" + i}>{getName(p)} — {p.sales ?? p.ventas ?? p.VENTAS ?? 0}</li>
                )) : <li>No hay datos</li>
              )}
            </ul>
          </div>

          <div className="p-4 bg-white border rounded-lg">
            <p className="text-sm text-gray-600">Bebidas por franja horaria</p>
            {analytics?.drinksBySlot && analytics.drinksBySlot.length ? (
              <div className="text-sm text-gray-700">
                {analytics.drinksBySlot.map((d, i) => {
                  // Accept different field names depending on DB driver
                  const hour = d.HOUR ?? d.hour ?? d.HOUR_ ?? d.hour;
                  const count = d.COUNT ?? d.count ?? d.CNT ?? d.count;
                  return (
                    <div key={"slot-" + i} className="flex justify-between">
                      <span>Hora {hour}</span>
                      <span>{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">N/D</p>
            )}
          </div>

          <div className="p-4 bg-white border rounded-lg">
            <p className="text-sm text-gray-600">Picante vs No picante</p>
            <p className="text-sm text-gray-500">
              {analytics?.spicyRatio
                ? `${analytics.spicyRatio.spicy ?? 0} / ${analytics.spicyRatio.nonSpicy ?? 0}`
                : "N/D"}
            </p>
          </div>

          <div className="p-4 bg-white border rounded-lg">
            <p className="text-sm text-gray-600">Utilidades por línea</p>
            {analytics?.profitByLine && analytics.profitByLine.length ? (
              <div className="text-sm text-gray-700">
                {analytics.profitByLine.map((r, i) => (
                  <div key={"profit-" + i} className="flex justify-between">
                    <span>{r.LINE ?? r.line ?? r.linea ?? r.line}</span>
                    <span>Q{Number(r.PROFIT ?? r.profit ?? 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">N/D</p>
            )}
          </div>

          <div className="p-4 bg-white border rounded-lg">
            <p className="text-sm text-gray-600">Desperdicio materia prima (hoy)</p>
            <p className="text-2xl font-bold">{analytics?.dailyWaste !== undefined ? `Q${Number(analytics.dailyWaste).toFixed(2)}` : 'N/D'}</p>
            <p className="text-sm text-gray-500">Mensual: {analytics?.monthlyWaste !== undefined ? `Q${Number(analytics.monthlyWaste).toFixed(2)}` : 'N/D'}</p>
            {analytics?.wasteByIngredient && analytics.wasteByIngredient.length ? (
              <div className="mt-3 text-sm text-gray-700">
                <div className="font-medium mb-1">Top ingredientes por costo de merma</div>
                {analytics.wasteByIngredient.slice(0,5).map((w, i) => (
                  <div key={"w-"+i} className="flex justify-between">
                    <span>{w.NAME ?? w.name ?? w.NOMBRE_INVENTARIO ?? w.nombre_inventario}</span>
                    <span>Q{Number(w.COSTO_MERMA ?? w.costo_merma ?? w.COSTO_MERMA ?? 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

        </div>
      )}

      {/* LLM Recommendations card */}
      {activeTab === "dashboard" && (
        <div className="mb-8">
          <div className="p-4 bg-white border rounded-lg max-w-4xl mx-auto">
            <h3 className="font-medium mb-2">Asistente de recomendaciones (LLM)</h3>
            <p className="text-sm text-gray-600 mb-3">Pide recomendaciones basadas en las estadísticas actuales. Deja el prompt vacío para una sugerencia automática.</p>
            <textarea value={llmPrompt} onChange={(e) => setLlmPrompt(e.target.value)} placeholder="Escribe una petición (ej: sugerir combos para aumentar ventas de tamales)..." className="w-full border p-2 rounded mb-3" rows={3} />
            <div className="flex items-center gap-2">
              <button disabled={llmLoading} onClick={async () => {
                try {
                  setLlmLoading(true);

                  // Build structured context for the admin LLM: include analytics + top combos/products
                  const normalize = (it) => ({
                    id: it?.ID_Producto ?? it?.id ?? it?.Id ?? null,
                    name: it?.Nombre_producto ?? it?.name ?? it?.title ?? null,
                    type: it?.Tipo_producto ?? it?.type ?? null,
                    price: it?.Precio_base ?? it?.price ?? null,
                    attributes: it?.Atributos ?? it?.attributes ?? null,
                    available: it?.Disponible ?? it?.available ?? null,
                  });

                  const topCombos = (combos || []).slice(0,8).map(normalize);
                  const topProducts = (localProducts || []).slice(0,12).map(normalize).slice(0,8);

                  const contextObj = {
                    analytics: analytics ?? null,
                    topCombos,
                    topProducts,
                    totals: { totalProducts: localProducts.length }
                  };

                  const systemMessage = {
                    role: 'system',
                    content: `Eres un asesor administrativo para una taquería. Usa SOLO el contexto JSON provisto y NO inventes métricas ni nombres que no estén presentes.
Responde en ESPAÑOL y devuélveme ÚNICAMENTE JSON válido con esta estructura:
{
  "insights": [{ "area": "ventas|merma|precio|marketing", "message": string }],
  "recommendations": [{ "title": string, "impactEstimate": number|null, "steps": [string] }]
}
No incluyas tablas Markdown ni texto fuera del JSON. Si no puedes calcular una métrica, usa null en lugar de inventar un número.`
                  };

                  const userText = llmPrompt && llmPrompt.trim().length ? llmPrompt.trim() : 'Genera 3 recomendaciones accionables para aumentar ventas y reducir merma basadas en el contexto proporcionado.';
                  const userMessage = { role: 'user', content: `Contexto: ${JSON.stringify(contextObj)}\nPetición: ${userText}` };

                  const messagesPayload = [systemMessage, userMessage];

                  const res = await fetch(`${API_URL_DIRECT}/llm`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: messagesPayload })
                  });
                  const data = await res.json();
                  const rawContent = data?.content ?? JSON.stringify(data?.raw ?? data);
                  // Try parse JSON
                  try {
                    const parsed = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
                    setLlmParsed(parsed);
                    setLlmResponse('Respuesta recibida (ver vista resumida)');
                  } catch (e) {
                    setLlmParsed(null);
                    setLlmResponse(typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent, null, 2));
                  }
                } catch (err) {
                  setLlmResponse('Error en la solicitud LLM: ' + (err.message || err));
                } finally { setLlmLoading(false); }
              }} className="px-3 py-2 bg-sky-500 text-white rounded">{llmLoading ? 'Procesando...' : 'Pedir recomendación'}</button>
              <button onClick={() => { setLlmPrompt(''); setLlmResponse(null); }} className="px-3 py-2 border rounded">Limpiar</button>
            </div>

            {llmResponse && (
              <div className="mt-4">
                <div className="mb-3 text-sm text-gray-700">{llmResponse}</div>
                {llmParsed ? (
                  <div className="space-y-3">
                    {Array.isArray(llmParsed.insights) && (
                      <div className="p-3 bg-white border rounded">
                        <div className="font-medium mb-2">Insights</div>
                        {llmParsed.insights.map((ins, i) => (
                          <div key={i} className="text-sm text-gray-700 mb-1"><strong>{ins.area}</strong>: {ins.message}</div>
                        ))}
                      </div>
                    )}

                    {Array.isArray(llmParsed.recommendations) && (
                      <div className="p-3 bg-white border rounded">
                        <div className="font-medium mb-2">Recomendaciones</div>
                        {llmParsed.recommendations.map((r, i) => (
                          <div key={i} className="mb-2">
                            <div className="font-medium">{r.title}</div>
                            <div className="text-sm text-gray-700">{r.description}</div>
                            {Array.isArray(r.steps) && (
                              <ol className="list-decimal pl-5 text-sm text-gray-700 mt-1">
                                {r.steps.map((s, si) => <li key={si}>{s}</li>)}
                              </ol>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <pre className="mt-2 p-3 bg-gray-50 border rounded text-sm whitespace-pre-wrap">{llmResponse}</pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}

          {activeTab === "products" && (
        <div>
          {/* Add New product / combo form */}
          <div className="mb-6 p-4 bg-white border rounded-lg">
            <h3 className="font-medium mb-2">Agregar producto / combo individual</h3>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-sm mb-1">Nombre</label>
                <input value={newProduct.Nombre_producto} onChange={(e) => setNewProduct({ ...newProduct, Nombre_producto: e.target.value })} className="border p-2 rounded w-full" />
              </div>
              <div>
                <label className="block text-sm mb-1">Tipo</label>
                <select value={newProduct.Tipo_producto} onChange={(e) => setNewProduct({ ...newProduct, Tipo_producto: e.target.value })} className="border p-2 rounded w-full">
                  <option value="producto">Producto</option>
                  <option value="combo">Combo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Precio base</label>
                <input type="number" step="0.01" value={newProduct.Precio_base} onChange={(e) => setNewProduct({ ...newProduct, Precio_base: e.target.value })} className="border p-2 rounded w-full" />
              </div>

              <div>
                <label className="block text-sm mb-1">Personalizable</label>
                <input type="checkbox" checked={!!newProduct.Personalizable} onChange={(e) => setNewProduct({ ...newProduct, Personalizable: e.target.checked })} />
              </div>

              <div>
                <label className="block text-sm mb-1">Disponible</label>
                <input type="checkbox" checked={!!newProduct.Disponible} onChange={(e) => setNewProduct({ ...newProduct, Disponible: e.target.checked })} />
              </div>

              <div>
                <label className="block text-sm mb-1">Imagen (opcional)</label>
                <label className="inline-flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setNewImageFile(e.target.files?.[0] ?? null)}
                  />
                  <span className="px-3 py-2 bg-sky-500 text-white rounded cursor-pointer text-sm">Seleccionar imagen</span>
                  <span className="text-sm text-gray-600">{newImageFile ? newImageFile.name : "Ningún archivo seleccionado"}</span>
                </label>
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm mb-1">Atributos / Descripción</label>
                <textarea value={newProduct.Atributos} onChange={(e) => setNewProduct({ ...newProduct, Atributos: e.target.value })} className="border p-2 rounded w-full" rows={3} />
              </div>

              <div className="md:col-span-3 text-right">
                <button disabled={adding} type="submit" className="px-4 py-2 bg-sky-500 text-white rounded">{adding ? "Creando..." : "Crear producto"}</button>
              </div>
            </form>
          </div>

          {/* Bulk CSV upload */}
          <div className="mb-6 p-4 bg-white border rounded-lg">
            <h3 className="font-medium mb-2">Carga masiva desde CSV</h3>
            <p className="text-sm text-gray-600 mb-3">El CSV debe tener encabezados como: Nombre_producto, Tipo_producto, Precio_base, Personalizable (S/N), Atributos, Disponible (S/N)</p>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-3">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => handleBulkFile(e.target.files?.[0] ?? null)}
                />
                <span className="px-3 py-2 bg-sky-500 text-white rounded cursor-pointer text-sm">Seleccionar CSV</span>
                <span className="text-sm text-gray-600">{bulkFile ? bulkFile.name : "Ningún archivo seleccionado"}</span>
              </label>
              <button disabled={bulkProcessing} onClick={processBulkCsv} className="px-3 py-2 bg-sky-500 text-white rounded">{bulkProcessing ? `Procesando ${bulkProgress.done}/${bulkProgress.total}` : "Procesar CSV"}</button>
              <div className="text-sm text-gray-600">{bulkProgress.total ? `Progreso: ${bulkProgress.done}/${bulkProgress.total} (fallidos: ${bulkProgress.failed})` : ""}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {localProducts.map((p, idx) => (
              <div key={getId(p) + "-" + idx} className="bg-white border rounded-lg p-4 flex flex-col">
                <div className="flex-1">
                  <h3 className="font-medium">{getName(p)}</h3>
                  <p className="text-sm text-gray-500">{p.description ?? p.Descripcion ?? p.DESCRIPCION}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => startEdit(p)} className="px-3 py-2 bg-sky-500 text-white rounded">Editar</button>
                  <button onClick={() => deleteProduct(p)} className="px-3 py-2 bg-red-500 text-white rounded">Borrar</button>
                </div>
              </div>
            ))}
          </div>

          {editing && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
                <h3 className="text-lg font-medium mb-4">Editar producto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* ID (readonly) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">ID</label>
                    <input value={editing?.id ?? ""} readOnly className="border p-2 rounded bg-gray-100 w-full" />
                  </div>

                  {/* Nombre_producto */}
                  <div>
                    <label className="block text-sm mb-1">Nombre</label>
                    <input value={editing?.Nombre_producto ?? ""} onChange={(e) => setEditing({ ...editing, Nombre_producto: e.target.value })} className="border p-2 rounded w-full" />
                  </div>

                  {/* Tipo_producto */}
                  <div>
                    <label className="block text-sm mb-1">Tipo</label>
                    <input value={editing?.Tipo_producto ?? ""} onChange={(e) => setEditing({ ...editing, Tipo_producto: e.target.value })} className="border p-2 rounded w-full" />
                  </div>

                  {/* Precio_base */}
                  <div>
                    <label className="block text-sm mb-1">Precio base</label>
                    <input type="number" step="0.01" value={editing?.Precio_base ?? ""} onChange={(e) => setEditing({ ...editing, Precio_base: Number(e.target.value) })} className="border p-2 rounded w-full" />
                  </div>

                  {/* Personalizable (CHAR(1)) */}
                  <div className="flex items-center gap-2">
                    <input id="personalizable" type="checkbox" checked={!!editing?.Personalizable} onChange={(e) => setEditing({ ...editing, Personalizable: e.target.checked })} />
                    <label htmlFor="personalizable" className="text-sm">Personalizable</label>
                  </div>

                  {/* Disponible (CHAR(1)) */}
                  <div className="flex items-center gap-2">
                    <input id="disponible" type="checkbox" checked={!!editing?.Disponible} onChange={(e) => setEditing({ ...editing, Disponible: e.target.checked })} />
                    <label htmlFor="disponible" className="text-sm">Disponible</label>
                  </div>

                  {/* Atributos (CLOB) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Atributos / Descripción</label>
                    <textarea value={editing?.Atributos ?? ""} onChange={(e) => setEditing({ ...editing, Atributos: e.target.value })} className="border p-2 rounded w-full" rows={6} />
                  </div>

                  {/* Imagen file upload */}
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Imagen (opcional)</label>
                    <label className="inline-flex items-center gap-3">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
                      <span className="px-3 py-2 bg-sky-500 text-white rounded cursor-pointer text-sm">Seleccionar imagen</span>
                      <span className="text-sm text-gray-600">{imageFile ? imageFile.name : "Ningún archivo seleccionado"}</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={cancelEdit} className="px-4 py-2 border rounded">Cancelar</button>
                  <button disabled={saving} onClick={saveEdit} className="px-4 py-2 bg-sky-500 text-white rounded">{saving ? "Guardando..." : "Guardar"}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
