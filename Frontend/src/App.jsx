import React from "react";
import Navbar from "./components/Navbar";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import { Toaster } from "react-hot-toast";
import Footer from "./components/Footer";
import { useAppContext } from "./context/AppContext";
import Login from "./components/Login";
import AllProducts from "./pages/AllProducts";
import ProductCategory from "./pages/ProductCategory";
import ProductDetails from "./pages/ProductDetails";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import ComboDetails from "./pages/ComboDetails";
import AllCombos from "./pages/AllCombos";
import CreateCombo from "./pages/CreateCombo";
import AdminUpload from "./pages/AdminUpload";
import AdminPanel from "./pages/AdminPanel";

const App = () => {
  const { showUserLogin } = useAppContext();

  return (
    <div>
      <Navbar />
      {showUserLogin ? <Login /> : null}

          <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#333",
                border: "1px solid #0ea5e9",
          },
          success: {
            iconTheme: {
                  primary: "#0ea5e9",
              secondary: "#fff",
            },
          },
        }}
      />

      <div className="px-6 md:px-16 lg:px-24 xl:px-32">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/all-products" element={<AllProducts />} />
          <Route path="/combos" element={<AllCombos />} />
          <Route path="/product-category/:category" element={<ProductCategory />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/cart" element={<Cart />} />
          {/* Removed standalone create/my-products routes — admin panel handles creation/editing */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/combos/:id" element={<ComboDetails />} />
          <Route path="/create-combo" element={<CreateCombo />} />
          <Route path="/admin/upload" element={<AdminUpload />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

export default App;
