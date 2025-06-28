import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style/Product.css";
import Admin from "./admin";

const ProductsAdmin = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [editProduct, setEditProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    quantity: "",
    image: null,
  });

  // Fetch all products and categories on component mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const deleteProduct = async (id) => {
    try {
      await axios.delete(`https://khmiri-resto.onrender.com/api/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchProducts(); // Refresh the product list
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product: " + (error.response?.data?.error || error.message));
    }
  };

  // Fetch products from the backend
  const fetchProducts = async () => {
    try {
      const response = await axios.get("https://khmiri-resto.onrender.com/api/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("https://khmiri-resto.onrender.com/api/categorys", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle file input change
  const handleFileChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handleEdit = (product) => {
    setEditProduct(product._id);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category._id,
      quantity: product.quantity.toString(),
      image: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();

    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("category", formData.category);
    data.append("quantity", formData.quantity);

    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      if (editProduct) {
        await axios.put(
          `https://khmiri-resto.onrender.com/api/products/${editProduct}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        await axios.post(
          "https://khmiri-resto.onrender.com/api/products",
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        quantity: "",
        image: null,
      });
      setEditProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error submitting product:", error);
      let errorMessage = "An unexpected error occurred";
      
      if (error.response) {
        if (typeof error.response.data === "string") {
          errorMessage = "Server error: Please check your data";
        } else {
          errorMessage = error.response.data?.error || JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert("Error: " + errorMessage);
    }
  };

  return (
    <div className="products-admin">
      <Admin />
      <h1>{editProduct ? "Edit Product" : "Add a New Product"}</h1>
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Description:</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Price:</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label>Category:</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Quantity:</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            required
            min="0"
          />
        </div>
        <div className="form-group">
          <label>Image:</label>
          <input 
            type="file" 
            name="image" 
            onChange={handleFileChange}
            accept="image/*"
          />
        </div>
        <button type="submit" className="submit-btn">
          {editProduct ? "Update Product" : "Add Product"}
        </button>
        {editProduct && (
          <button 
            type="button" 
            className="cancel-btn"
            onClick={() => {
              setEditProduct(null);
              setFormData({
                name: "",
                description: "",
                price: "",
                category: "",
                quantity: "",
                image: null,
              });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <h2>Product List</h2>
      <div className="row">
        {products.filter(product => product.isActive).map((product) => (
          <div key={product._id} className="col-lg-3 col-md-6 col-sm-6 col-md-6 col-sm-6 mb-4">
            <img
              src={product.image}
              alt={product.name}
              className="product-image"
            />
            <div className="product-details">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p>Price: ${product.price}</p>
              <p>Quantity: {product.quantity}</p>
              <div className="product-actions">
                <button 
                  className="edit-btn" 
                  onClick={() => handleEdit(product)}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn" 
                  onClick={() => deleteProduct(product._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
    </div>
    </div>
  );
};

export default ProductsAdmin;
