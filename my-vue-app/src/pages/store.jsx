import React, { useState, useEffect } from "react";
import Productstore from "../conponment/storeproducts";
import Groupstore from "../conponment/storegrouproducts";
import CartUserSidebarstore from "../conponment/storecartuser";
import Navbar from "../conponment/storenavbar";
import Orderstore from "../conponment/orderstore";
import axios from "axios";
import { useLocation } from "react-router-dom";

function Store() {
  const location = useLocation();
  const { productId, groupId, quantity } = location.state || {};
  const [searchTerm, setSearchTerm] = useState("");
  const [token , setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState({});
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
  const storedToken = localStorage.getItem("token");
  if (storedToken) {
    setToken(storedToken);
  }
  const fetchuser = async () => {
    try {
      const response = await axios.get("https://khmiri-resto.onrender.com/api/users/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      setUser(response.data); // التصحيح هنا
      // إذا أردت التحقق من الدور:
      if (response.data.role === "customer") {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };
  fetchuser();
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
    function generateReceipt(order) {
    let receipt = `رقم الدور: ${order.queueNumber}\n`;
    receipt += `-----------------------------\n`;
    receipt += `المنتجات:\n`;
    if (order.products && order.products.length > 0) {
      order.products.forEach((item) => {
        receipt += `- ${item.product.name} x${item.quantity} = ${item.product.price * item.quantity} دج\n`;
      });
    }
    if (order.productGroups && order.productGroups.length > 0) {
      receipt += `مجموعات المنتجات:\n`;
      order.productGroups.forEach((item) => {
        receipt += `- ${item.group.name} x${item.quantity} = ${item.group.price * item.quantity} دج\n`;
      });
    }
    receipt += `-----------------------------\n`;
    receipt += `الإجمالي: ${order.totalPrice} دج\n`;
    receipt += `طريقة الدفع: ${order.paymentMethod}\n`;
    receipt += `-----------------------------\n`;
    receipt += `شكراً لتسوقكم معنا!\n`;
    return receipt;
  }
    function printOrder(order) {
  const receipt = generateReceipt(order).replace(/\n/g, "<br>");
  const printWindow = window.open("", "_blank", "width=300,height=600");
  printWindow.document.write(`
    <html>
      <head>
        <title>فاتورة الطلب</title>
        <style>
          body {
            font-family: 'Cairo', 'Tahoma', 'monospace', Arial, sans-serif;
            font-size: 15px;
            direction: rtl;
            text-align: right;
            margin: 0;
            padding: 0;
            background: #fff;
          }
          .receipt {
            width: 260px;
            margin: 0 auto;
            padding: 12px 0;
          }
          .receipt-title {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 8px;
            letter-spacing: 1px;
          }
          .receipt hr {
            border: none;
            border-top: 1.5px dashed #888;
            margin: 8px 0;
          }
          .receipt .total {
            font-size: 16px;
            font-weight: bold;
            margin-top: 8px;
            text-align: center;
          }
          .receipt .thanks {
            text-align: center;
            margin-top: 12px;
            font-size: 15px;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-title">فاتورة الطلب</div>
          <hr>
          ${receipt}
          <hr>
          <div class="thanks">نتمنى لكم يوماً سعيداً</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 500);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
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
      <CartUserSidebarstore
        cartProducts={cartProducts}
        setProducts={setCartProducts}
        setGroups={setCartGroups}
        cartGroups={cartGroups}
        onQuantityChange={handleUpdateQuantity}
        onRemove={handleRemoveItem}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        darkMode={darkMode}
      />
      <div className="projectsandservices">
        {cartorderdetails ===true ? (
          <Orderstore onClose={() => setCartOrderDetails(false)}/>
        ) : (
          <>
          <Productstore products={filteredProducts} onAddToCart={onAddToCart} darkMode={darkMode} user={user} printOrder={printOrder}/>
          <Groupstore groups={filteredGroups} onAddToCart={onAddToCart} darkMode={darkMode} user={user} printOrder={printOrder}/>
      </>
        )}
      </div>
    </div>
  );
}

export default Store;
