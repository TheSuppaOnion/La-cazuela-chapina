import React, { useState } from "react";
import {
  Camera,
  Save,
  X,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Upload,
  Trash2,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const EditProfile = ({ onClose, user }) => {
  const { updateProfile, uploadProfileImage } = useAppContext();

  const [formData, setFormData] = useState({
    name: user.fullName || user.name || "",
    username: user.name || "",
    email: user.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileImage, setProfileImage] = useState(user.profileImage || "");
  const [newImageFile, setNewImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(user.profileImage || "");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

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

    setNewImageFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setNewImageFile(null);
    setImagePreview("");
    setProfileImage("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return false;
    }

    if (!formData.username.trim()) {
      toast.error("El nombre de usuario es requerido");
      return false;
    }

    if (!formData.email.trim()) {
      toast.error("El email es requerido");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Email inválido");
      return false;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return false;
    }

    return true;
  };

  const hasChanges = () => {
    return (
      formData.name !== (user.fullName || user.name) ||
      formData.username !== user.name ||
      formData.email !== user.email ||
      formData.newPassword ||
      newImageFile ||
      imagePreview !== user.profileImage
    );
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    if (!hasChanges()) {
      toast.error("No hay cambios para guardar");
      return;
    }

    if (!formData.currentPassword.trim()) {
      toast.error(
        "Por favor ingresa tu contraseña actual para confirmar los cambios"
      );
      return;
    }

    setLoading(true);

    try {
      let finalImageUrl = profileImage;

      // Subir nueva imagen si hay una
      if (newImageFile) {
        toast.loading("Subiendo imagen...");
        const uploadResult = await uploadProfileImage(newImageFile);
        toast.dismiss();

        if (!uploadResult.success) {
          toast.error(uploadResult.message || "Error subiendo imagen");
          return;
        }
        finalImageUrl = uploadResult.imageUrl;
      }

      // Actualizar perfil
      const updateData = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        newPassword: formData.newPassword || undefined,
        profileImage: finalImageUrl,
      };

      const result = await updateProfile(updateData, formData.currentPassword);

      if (result.success) {
        toast.success("Perfil actualizado correctamente");
        onClose();
      }
    } catch (error) {
      toast.error("Error inesperado al actualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
  {/* Header */}
  <div className="bg-gradient-to-r from-sky-500 to-sky-700 text-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Editar Perfil</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("profile")}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition ${
                activeTab === "profile"
                  ? "border-b-2 border-sky-500 text-sky-600 bg-sky-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Información
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition ${
                activeTab === "security"
                  ? "border-b-2 border-sky-500 text-sky-600 bg-sky-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              Seguridad
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Foto de perfil */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-white shadow-lg">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-sky-400 to-sky-600 text-white flex items-center justify-center text-2xl font-bold">
                        {formData.name
                          ? formData.name.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-sky-500 rounded-full p-2 shadow-lg">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="mt-4 flex gap-2 justify-center">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-lg transition text-sm font-medium">
                    <Upload className="w-4 h-4" />
                    Subir foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {(imagePreview || newImageFile) && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Quitar
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG, GIF, WEBP (máx 5MB)
                </p>
              </div>

              {/* Campos del perfil */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Tu nombre completo"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange("username", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="tu_usuario"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tu identificador único en la plataforma
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="tu@email.com"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Contraseña Actual *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) =>
                      handleInputChange("currentPassword", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Tu contraseña actual"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-sky-600 mt-1">
                  Requerida para confirmar cualquier cambio
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Nueva Contraseña (opcional)
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) =>
                    handleInputChange("newPassword", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Nueva contraseña (mín 6 caracteres)"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Confirma tu nueva contraseña"
                  disabled={loading}
                />
                {formData.newPassword &&
                  formData.confirmPassword &&
                  formData.newPassword !== formData.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      Las contraseñas no coinciden
                    </p>
                  )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Consejos de seguridad
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Usa una contraseña de al menos 6 caracteres</li>
                  <li>• Combina letras, números y símbolos</li>
                  <li>• No uses información personal</li>
                  <li>• Mantén tu contraseña segura</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading || !hasChanges()}
              className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-sky-700 hover:from-sky-600 hover:to-sky-800 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition disabled:opacity-50 font-medium"
            >
              Cancelar
            </button>
          </div>
          {hasChanges() && (
            <p className="text-xs text-sky-600 mt-2 text-center">
              Tienes cambios sin guardar
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
