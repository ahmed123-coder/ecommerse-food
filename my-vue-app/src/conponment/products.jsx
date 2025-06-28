import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/products.css"; // Assuming you have a CSS file for styling

function Products({onAddToCart, products , darkMode}) {
  const navigate = useNavigate();  

  const handleBuyNow = (productId) => {
    navigate("/detailClient", { state: { productId, quantity: 1 } });
  };


  return (
    <div className={`projects ${darkMode ? "dark-mode" : ""}`}>
      <div className="container">
        <h2 className="text-center title-div">products</h2>
        <div className="row">
          {products.filter(product => product.isActive).map((product) => (
            <div key={product._id} className="col-lg-3 col-md-6 col-sm-6 col-md-6 col-sm-6 mb-4">
              <div className="card h-100 text-center">
             {product.image && product.image.startsWith("https://") && (
            <img src={product.image}
                  alt={product.name}
                  className="card-img-top"
                  style={{ maxHeight: "200px", objectFit: "cover" }}/>
           )}
                <div className="card-body">
                  <h5 className="card-title">{product.name}</h5>
                  <p className="card-text">{product.description}</p>
                  <p className="card-text"><strong>السعر:</strong> {product.price} دولار</p>
                  <button onClick={() => onAddToCart(product._id, "product", product)} className="button-add">Add To Cart</button>
                  <button onClick={() => handleBuyNow(product._id)} className="button-buy">Buy</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Products;
