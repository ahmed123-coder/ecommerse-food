import { useEffect, useState } from "react";
import axios from "axios";
import "../style/Ordere.css";
import Admin from "./admin";

const OrdersAdminPage = () => {
  const [details, setDetails] = useState();
  const [status, setStatus] = useState(null);
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

  const [dataorder, setDataorder] = useState({
    customer: "",
    products: [],
    productGroups: [],
    paymentMethod: "cash",
    status: "pending",
  });

  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productGroups, setProductGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token] = useState(localStorage.getItem("token"));
  const [editorder, setEditorder] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchUsers();
    fetchProducts();
    fetchProductGroups();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get("https://khmiri-resto.onrender.com/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("https://khmiri-resto.onrender.com/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get("https://khmiri-resto.onrender.com/api/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchProductGroups = async () => {
    try {
      const response = await axios.get("https://khmiri-resto.onrender.com/api/groupproducts");
      setProductGroups(response.data);
    } catch (error) {
      console.error("Error fetching product groups:", error);
    }
  };

  const updateorder = async (id) => {
    try {
      await axios.put(`https://khmiri-resto.onrender.com/api/orders/${id}`, dataorder, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrders();
    } catch (err) {
      alert("Error updating order");
    }
  };

  const updateStatus = async (id) => {
    try {
      await axios.put(`https://khmiri-resto.onrender.com/api/orders/${id}/delivered`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrders();
    } catch (err) {
      alert("Error updating status");
    }
  };
  const updateStatuscanceled = async (id) => {
    try {
      await axios.put(`https://khmiri-resto.onrender.com/api/orders/${id}/canceled`);
      fetchOrders();
    } catch (error) {
      alert("Error updating status");
    }
  };
  const updateStatuspending = async (id) => {
    try{
      await axios.put(`https://khmiri-resto.onrender.com/api/orders/${id}/pending`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrders();
    }catch(err){
      alert("Error updating status");
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      await axios.delete(`https://khmiri-resto.onrender.com/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await axios.delete(`https://khmiri-resto.onrender.com/api/details/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrders();
    } catch (err) {
      alert("Error deleting order");
    }
  };
  const editedorder = async (order) => {
    setEditorder(order._id);
    setDataorder({
      customer: order.customer?._id || "",
      products: order.products.map((p) => ({ product: p.product._id, quantity: p.quantity })),
      productGroups: order.productGroups.map((pg) => ({ group: pg.group._id, quantity: pg.quantity })),
      paymentMethod: order.paymentMethod,
    });
    const response = await axios.get(`https://khmiri-resto.onrender.com/api/orders/${order._id}/detailclient`);
    setFormdata({
      idorder: order._id,
      firstname: response.data.firstname,
      lastname: response.data.lastname,
      city: response.data.city,
      address: response.data.address,
      postcode: response.data.postcode,
      phone: response.data.phone,
      email: response.data.email,
      paymentMethod: response.data.paymentMethod,
    });
    console.log("order", order);
    console.log("formdata", response.data);
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...dataorder.products];
    updatedProducts[index][field] = value;
    setDataorder({ ...dataorder, products: updatedProducts });
  };

  const handleGroupChange = (index, field, value) => {
    const updatedProductGroups = [...dataorder.productGroups];
    updatedProductGroups[index][field] = value;
    setDataorder({ ...dataorder, productGroups: updatedProductGroups });
  };

  const removeProduct = (index) => {
    setDataorder({ ...dataorder, products: dataorder.products.filter((_, i) => i !== index) });
  };

  const removeGroup = (index) => {
    setDataorder({ ...dataorder, productGroups: dataorder.productGroups.filter((_, i) => i !== index) });
  };

  const addProduct = () => {
    setDataorder({ ...dataorder, products: [...dataorder.products, { product: "", quantity: 1 }] });
  };

  const addGroup = () => {
    setDataorder({ ...dataorder, productGroups: [...dataorder.productGroups, { group: "", quantity: 1 }] });
  };

  const handleInputChangeorder = (e) => {
    const { name, value } = e.target;
    setDataorder({ ...dataorder, [name]: value });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormdata({ ...formdata, [name]: value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editorder) {
        await updateorder(editorder);
      } else {
        const responseOrder = await axios.post("https://khmiri-resto.onrender.com/api/orders", dataorder, {
          headers: { "Content-Type": "application/json" },
        });
        const orderid = responseOrder.data._id;
        if (!orderid) {
          alert("Error retrieving DetailsClient ID.");
          setLoading(false);
          return;
        }
        setFormdata({ ...formdata, idorder: orderid });
        await axios.post("https://khmiri-resto.onrender.com/api/details", formdata, {
          headers: { "Content-Type": "application/json" },
        });
      }

      setDataorder({ customer: "", products: [], productGroups: [], paymentMethod: "cash", status: "pending" });
      setFormdata({
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
      setEditorder(null);
      fetchOrders();
    } catch (err) {
      console.error("Error saving order:", err);
      alert("Error saving order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Admin />
      <h1 className="text-2xl font-bold mb-4 text-center md:text-left">Orders Management</h1>

<form onSubmit={handleSubmit} className="form space-y-4 bg-white p-6 rounded-lg shadow-md">
  {/* Form fields for client details */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="input-group">
      <label className="block text-sm font-medium text-gray-700">First Name:</label>
      <input
        type="text"
        name="firstname"
        value={formdata.firstname}
        onChange={handleInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        required
      />
    </div>
    <div className="input-group">
      <label className="block text-sm font-medium text-gray-700">Last Name:</label>
      <input
        type="text"
        name="lastname"
        value={formdata.lastname}
        onChange={handleInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        required
      />
    </div>
    <div className="input-group">
      <label className="block text-sm font-medium text-gray-700">City:</label>
      <input
        type="text"
        name="city"
        value={formdata.city}
        onChange={handleInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        required
      />
    </div>
    <div className="input-group">
      <label className="block text-sm font-medium text-gray-700">Address:</label>
      <input
        type="text"
        name="address"
        value={formdata.address}
        onChange={handleInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        required
      />
    </div>
    <div className="input-group">
      <label className="block text-sm font-medium text-gray-700">Post Code:</label>
      <input
        type="text"
        name="postcode"
        value={formdata.postcode}
        onChange={handleInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        required
      />
    </div>
    <div className="input-group">
      <label className="block text-sm font-medium text-gray-700">Phone:</label>
      <input
        type="text"
        name="phone"
        value={formdata.phone}
        onChange={handleInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        required
      />
    </div>
    <div className="input-group">
      <label className="block text-sm font-medium text-gray-700">Email:</label>
      <input
        type="email"
        name="email"
        value={formdata.email}
        onChange={handleInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        required
      />
    </div>
    <div className="input-group">
      <label className="block text-sm font-medium text-gray-700">Payment Method:</label>
      <select
        name="paymentMethod"
        value={formdata.paymentMethod}
        onChange={handleInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        required
      >
        <option value="cash">Cash</option>
        <option value="credit card">Credit Card</option>
        <option value="paypal">PayPal</option>
      </select>
    </div>
  </div>

  {/* Customer selection */}
  <div className="input-group">
    <label className="block text-sm font-medium text-gray-700">Customer:</label>
    <select
      name="customer"
      value={dataorder.customer}
      onChange={handleInputChangeorder}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
    >
      <option value="">Select a customer</option>
      {users.map((user) => (
        <option key={user._id} value={user._id}>
          {user.firstName} {user.lastName}
        </option>
      ))}
      <option value="Guest">
        Guest
      </option>
    </select>
  </div>

  {/* Products section */}
  <div className="input-group">
    <h3 className="text-lg font-medium text-gray-700">Products</h3>
    {dataorder.products.map((item, index) => (
      <div key={index} className="flex items-center space-x-2 mt-2">
        <select
          value={item.product}
          onChange={(e) => handleProductChange(index, "product", e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">Select a product</option>
          {products.map((product) => (
            <option key={product._id} value={product._id}>
              {product.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={item.quantity}
          onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
          className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
        <button
          type="button"
          onClick={() => removeProduct(index)}
          className="bg-red-500 text-white px-2 py-1 rounded"
        >
          Remove
        </button>
      </div>
    ))}
    <button
      type="button"
      onClick={addProduct}
      className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
    >
      Add Product
    </button>
  </div>

  {/* Product Groups section */}
  <div className="input-group">
    <h3 className="text-lg font-medium text-gray-700">Product Groups</h3>
    {dataorder.productGroups.map((item, index) => (
      <div key={index} className="flex items-center space-x-2 mt-2">
        <select
          value={item.group}
          onChange={(e) => handleGroupChange(index, "group", e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">Select a product group</option>
          {productGroups.map((group) => (
            <option key={group._id} value={group._id}>
              {group.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={item.quantity}
          onChange={(e) => handleGroupChange(index, "quantity", e.target.value)}
          className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
        <button
          type="button"
          onClick={() => removeGroup(index)}
          className="bg-red-500 text-white px-2 py-1 rounded"
        >
          Remove
        </button>
      </div>
    ))}
    <button
      type="button"
      onClick={addGroup}
      className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
    >
      Add Product Group
    </button>
  </div>

  {/* Submit Button */}
  <button className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={() => setFormdata({})}>
    cancell
  </button>
  <button
    type="submit"
    className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
  >
    {loading ? "Loading..." : "Submit"}
  </button>
</form>
<div className="details mt-6">
  <h2 className="text-xl font-bold mb-4">Order Details</h2>
  {details && (
    <div className="bg-white p-4 rounded shadow-md">
      <button onClick={() => setDetails(null)} className="text-red-500 mb-4">x</button>
      {orders.map((order) => (
        order._id === details._id ? (
          <div key={order._id}>
            <p><strong>Products:</strong></p>
            <ul>
              {order.products.map((product) => (
                <li key={product.product._id}>
                  {product.product.name} - Quantity: {product.quantity}
                  <br />
                  Price: {product.product.price} - Total: {product.product.price * product.quantity}
                  <br />
                  <img src={product.product.image} alt={product.product.name} className="w-20 h-20" />
                </li>
              ))}
                            
            </ul>
            <p><strong>Product Groups:</strong></p>
            <ul>
              {order.productGroups.map((group) => (
                <li key={group.group._id}>
                  {group.group.name} - Quantity: {group.quantity}
                  <br />
                  Price: {group.group.price} - Total: {group.group.price * group.quantity}
                  <br />
                  <img src={group.group.image} alt={group.group.name} className="w-20 h-20" />
                </li>
              ))}
            </ul>
          </div>
        ) : null
      ))}
    </div>
  )}

</div>
      <div>
        <h2 className="text-xl mt-6 container width align-center mt-5">Orders List</h2>
        {loading ? (
          <p>Loading orders...</p>
        ) : (
          <div className="container p-6 bg-gray-100 min-h-screen">

  {/* Filter Buttons */}
  <div className="filter-buttons">
    <button onClick={() => setStatus("cancelled")} className="canceled">
      Canceled
    </button>
    <button onClick={() => setStatus("delivered")} className="completed">
      Completed
    </button>
    <button onClick={() => setStatus("pending")} className="pending">
      Pending
    </button>
    <button onClick={() => setStatus(null)} className="all">
      All
    </button>
  </div>

  {/* Table Container */}
  <div className="table-container">
    <table className="table">
      <thead>
        <tr>
          <th>Customer</th>
          <th>Paymeny methode</th>
          <th>Total Price</th>
          <th>Status</th>
          <th>To Status</th>
        </tr>
      </thead>
      <tbody>
        {orders
          .filter((order) => status === null || order.status === status)
          .map((order) => (
            <tr key={order._id}>
              <td>{order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : "N/A"}</td>
              <td>{order.paymentMethod}</td>
              <td>{order.totalPrice}</td>
              <td>
                <button className="status">{order.status}</button>
              </td>
              <td className="table-actions">
                {order.status !== "delivered" && (
                  <button onClick={() => updateStatus(order._id)} className="status">
                    Mark Delivered
                  </button>
                )}
                {order.status !== "cancelled" && (
                  <button onClick={() => updateStatuscanceled(order._id)} className="status">
                    Canceled
                  </button>
                )}
                {order.status !== "pending" && (
                  <button onClick={() => updateStatuspending(order._id)} className="status">
                    Pending
                  </button>
                )}
                <button onClick={() => deleteOrder(order._id)} className="delete">
                  Delete
                </button>
                <button onClick={() => editedorder(order)} className="edit">
                  Edit
                </button>
                <button className="edit" onClick={() => setDetails(order)}>
                  Details
                </button>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
</div>
        )}
      </div>
    </div>
  );
};

export default OrdersAdminPage;
