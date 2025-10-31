import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const AdminUpload = () => {
  const { products, fetchProducts } = useAppContext();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!products || products.length === 0) fetchProducts();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId) return toast.error("Selecciona un producto");
    if (!file) return toast.error("Selecciona una imagen");

    const fd = new FormData();
    fd.append("image", file);

    try {
      setUploading(true);
      const res = await fetch(`${import.meta.env.DEV ? "http://localhost:5000" : ""}/api/products/${selectedProductId}/image`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error uploading image");
      }

      toast.success("Imagen subida con éxito");
      setFile(null);
      // refresh products
      if (typeof fetchProducts === "function") fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error("Error subiendo la imagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-16 max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Carga de imágenes (Administrador)</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Producto</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full mt-1 p-2 border rounded"
          >
            <option value="">-- Selecciona un producto --</option>
            {(products || []).map((p) => (
              <option key={p.ID_PRODUCTO ?? p.Id ?? p.id ?? p.ID} value={p.ID_PRODUCTO ?? p.Id ?? p.id ?? p.ID}>
                {p.NOMBRE_PRODUCTO ?? p.Name ?? p.nombre ?? p.nombre_producto ?? `#${p.ID_PRODUCTO ?? p.Id ?? p.id}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Imagen</label>
          <label className="inline-flex items-center gap-3">
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <span className="px-3 py-2 bg-sky-500 text-white rounded cursor-pointer text-sm">Seleccionar imagen</span>
            <span className="text-sm text-gray-600">{file ? file.name : "Ningún archivo seleccionado"}</span>
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600"
          >
            {uploading ? "Subiendo..." : "Subir imagen"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminUpload;
