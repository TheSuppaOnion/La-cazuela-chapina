import React from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { ChefHat } from "lucide-react";
import LogoIcon from './LogoIcon.jsx';

const Login = () => {
  const { setShowUserLogin, loginUser, registerUser } = useAppContext();

  const [state, setState] = React.useState("login");
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [profileImage, setProfileImage] = React.useState(null);
  const [profileImagePreview, setProfileImagePreview] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("Por favor sube una imagen válida (JPG, PNG, GIF, WEBP)");
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error("La imagen es muy grande (máx 5MB)");
        return;
      }

      setProfileImage(file);

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (state === "register") {
        // Validaciones básicas para registro
        if (
          !name.trim() ||
          !username.trim() ||
          !email.trim() ||
          !password.trim()
        ) {
          toast.error("Todos los campos son requeridos");
          return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          toast.error("Por favor ingresa un correo electrónico válido");
          return;
        }

        if (password.length < 6) {
          toast.error("La contraseña debe tener al menos 6 caracteres");
          return;
        }

        // Validar confirmación de contraseña
        if (password !== confirmPassword) {
          toast.error("Las contraseñas no coinciden");
          return;
        }

        console.log("Enviando datos de registro...");

        const result = await registerUser({
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          password: password,
          confirmPassword: confirmPassword,
          profileImage: profileImagePreview || null,
        });

        if (result.success) {
          toast.success("¡Bienvenido a La Cazuela Chapina!");
          setShowUserLogin(false);
          clearForm();
        }
      } else {
        // Login - CORREGIDO: Validar email y password
        if (!email.trim() || !password.trim()) {
          toast.error("Correo electrónico y contraseña son requeridos");
          return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          toast.error("Por favor ingresa un correo electrónico válido");
          return;
        }

        console.log("Enviando datos de login...");

        const result = await loginUser({
          email: email.trim(),
          password: password,
        });

        if (result.success) {
          toast.success("¡Bienvenido de vuelta!");
          setShowUserLogin(false);
          clearForm();
        }
      }
    } catch (error) {
      console.error("Error en onSubmitHandler:", error);
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setProfileImage(null);
    setProfileImagePreview("");
  };

  return (
    <div
      onClick={() => setShowUserLogin(false)}
      className="fixed top-0 bottom-0 left-0 right-0 z-50 flex items-center text-sm text-gray-600 bg-black/50"
    >
      <form
        onSubmit={onSubmitHandler}
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col gap-4 m-auto items-start p-8 py-12 w-80 sm:w-[400px] text-gray-500 rounded-lg shadow-xl border border-gray-200 bg-white max-h-[90vh] overflow-y-auto"
      >
        {/* Header con logo */}
        <div className="flex items-center gap-2 mx-auto mb-4">
          <LogoIcon className="h-10 w-10 text-sky-500" aria-label="La Cazuela Chapina logo" />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold text-sky-500">La Cazuela</span>
            <span className="text-lg font-bold text-gray-800">Chapina</span>
          </div>
        </div>

        <p className="text-xl font-medium mx-auto mb-4">
          {state === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
        </p>

        {state === "register" && (
          <>
            {/* Foto de perfil */}
            <div className="w-full text-center mb-4">
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-gray-100 flex items-center justify-center mb-3">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-sky-500 text-white flex items-center justify-center text-xl font-bold">
                    {name ? (
                      name.charAt(0).toUpperCase()
                    ) : (
                      <ChefHat className="w-8 h-8" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-center">
                <label className="cursor-pointer inline-block px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs">
                  <span>Subir foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {profileImagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileImage(null);
                      setProfileImagePreview("");
                    }}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-xs"
                  >
                    Quitar
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Opcional - JPG, PNG, GIF (máx 5MB)
              </p>
            </div>

            {/* Nombre completo */}
            <div className="w-full">
              <p className="mb-1">Nombre Completo</p>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                placeholder="Tu nombre completo"
                className="border border-gray-200 rounded w-full p-2 mt-1 outline-sky-500"
                type="text"
                required
                disabled={loading}
              />
            </div>

            {/* Username */}
            <div className="w-full">
              <p className="mb-1">Nombre de Usuario</p>
              <input
                onChange={(e) => setUsername(e.target.value)}
                value={username}
                placeholder="tu_usuario_unico"
                className="border border-gray-200 rounded w-full p-2 mt-1 outline-sky-500"
                type="text"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-400 mt-1">
                Sin espacios, será tu identificador único
              </p>
            </div>
          </>
        )}

        {/* Email (tanto para login como registro) */}
        <div className="w-full">
          <p className="mb-1">Correo Electrónico</p>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            placeholder="tu@correo.com"
                className="border border-gray-200 rounded w-full p-2 mt-1 outline-sky-500"
            type="email"
            required
            disabled={loading}
          />
        </div>

        {/* Contraseña */}
        <div className="w-full">
          <p className="mb-1">Contraseña</p>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            placeholder="Mínimo 6 caracteres"
            className="border border-gray-200 rounded w-full p-2 mt-1 outline-orange-500"
            type="password"
            required
            disabled={loading}
            minLength={6}
          />
        </div>

        {/* Confirmar contraseña - Solo en registro */}
        {state === "register" && (
          <div className="w-full">
            <p className="mb-1">Confirmar Contraseña</p>
            <input
              onChange={(e) => setConfirmPassword(e.target.value)}
              value={confirmPassword}
              placeholder="Repite tu contraseña"
              className="border border-gray-200 rounded w-full p-2 mt-1 outline-orange-500"
              type="password"
              required
              disabled={loading}
              minLength={6}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                Las contraseñas no coinciden
              </p>
            )}
          </div>
        )}

        {/* Cambiar entre login/registro */}
        {state === "register" ? (
          <p className="text-sm">
            ¿Ya tienes cuenta?{" "}
            <span
              onClick={() => {
                setState("login");
                clearForm();
              }}
              className="text-sky-500 cursor-pointer hover:underline"
            >
              Iniciar sesión
            </span>
          </p>
        ) : (
          <p className="text-sm">
            ¿Nuevo en La Cazuela Chapina?{" "}
            <span
              onClick={() => {
                setState("register");
                clearForm();
              }}
              className="text-sky-500 cursor-pointer hover:underline"
            >
              Crear cuenta
            </span>
          </p>
        )}

        <button
          type="submit"
          disabled={
            loading || (state === "register" && password !== confirmPassword)
          }
          className="bg-sky-500 hover:bg-sky-600 transition-all text-white w-full py-2.5 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Procesando..."
            : state === "register"
            ? "Crear Cuenta"
            : "Iniciar Sesión"}
        </button>

        {/* Credenciales de prueba con email */}
        {state === "login" && (
          <div className="w-full mt-2 p-3 bg-sky-50 rounded text-xs">
            <p className="font-medium text-sky-800 mb-1">Prueba con:</p>
            <p className="text-sky-700">Email: admin@lacazuelachapina.com</p>
            <p className="text-sky-700">Contraseña: admin123</p>
            <p className="text-sky-600 mt-1 text-xs">
              O crea una cuenta nueva para empezar
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default Login;
