import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/detailClient.css";

function DetailClient() {
      const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("darkMode") === "enabled";
      });
  const [formdata, setFormdata] = useState({
    idorder: "",
    firstname: "",
    lastname: "",
    city: "",
    address: "",
    postcode: "",
    phone: "",
    email: "",
    paymentMethod: "cash",
  });

  const [user, setUser] = useState(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { productId, groupId, quantity } = location.state || {};

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const fetchUser = async () => {
        try {
          const response = await axios.get("http://localhost:3000/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data);
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsUserLoaded(true);
        }
      };
      fetchUser();
    } else {
      setIsUserLoaded(true); // Even for guest, mark as loaded
    }
  }, []);

  const handlePostCart = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    try {
      let orderData = {
        customer: token && user?._id ? user._id : "Guest",
        products: [],
        productGroups: [],
        paymentMethod: formdata.paymentMethod,
      };

      if (productId) {
        orderData.products.push({ product: productId, quantity });
      }

      if (groupId) {
        orderData.productGroups.push({ group: groupId, quantity });
      }

      if (!productId && !groupId) {
        const storedCart = JSON.parse(localStorage.getItem("guestCart")) || {
          products: [],
          groupproducts: [],
        };

        orderData.products = storedCart.products.map((p) => ({
          product: p.product,
          quantity: p.quantity,
        }));

        orderData.productGroups = storedCart.groupproducts.map((g) => ({
          group: g.group,
          quantity: g.quantity,
        }));
      }

      const responseOrder = await axios.post("http://localhost:3000/api/orders", orderData, {
        headers: { "Content-Type": "application/json" },
      });

      const orderId = responseOrder.data._id;

      const updatedFormData = { ...formdata, idorder: orderId };
      setFormdata(updatedFormData);

      await axios.post("http://localhost:3000/api/details", updatedFormData, {
        headers: { "Content-Type": "application/json" },
      });

      localStorage.removeItem("guestCart");
      navigate("/");
    } catch (err) {
      console.error("Error creating order:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormdata({ ...formdata, [name]: value });
  };

  // Show nothing until user is loaded
  if (!isUserLoaded) return <p>جاري التحميل...</p>;

  return (
    <div className={`detail-client ${darkMode ? "dark-mode" : ""}`}>
      <form onSubmit={handlePostCart}>
        <div><label>First Name:</label>
          <input type="text" name="firstname" value={formdata.firstname} onChange={handleInputChange} required />
        </div>
        <div><label>Last Name:</label>
          <input type="text" name="lastname" value={formdata.lastname} onChange={handleInputChange} required />
        </div>
        <div><label>City:</label>
          <input type="text" name="city" value={formdata.city} onChange={handleInputChange} required />
        </div>
        <div><label>Address:</label>
          <input type="text" name="address" value={formdata.address} onChange={handleInputChange} required />
        </div>
        <div><label>Post Code:</label>
          <input type="text" name="postcode" value={formdata.postcode} onChange={handleInputChange} required />
        </div>
        <div><label>Phone:</label>
          <input type="text" name="phone" value={formdata.phone} onChange={handleInputChange} required />
        </div>
        <div><label>Email:</label>
          <input type="email" name="email" value={formdata.email} onChange={handleInputChange} required />
        </div>
        <div><label>Payment Method:</label>
          <select name="paymentMethod" value={formdata.paymentMethod} onChange={handleInputChange}>
            <option value="cash">Cash</option>
            <option value="credit card">Credit Card</option>
            <option value="paypal">PayPal</option>
          </select>
        </div>
        <button
          type="submit"
          style={{
            marginTop: "10px",
            padding: "10px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Confirm Order
        </button>
      </form>
    </div>
  );
}

export default DetailClient;
