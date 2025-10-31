import React, { useEffect, useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import { Search, Heart, User, Menu, ChefHat, ShoppingCart } from "lucide-react";
import { useAppContext } from "../context/AppContext.jsx";
import LogoIcon from "./LogoIcon.jsx";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef(null);

  const {
    user,
    setUser,
    setShowUserLogin,
    navigate,
    setSearchQuery,
    searchQuery,
    getFavoritesCount,
    logoutUser,
    getCartCount,
  } = useAppContext();

  const logout = async () => {
    logoutUser();
    setProfileDropdownOpen(false);
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      navigate("/all-products");
    }
  }, [searchQuery]);

  const handleProfileClick = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const handleProfileMenuClick = (action) => {
    setProfileDropdownOpen(false);
    action();
  };

  return (
    <nav className="flex items-center justify-between px-6 md:px-16 lg:px-24 xl:px-32 py-4 border-b border-gray-300 bg-white relative transition-all">
      <NavLink to={"/"} onClick={() => setOpen(false)} className="flex items-center gap-3">
        <LogoIcon className="h-10 w-10 text-sky-500" aria-label="La Cazuela Chapina logo" />
        <div className="flex flex-col leading-tight">
          <span className="text-base font-semibold text-sky-500">La Cazuela</span>
          <span className="text-lg font-bold text-gray-800">Chapina</span>
        </div>
      </NavLink>

      {/* Desktop Menu */}
      <div className="hidden sm:flex items-center gap-8">
        <NavLink to="/" className="hover:text-sky-500 transition-colors">
          Inicio
        </NavLink>
        <NavLink
          to="/combos"
          className="hover:text-sky-500 transition-colors"
        >
          Combos
        </NavLink>
        {/* hide My Products / Create Product links - handled inside AdminPanel or user-specific UI */}

        <div className="hidden lg:flex items-center text-sm gap-2 border border-gray-300 px-3 rounded-full">
          <input
            onChange={(e) => setSearchQuery(e.target.value)}
            className="py-1.5 w-full bg-transparent outline-none placeholder-gray-500"
            type="text"
            placeholder="Buscar productos..."
            value={searchQuery}
          />
          <Search className="w-4 h-4 text-gray-500" />
        </div>

        <div onClick={() => navigate("/favorites")} className="relative cursor-pointer hover:text-sky-500 transition-colors">
          <Heart className="w-6 h-6" />
          {getFavoritesCount() > 0 && (
            <span className="absolute -top-2 -right-3 text-xs text-white bg-sky-500 w-[18px] h-[18px] rounded-full flex items-center justify-center">
              {getFavoritesCount()}
            </span>
          )}
        </div>

        {user && (
          <div onClick={() => navigate("/cart")} className="relative cursor-pointer hover:text-sky-500 transition-colors">
            <ShoppingCart className="w-6 h-6" />
            {getCartCount && getCartCount() > 0 && (
              <span className="absolute -top-2 -right-3 text-xs text-white bg-sky-500 w-[18px] h-[18px] rounded-full flex items-center justify-center">
                {getCartCount()}
              </span>
            )}
          </div>
        )}

        {!user ? (
          <button onClick={() => setShowUserLogin(true)} className="cursor-pointer px-8 py-2 bg-sky-500 hover:bg-sky-600 transition text-white rounded-full">
            Acceder
          </button>
        ) : (
          <div className="relative" ref={profileRef}>
            <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center font-semibold cursor-pointer hover:bg-sky-600 transition-colors" onClick={handleProfileClick}>
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </span>
              )}
            </div>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute top-12 right-0 bg-white shadow-lg border border-gray-200 py-2 w-44 rounded-md text-sm z-50 animate-in slide-in-from-top-2 duration-200">
                {/* Información del usuario */}
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="font-medium text-gray-800 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>

                {/* Opciones del menú */}
                <button onClick={() => handleProfileMenuClick(() => navigate("/profile"))} className="w-full text-left px-3 py-2 hover:bg-sky-50 cursor-pointer flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Mi Perfil
                </button>

                {/* My Products removed from profile menu — managed elsewhere */}
                {user?.isAdmin && (
                  <button onClick={() => handleProfileMenuClick(() => navigate('/admin'))} className="w-full text-left px-3 py-2 hover:bg-sky-50 cursor-pointer flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18"/><path d="M5 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/></svg>
                    Admin Panel
                  </button>
                )}

                <button onClick={() => handleProfileMenuClick(() => navigate("/favorites"))} className="w-full text-left px-3 py-2 hover:bg-sky-50 cursor-pointer flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Favoritos
                </button>

                <hr className="my-1 border-gray-100" />

                <button
                  onClick={() => handleProfileMenuClick(logout)}
                  className="w-full text-left px-3 py-2 hover:bg-red-50 cursor-pointer text-red-600 flex items-center gap-2"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile menu button */}
      <div className="flex items-center gap-6 sm:hidden">
        <div
          onClick={() => navigate("/favorites")}
          className="relative cursor-pointer"
        >
          <Heart className="w-6 h-6" />
          {getFavoritesCount() > 0 && (
            <span className="absolute -top-2 -right-3 text-xs text-white bg-sky-500 w-[18px] h-[18px] rounded-full flex items-center justify-center">
              {getFavoritesCount()}
            </span>
          )}
        </div>
        <button onClick={() => setOpen(!open)} aria-label="Menu">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="absolute top-[60px] left-0 w-full bg-white shadow-md py-4 flex-col items-start gap-2 px-5 text-sm md:hidden z-40">
          <NavLink to="/" onClick={() => setOpen(false)}>
            Inicio
          </NavLink>
          <NavLink to="/combos" onClick={() => setOpen(false)}>
            Combos
          </NavLink>
          {user && (
            <>
              <NavLink to="/profile" onClick={() => setOpen(false)}>
                Mi Perfil
              </NavLink>
              <NavLink to="/favorites" onClick={() => setOpen(false)}>
                Favoritos
              </NavLink>
            </>
          )}

          {!user ? (
            <button
              onClick={() => {
                setOpen(false);
                setShowUserLogin(true);
              }}
              className="cursor-pointer px-6 py-2 mt-2 bg-sky-500 hover:bg-sky-600 transition text-white rounded-full text-sm"
            >
              Acceder
            </button>
          ) : (
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="cursor-pointer px-6 py-2 mt-2 bg-red-500 hover:bg-red-600 transition text-white rounded-full text-sm"
            >
              Cerrar Sesión
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
