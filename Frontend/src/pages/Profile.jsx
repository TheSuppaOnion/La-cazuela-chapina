import React, { useState, useEffect } from "react";
import { ChefHat, Camera, Edit3, Plus, LogOut } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import EditProfile from "../components/EditProfile";

const Profile = () => {
  const { user, navigate, logoutUser } = useAppContext();
  const isAdmin = user?.rol === "admin" || user?.role === "admin" || user?.isAdmin;
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [userProducts, setUserProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [stats, setStats] = useState({ totalProducts: 0, totalFavorites: 0, productsViews: 0 });

  const API_URL_DIRECT = import.meta.env.VITE_API_URL_DIRECT || "/api";

  // Cargar productos del usuario (simple fetch de ejemplo)
  const fetchUserProducts = async () => {
    if (!user) {
      setLoadingProducts(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL_DIRECT}/products`);
      const data = await res.json();
      if (data && data.success) {
        const userOwnProducts = data.products.filter(
          (product) => product.authorUsername === user.name || product.userId === user.id
        );
        setUserProducts(userOwnProducts.slice(0, 4));
        setStats({
          totalProducts: userOwnProducts.length,
          totalFavorites: user.productosFavoritos || 0,
          productsViews: userOwnProducts.reduce((t, r) => t + (r.views || 0), 0),
        });
      }
    } catch (err) {
      console.error("Error fetching user products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchUserProducts();
  }, [user]);

  const logout = () => {
    logoutUser();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-500 mb-4">Inicia sesión para ver tu perfil</p>
          <button onClick={() => navigate("/")} className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition">
            Ir al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold uppercase">Mi Perfil</h1>
          <div className="w-16 h-0.5 bg-sky-500 rounded-full mt-2" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center relative group">
            {user.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-400">
                <ChefHat className="w-12 h-12" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-opacity flex items-center justify-center">
              <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-800 mb-1">{user.fullName || user.name}</h2>
            <p className="text-gray-600 mb-1">@{user.name}</p>
            <p className="text-gray-500 text-sm mb-4">{user.email}</p>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-sky-50 rounded-lg">
                <p className="text-2xl font-bold text-sky-600">{stats.totalProducts}</p>
                <p className="text-sm text-gray-600">Productos</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{stats.totalFavorites}</p>
                <p className="text-sm text-gray-600">Favoritos</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.productsViews}</p>
                <p className="text-sm text-gray-600">Vistas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <button onClick={() => setShowEditProfile(true)} className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition">
            <Edit3 className="w-4 h-4" />
            Editar Perfil
          </button>
          <button onClick={() => navigate("/admin")} className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition">
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
          {isAdmin && (
            <button onClick={() => navigate("/admin/upload")} className="flex items-center gap-2 px-6 py-3 bg-sky-100 hover:bg-sky-200 text-sky-600 rounded-lg transition">
              <Camera className="w-4 h-4" />
              Subir Imágenes
            </button>
          )}
          <button onClick={logout} className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition">
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-sky-500" />
          Mis Productos Recientes
        </h3>
        {userProducts.length > 0 && (
          <button onClick={() => navigate("/admin")} className="text-sky-500 hover:text-sky-600 transition text-sm font-medium">
            Ver todas ({stats.totalProducts}) →
          </button>
        )}
      </div>

      {loadingProducts ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-48 rounded-lg" />
          ))}
        </div>
      ) : userProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {userProducts.map((product) => (
            <div key={product._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer" onClick={() => navigate(`/product/${product._id}`)}>
              <div className="h-32 overflow-hidden">
                <img src={product.image?.[0]} alt={product.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-3">
                <h4 className="font-medium text-gray-800 truncate">{product.title}</h4>
                <p className="text-sm text-gray-500 truncate">{product.description}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>{product.category}</span>
                  <span>{product.prepTime} min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
            <div className="text-center py-12">
          <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No has creado productos aún</p>
          <button onClick={() => navigate("/admin")} className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition">
            Crear Mi Primer Producto
          </button>
        </div>
      )}

      {showEditProfile && <EditProfile onClose={() => setShowEditProfile(false)} user={user} />}
    </div>
  );
};

export default Profile;
