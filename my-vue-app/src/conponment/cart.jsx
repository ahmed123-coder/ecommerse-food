import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Cart.css";

const Cart = ({ isOpen, onClose, cartItems, darkMode }) => {
  const [itemsDetails, setItemsDetails] = useState({ products: [], groups: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchItemsDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // فلترة العناصر الصالحة فقط
      const validProducts = cartItems.products.filter(item => item.productId?.trim());
      const validGroups = cartItems.groupProducts.filter(item => item.groupId?.trim());

      const productPromises = validProducts.map(item =>
        axios.get(`https://khmiri-resto.onrender.com/api/products/${item.productId}`)
      );
      
      const groupPromises = validGroups.map(item =>
        axios.get(`https://khmiri-resto.onrender.com/api/groupproducts/${item.groupId}`)
      );

      const [productsRes, groupsRes] = await Promise.all([
        Promise.all(productPromises),
        Promise.all(groupPromises)
      ]);

      setItemsDetails({
        products: productsRes.map((res, index) => ({
          ...res.data,
          quantity: validProducts[index].quantity
        })),
        groups: groupsRes.map((res, index) => ({
          ...res.data,
          quantity: validGroups[index].quantity
        }))
      });
      
    } catch (err) {
      console.error("Error fetching details:", err);
      setError("تعذر تحميل التفاصيل - تأكد من اتصال الإنترنت");
    } finally {
      setIsLoading(false);
    }
  }, [cartItems]);

  useEffect(() => {
    if (isOpen) fetchItemsDetails();
  }, [isOpen, fetchItemsDetails]);

  const updateQuantity = async (id, type, newQuantity) => {
    try {
      const token = localStorage.getItem("token");
      const isProduct = type === "products";

      if (token) {
        await axios.put(
          `https://khmiri-resto.onrender.com/api/users/updateCart/${id}`,
          { type, quantity: newQuantity },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const guestCart = JSON.parse(
          localStorage.getItem("guestCart") || '{"products":[],"groupProducts":[]}'
        );

        const targetArray = isProduct ? guestCart.products : guestCart.groupProducts;
        const itemIndex = targetArray.findIndex(item => 
          item[`${isProduct ? "product" : "group"}Id`] === id
        );

        if (itemIndex > -1) {
          targetArray[itemIndex].quantity = newQuantity;
          localStorage.setItem("guestCart", JSON.stringify(guestCart));
        }
      }
      
      fetchItemsDetails();
    } catch (err) {
      setError("فشل تحديث الكمية - حاول مرة أخرى");
    }
  };

  const removeItem = async (id, type) => {
    try {
      const token = localStorage.getItem("token");
      const isProduct = type === "products";

      if (token) {
        await axios.delete(
          `https://khmiri-resto.onrender.com/api/users/cart/${type}/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const guestCart = JSON.parse(
          localStorage.getItem("guestCart") || '{"products":[],"groupProducts":[]}'
        );

        guestCart[type] = guestCart[type].filter(item => 
          item[`${isProduct ? "product" : "group"}Id`] !== id
        );

        localStorage.setItem("guestCart", JSON.stringify(guestCart));
      }
      
      fetchItemsDetails();
    } catch (err) {
      setError("فشل حذف العنصر - حاول مرة أخرى");
    }
  };

  const calculateTotal = () => {
    return (
      itemsDetails.products.reduce((sum, item) => sum + (item.price * item.quantity), 0) +
      itemsDetails.groups.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    ).toFixed(2);
  };

  if (!isOpen) return null;

  return (
    <div className={`cart-overlay ${darkMode ? "dark-mode" : ""}`}>
      <div className={`cart-container ${darkMode ? "dark-content" : ""}`}>
        <div className="cart-header">
          <h2>🛒 سلة المشتريات</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>جاري تحميل المحتويات...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            ⚠️ {error}
            <button className="retry-btn" onClick={fetchItemsDetails}>
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {itemsDetails.products.map((item) => (
                <div key={item._id} className="cart-item">
                  <img
                    src={`https://khmiri-resto.onrender.com/${item.image}`}
                    alt={item.name}
                    className="item-image"
                  />
                  <div className="item-info">
                    <h3>{item.name}</h3>
                    <p>السعر: {item.price} دولار</p>
                    <div className="quantity-controls">
                      <button
                        onClick={() => updateQuantity(item._id, "products", item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item._id, "products", item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => removeItem(item._id, "products")}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}

              {itemsDetails.groups.map((item) => (
                <div key={item._id} className="cart-item">
                  <img
                    src={`https://khmiri-resto.onrender.com/${item.image}`}
                    alt={item.name}
                    className="item-image"
                  />
                  <div className="item-info">
                    <h3>{item.name}</h3>
                    <p>السعر: {item.price} دولار</p>
                    <div className="quantity-controls">
                      <button
                        onClick={() => updateQuantity(item._id, "groupProducts", item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item._id, "groupProducts", item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => removeItem(item._id, "groupProducts")}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h3>المجموع الكلي: {calculateTotal()} دولار</h3>
              <button 
                className="checkout-btn"
                onClick={() => navigate("/checkout")}
              >
                إتمام الشراء
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(Cart);

    <div className={`app-container ${darkMode ? "dark-mode" : ""}`}>
      <Navbar 
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
      
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        darkMode={darkMode}
      />

      <main className="content-container">
        <Products 
          products={products} 
          onAddToCart={handleAddToCart} 
          darkMode={darkMode}
        />
        <Groups 
          groups={groups} 
          onAddToCart={handleAddToCart} 
          darkMode={darkMode}
        />
      </main>

      <Footer darkMode={darkMode} />
    </div>
