import React, { useState, useEffect } from "react";
import Products from "../conponment/products";
import Groups from "../conponment/groupproducts";
import CartUserSidebar from "../conponment/cartuser";
import Footer from "../conponment/footer";
import Navbar from "../conponment/navbare";
import DetailsOrder from "../conponment/detailsorder";
import axios from "axios";

function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [token , setToken] = useState(localStorage.getItem("token") || "");
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [cartProducts, setCartProducts] = useState([]);
  const [cartGroups, setCartGroups] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartorderdetails, setCartOrderDetails] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "enabled";
  });
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm));
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchTerm));

  useEffect(() => {
    axios.get("https://khmiri-resto.onrender.com/api/products").then((res) => {
      setProducts(res.data);
    });

    axios.get("https://khmiri-resto.onrender.com/api/groupproducts").then((res) => {
      setGroups(res.data);
    });
    const storedCart = JSON.parse(localStorage.getItem("guestCart")) || {
      products: [],
      groupproducts: [],
    };
    
    setCartProducts(storedCart.products || []);
    setCartGroups(storedCart.groupproducts || []);
  }, []);
  const handleSearch = (term) => {
  setSearchTerm(term.toLowerCase());
};
  const updateLocalStorage = (products, groups) => {
    localStorage.setItem(
      "guestCart",
      JSON.stringify({ products, groupproducts: groups })
    );
  };

  const onAddToCart = (id, type, details) => {
    if (type === "product") {
      const exists = cartProducts.find((item) => item.product === id);
      let updated = exists
        ? cartProducts.map((item) =>
            item.product === id
              ? { ...item, quantity: item.quantity + 1, image: details.image, name: details.name , price: details.price }
              : item
          )
        : [...cartProducts, { product: id, quantity: 1 , image: details.image, name: details.name , price: details.price }];

      setCartProducts(updated);
      updateLocalStorage(updated, cartGroups);
    } else {
      const exists = cartGroups.find((item) => item.group === id);
      let updated = exists
        ? cartGroups.map((item) =>
            item.group === id
              ? { ...item, quantity: item.quantity + 1, image: details.image, name: details.name , price: details.price }
              : item
          )
        : [...cartGroups, { group: id, quantity: 1 , image: details.image , name: details.name , price: details.price }];
      setCartGroups(updated);
      updateLocalStorage(cartProducts, updated);
    }
    console.log("cartproducts", cartProducts);
    console.log("cartgroups", cartGroups);
  };

  const handleUpdateQuantity = (id, type, newQty) => {
    if (type === "product") {
      const updated = cartProducts.map((item) =>
        item.product === id ? { ...item, quantity: newQty } : item
      );
      setCartProducts(updated);
      updateLocalStorage(updated, cartGroups);
    } else {
      const updated = cartGroups.map((item) =>
        item.group === id ? { ...item, quantity: newQty } : item
      );
      setCartGroups(updated);
      updateLocalStorage(cartProducts, updated);
    }
  };

  const handleRemoveItem = (id, type) => {
    if (type === "product") {
      const updated = cartProducts.filter((item) => item.product !== id);
      setCartProducts(updated);
      updateLocalStorage(updated, cartGroups);
    } else {
      const updated = cartGroups.filter((item) => item.group !== id);
      setCartGroups(updated);
      updateLocalStorage(cartProducts, updated);
    }
  };

  return (
    <div className="homepage">
            <Navbar 
        token={token}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        setcartorderdetails={setCartOrderDetails}
        iscartorderdetails={cartorderdetails}
        onSearchChange={handleSearch}
      />
      <CartUserSidebar
        cartProducts={cartProducts}
        cartGroups={cartGroups}
        onQuantityChange={handleUpdateQuantity}
        onRemove={handleRemoveItem}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        darkMode={darkMode}
      />
      <div className="projectsandservices">
        {cartorderdetails ===true ? (
          <DetailsOrder
            onClose={() => setCartOrderDetails(false)}
          />
        ) : (
          <>
          <Products products={filteredProducts} onAddToCart={onAddToCart} darkMode={darkMode}/>
          <Groups groups={filteredGroups} onAddToCart={onAddToCart} darkMode={darkMode}/>
      </>
        )}
      <Footer darkMode={darkMode} />
      </div>
    </div>
  );
}

export default HomePage;
