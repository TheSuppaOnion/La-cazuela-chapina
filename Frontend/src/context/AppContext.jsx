import { createContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const currency = import.meta.env.VITE_CURRENCY || "Q";

  const isDevelopment = import.meta.env.DEV;

  // API endpoints
  const API_URL_DIRECT = import.meta.env.VITE_API_URL_DIRECT || (isDevelopment ? "http://localhost:5000/api" : "/api");

  const API_URL_GATEWAY = import.meta.env.VITE_API_URL_GATEWAY || (isDevelopment ? "http://localhost:5000/api" : "/api/gateway");

  // URL PARA AUTH (LOGIN/REGISTER)
  const API_URL_AUTH = import.meta.env.VITE_API_URL_AUTH || (isDevelopment ? "http://localhost:5000/api/auth" : "/api/auth");

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [combos, setCombos] = useState([]);
  const [products, setProducts] = useState([]);
  const [favoriteProducts, setFavoriteProducts] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  // Shopping cart state (persisted to localStorage)
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem("cart");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  const saveCart = (next) => {
    try {
      setCart(next);
      localStorage.setItem("cart", JSON.stringify(next));
    } catch (e) {
      console.warn("Error saving cart to localStorage", e);
    }
  };

  const _getId = (p) => p?.ID_PRODUCTO ?? p?.ID ?? p?._id ?? p?.id ?? null;

  const _getPrice = (p) => {
    const raw = p?.PRECIO ?? p?.PRECIO_BASE ?? p?.Precio_base ?? p?.price ?? p?.Precio ?? 0;
    return Number(raw) || 0;
  };

  const addToCart = (product, qty = 1) => {
    if (!product) return toast.error("Producto inválido");
    const id = _getId(product);
    if (!id) return toast.error("Producto sin identificador");
    const next = [...cart];
    const idx = next.findIndex((i) => i.id === id);
    if (idx >= 0) {
      next[idx] = { ...next[idx], qty: next[idx].qty + qty };
    } else {
      next.push({ id, product, qty });
    }
    saveCart(next);
    toast.success("Producto añadido al carrito");
  };

  const removeFromCart = (productId) => {
    const next = cart.filter((i) => i.id !== productId);
    saveCart(next);
  };

  const updateCartQty = (productId, qty) => {
    if (qty <= 0) return removeFromCart(productId);
    const next = cart.map((i) => (i.id === productId ? { ...i, qty } : i));
    saveCart(next);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const getCartCount = () => cart.reduce((s, i) => s + (i.qty || 0), 0);

  const getCartTotal = () => cart.reduce((s, i) => s + _getPrice(i.product) * (i.qty || 0), 0);

  useEffect(() => {
    // Verificar si hay usuario guardado en localStorage
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        // Ensure we have role/isAdmin flags even for older saved objects
        const role = parsed?.role ?? parsed?.rol ?? parsed?.ROL;
        const email = parsed?.email ?? parsed?.correo_electronico ?? parsed?.correo ?? parsed?.CORREO_USUARIO ?? parsed?.CORREO;
        const enhanced = {
          ...parsed,
          role,
          // accept both isAdmin and IS_ADMIN and is_admin flags coming from backend
          isAdmin: parsed?.isAdmin ?? parsed?.is_admin ?? parsed?.IS_ADMIN ?? false,
        };
        setUser(enhanced);
        console.log("Usuario cargado desde localStorage:", enhanced.id ?? "(sin id)", "isAdmin:", enhanced.isAdmin);
      } catch (error) {
        console.log("Error cargando usuario desde localStorage:", error);
        localStorage.removeItem("user");
      }
    }

    fetchProducts();
    fetchCombos();
  }, []);

  // React to localStorage changes from other tabs/windows so UI updates when 'user' changes elsewhere
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key !== "user") return;
      if (!e.newValue) {
        setUser(null);
        return;
      }
      try {
        const parsed = JSON.parse(e.newValue);
        const role = parsed?.role ?? parsed?.rol ?? parsed?.ROL;
        const email = parsed?.email ?? parsed?.correo_electronico ?? parsed?.correo ?? parsed?.CORREO_USUARIO;
        const enhanced = { ...parsed, role, isAdmin: parsed?.isAdmin ?? parsed?.is_admin ?? parsed?.IS_ADMIN ?? false };
        setUser(enhanced);
        console.log("Usuario actualizado por storage event:", enhanced.id ?? "(sin id)", "isAdmin:", enhanced.isAdmin);
      } catch (err) {
        console.warn("Error parsing user from storage event:", err);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);
  
  // products is the single source of truth for items in the app

  const fetchProducts = async () => {
    try {
      setLoading(true);
        console.log("Fetching products...");

      const response = await fetch(`${API_URL_DIRECT}/products`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Normalize product image field: if backend returns IMAGEN (base64 or bytes),
      // expose a safe `IMAGEN_URL` data URL so components can use it directly.
      const normalized = (data || []).map((p) => {
        try {
          const copy = { ...p };
          const img = copy.IMAGEN ?? copy.imagen ?? copy.image ?? null;
          if (img) {
            // If it's already a data URL, keep it.
            const str = typeof img === "string" ? img : null;
            if (str) {
              copy.IMAGEN_URL = str.startsWith("data:") ? str : `data:image/jpeg;base64,${str}`;
            } else {
              // img may be returned as a byte array, Uint8Array, or an object wrapper coming from Oracle driver.
              try {
                // common wrappers: { Buffer: [...] }, { Value: [...] }, { data: [...] }
                const candidate = img.Buffer ?? img.Value ?? img.data ?? img;
                if (typeof candidate === "string") {
                  copy.IMAGEN_URL = candidate.startsWith("data:") ? candidate : `data:image/jpeg;base64,${candidate}`;
                } else if (candidate instanceof Uint8Array || Array.isArray(candidate)) {
                  const b64 = btoa(String.fromCharCode(...candidate));
                  copy.IMAGEN_URL = `data:image/jpeg;base64,${b64}`;
                } else if (candidate && typeof candidate === "object") {
                  // try to collect numeric values into an array
                  const vals = Object.values(candidate).filter((v) => typeof v === "number");
                  if (vals.length > 0) {
                    const b64 = btoa(String.fromCharCode(...vals));
                    copy.IMAGEN_URL = `data:image/jpeg;base64,${b64}`;
                  }
                }
              } catch (e) {
                // ignore conversion error; leave IMAGEN_URL undefined
                console.warn("[AppContext] failed to convert IMAGEN blob to base64", e);
              }
            }
          }
          // Normalize price into a predictable numeric field `PRECIO`
          try {
            const rawPrice = copy.PRECIO ?? copy.PRECIO_BASE ?? copy.Precio_base ?? copy.Precio ?? copy.price ?? copy.PRECIO_BASE ?? 0;
            const priceNum = Number(rawPrice) || 0;
            copy.PRECIO = priceNum;
            // Keep a Precio_base numeric if present
            copy.PRECIO_BASE = Number(copy.PRECIO_BASE ?? copy.Precio_base ?? copy.Precio ?? priceNum) || priceNum;
          } catch (e) {
            copy.PRECIO = 0;
            copy.PRECIO_BASE = 0;
          }
          return copy;
        } catch (e) {
          return p;
        }
      });

      // Persist normalized products into context so UI receives data
      setProducts(normalized);
      // Debug: log info about image fields so we can see what's coming from the backend
      console.log(`${normalized.length} productos cargados`);
      if (normalized.length > 0) {
        const sample = normalized.slice(0, 5);
        sample.forEach((p) => {
          const raw = p.IMAGEN ?? p.imagen ?? p.image ?? null;
          console.log(
            "[AppContext] producto",
            p.ID_PRODUCTO ?? p.id ?? p.ID ?? "(sin id)",
            "IMAGEN raw type:",
            typeof raw,
            raw && raw.length ? (Array.isArray(raw) ? raw.length : (typeof raw === 'string' ? raw.length : 'unknown')) : 0,
            "IMAGEN_URL:",
            !!p.IMAGEN_URL
          );
        });
      }
      return normalized;
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCombos = async () => {
    try {
      setLoading(true);
      console.log("Fetching combos...");

      const response = await fetch(`${API_URL_DIRECT}/combos`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Normalize combo images similar to products so UI can use a predictable field
      const normalized = (data || []).map((c) => {
        try {
          const copy = { ...c };
          const img = copy.IMAGEN ?? copy.imagen ?? copy.image ?? copy.imagen_url ?? null;
          if (img) {
            const str = typeof img === "string" ? img : null;
            if (str) {
              copy.imagen_url = str.startsWith("data:") ? str : `data:image/jpeg;base64,${str}`;
              copy.IMAGEN_URL = copy.imagen_url;
            } else {
              try {
                const candidate = img.Buffer ?? img.Value ?? img.data ?? img;
                if (typeof candidate === "string") {
                  copy.imagen_url = candidate.startsWith("data:") ? candidate : `data:image/jpeg;base64,${candidate}`;
                  copy.IMAGEN_URL = copy.imagen_url;
                } else if (candidate instanceof Uint8Array || Array.isArray(candidate)) {
                  const b64 = btoa(String.fromCharCode(...candidate));
                  copy.imagen_url = `data:image/jpeg;base64,${b64}`;
                  copy.IMAGEN_URL = copy.imagen_url;
                } else if (candidate && typeof candidate === "object") {
                  const vals = Object.values(candidate).filter((v) => typeof v === "number");
                  if (vals.length > 0) {
                    const b64 = btoa(String.fromCharCode(...vals));
                    copy.imagen_url = `data:image/jpeg;base64,${b64}`;
                    copy.IMAGEN_URL = copy.imagen_url;
                  }
                }
              } catch (e) {
                console.warn("[AppContext] failed to convert combo IMAGEN blob to base64", e);
              }
            }
          }
          // Normalize price for combos too
          try {
            const rawPrice = copy.PRECIO ?? copy.PRECIO_BASE ?? copy.Precio_base ?? copy.Precio ?? copy.price ?? 0;
            const priceNum = Number(rawPrice) || 0;
            copy.PRECIO = priceNum;
            copy.PRECIO_BASE = Number(copy.PRECIO_BASE ?? copy.Precio_base ?? copy.Precio ?? priceNum) || priceNum;
          } catch (e) {
            copy.PRECIO = 0;
            copy.PRECIO_BASE = 0;
          }
          return copy;
        } catch (e) {
          return c;
        }
      });

  setCombos(normalized);
  console.log(`${normalized.length} combos cargados`);
  return normalized;
    } catch (error) {
      console.error("Error fetching combos:", error);
      setCombos([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchProductById = async (productId) => {
    try {
      const response = await fetch(`${API_URL_DIRECT}/products/${productId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // normalize image for single product
      if (data) {
        const img = data.IMAGEN ?? data.imagen ?? data.image ?? null;
        if (img) {
          const str = typeof img === "string" ? img : null;
          if (str) data.IMAGEN_URL = str.startsWith("data:") ? str : `data:image/jpeg;base64,${str}`;
          else if (img instanceof Uint8Array || Array.isArray(img)) {
            data.IMAGEN_URL = `data:image/jpeg;base64,${btoa(String.fromCharCode(...img))}`;
          }
        }
      }
      return data;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      return null;
    }
  };

  const fetchProductsByCategory = async (category) => {
    try {
      const response = await fetch(`${API_URL_DIRECT}/products?category=${category}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching products by category ${category}:`, error);
      return [];
    }
  };

  // CREAR PRODUCTO CON USERID REAL
  const createProduct = async (productData) => {
    try {
  console.log("Creating product...");

      if (!user) {
        toast.error("Debes iniciar sesión para crear productos");
        return { success: false, message: "No user logged in" };
      }

      // AGREGAR USERID REAL
      const dataWithUser = {
        ...productData,
        userId: user.id, // ID real del usuario logueado
      };

  console.log("Enviando producto con userId:", user.id);

      const requestConfig = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataWithUser),
      };

      const response = await fetch(`${API_URL_GATEWAY}/products`, requestConfig);
      const data = await response.json();

  console.log("Respuesta de createProduct:", data);

      if (data.success) {
        toast.success("¡Producto creado exitosamente!");
        await fetchProducts();
        return { success: true, productId: data.productId };
      } else {
        toast.error(data.message || "Error al crear el producto");
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Error de conexión");
      return { success: false, message: "Network error" };
    }
  };

  // SUBIR IMAGEN CON USERID REAL
  const uploadProfileImage = async (imageFile) => {
    try {
      if (!user) {
        toast.error("Debes iniciar sesión para subir imágenes");
        return { success: false, message: "No user logged in" };
      }

      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const response = await fetch(`${API_URL_GATEWAY}/upload/profile-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id, // ID real del usuario logueado
          image: base64Image,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("¡Imagen subida exitosamente!");

        if (data.user) {
          const updatedUser = {
            ...user,
            profileImage: data.user.imagen_perfil,
          };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }

        return { success: true, imageUrl: data.imageUrl };
      } else {
        toast.error(data.message || "Error al subir la imagen");
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error de conexión");
      return { success: false, message: "Network error" };
    }
  };

  // Terminology normalized to products. Use fetchProductsByCategory.

  // LOGIN REAL CON EXPRESS API - CORREGIDO PARA EMAIL
  const loginUser = async (credentials) => {
    try {
      console.log("Intentando login...");
      console.log("Enviando credenciales:", {
        email: credentials.email,
        hasPassword: !!credentials.password,
      });

  const response = await fetch(`${API_URL_AUTH}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo_electronico: credentials.email,
          password: credentials.password,
        }),
      });

      console.log("Response status:", response.status);
      if (!response.ok) {
        if (response.status === 401) {
          console.log("Login fallido: Credenciales incorrectas");
          toast.error("Credenciales incorrectas");
          return { success: false, message: "Credenciales incorrectas" };
        } else {
          console.log("Login fallido: Error del servidor");
          toast.error("Error del servidor");
          return { success: false, message: "Error del servidor" };
        }
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        // Defensive mapping: backend may use different field names for id/role/etc.
    const raw = data.user || {};
    const id = raw.id ?? raw._id ?? raw.usuario_id ?? raw.ID ?? raw.userId ?? raw.ID_USUARIO;
    const name = raw.nombre_usuario ?? raw.NOMBRE_USUARIO ?? raw.username ?? raw.user_name ?? raw.user;
    const fullName = raw.nombre_completo ?? raw.NOMBRE_COMPLETO ?? raw.full_name ?? raw.name;
    const email = raw.correo_electronico ?? raw.email ?? raw.CORREO_USUARIO;
    const profileImage = raw.imagen_perfil ?? raw.IMAGEN_PERFIL ?? raw.imagen ?? raw.profileImage ?? raw.avatar;
    // accept various role field names including uppercase DB column ROL
    const role = raw.rol ?? raw.ROL ?? raw.Rol ?? raw.role ?? (raw.is_admin ? "admin" : undefined) ?? raw.rol_nombre;
    // Determine admin from explicit flags or from the role string
    const isAdmin = raw.is_admin ?? raw.IS_ADMIN ?? raw.isAdmin ?? (typeof role === "string" && role.toLowerCase() === "admin") ?? false;

        const userData = {
          id,
          name,
          fullName,
          email,
          profileImage,
          productosCreados: raw.productos_creados ?? raw.productosCreados ?? 0,
          productosFavoritos: raw.productos_favoritos ?? raw.productosFavoritos ?? 0,
          role,
          isAdmin,
        };

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        console.log("Usuario logueado exitosamente:", userData.id ?? "(sin id)", "isAdmin:", userData.isAdmin);
        toast.success(`¡Bienvenido ${userData.name || "usuario"}!`);
        return { success: true, user: userData };
      } else {
        console.log("Login fallido:", data.message);
        toast.error(data.message || "Error en las credenciales");
        return { success: false, message: data.message };
      }
      } catch (error) {
        console.error("Login error:", error);
      toast.error("Error de conexión con el servidor");
      return { success: false, message: "Error de conexión" };
    }
  };

  // REGISTRO CON MANEJO DE IMAGEN
  const registerUser = async (userData) => {
    try {
      console.log("Intentando registro...");

  const response = await fetch(`${API_URL_AUTH}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_usuario: userData.username,
          correo_electronico: userData.email,
          nombre_completo: userData.name,
          password: userData.password,
          confirmPassword: userData.confirmPassword,
          imagen_perfil: userData.profileImage, // base64 o null
        }),
      });

      const data = await response.json();
      console.log("Register response:", data);

      if (data.success) {
        const raw = data.user || {};
        const id = raw.id ?? raw._id ?? raw.usuario_id ?? raw.ID ?? raw.userId;
        const name = raw.nombre_usuario ?? raw.username ?? raw.user_name ?? raw.user;
        const fullName = raw.nombre_completo ?? raw.full_name ?? raw.name;
        const email = raw.correo_electronico ?? raw.email;
        const profileImage = raw.imagen_perfil ?? raw.imagen ?? raw.profileImage ?? raw.avatar;
        const role = raw.rol ?? raw.role ?? undefined;
        const isAdmin = false;

        const newUser = {
          id,
          name,
          fullName,
          email,
          profileImage,
          productosCreados: 0,
          productosFavoritos: 0,
          role,
          isAdmin,
        };

        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
        console.log("Usuario registrado exitosamente:", newUser.id ?? "(sin id)");

        // Mensaje especial si se subió imagen
        if (data.imageUploaded) {
          toast.success("¡Cuenta creada exitosamente con foto de perfil!");
        } else {
          toast.success("¡Cuenta creada exitosamente!");
        }

        return { success: true, user: newUser };
      } else {
        console.log("Registro fallido:", data.message);
        toast.error(data.message || "Error al crear la cuenta");
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Register error:", error);
      toast.error("Error de conexión");
      return { success: false, message: "Error de conexión" };
    }
  };

  const fetchUserProfile = async () => {
    // Placeholder: kept for compatibility
    return null;
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem("user");
    setFavoriteProducts({});
    toast.success("¡Hasta luego!");
    navigate("/");
  };

  const addToFavorites = (productId) => {
    if (!user) {
      toast.error("Debes iniciar sesión para guardar favoritos");
      return;
    }

    let favData = structuredClone(favoriteProducts);
    favData[productId] = true;
    setFavoriteProducts(favData);
    toast.success("Producto guardado en favoritos");
  };

  const removeFromFavorites = (productId) => {
    let favData = structuredClone(favoriteProducts);
    delete favData[productId];
    setFavoriteProducts(favData);
    toast.success("Producto removido de favoritos");
  };

  const getFavoritesCount = () => {
    return Object.keys(favoriteProducts).length;
  };

  const value = {
    navigate,
    user,
    isAdmin: user?.isAdmin ?? false,
    setUser,
    showUserLogin,
    setShowUserLogin,
    products,
    setProducts,
    combos,
    setCombos,
    fetchCombos,
    loading,
    favoriteProducts,
    setFavoriteProducts,
    searchQuery,
    setSearchQuery,

    // FUNCIONES CON USUARIOS REALES
    fetchProducts,
    fetchProductById,
    fetchProductsByCategory,
  createProduct,
    uploadProfileImage,
    loginUser,
    registerUser,
    logoutUser,
    fetchUserProfile,
    addToFavorites,
    removeFromFavorites,
    getFavoritesCount,
    // Cart functionality
    cart,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    getCartCount,
    getCartTotal,
    API_URL_DIRECT,
    API_URL_GATEWAY,
    API_URL_AUTH,
    isDevelopment,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  return useContext(AppContext);
};
