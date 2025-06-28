import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Groups({onAddToCart, groups, darkMode}) {
  const navigate = useNavigate();

  const handleBuyNow = (groupId) => {
    navigate("/detailClient", { state: { groupId, quantity: 1 } });
  };


  return (
    <div  className={`projects ${darkMode ? "dark-mode" : ""}`}>
      <div className="container">
        <h2 className="text-center title-div">group products</h2>
        <div className="row">
          {groups.filter(group => group.available).map((group) => (
            <div key={group._id} className="col-lg-3 col-md-6 col-sm-6 col-md-6 col-sm-6 mb-4">
              <div className="card h-100 text-center">
          {group.image && group.image.startsWith("https://") && (
            <img src={group.image}
                  alt={group.name}
                  className="card-img-top"
                  style={{ maxHeight: "200px", objectFit: "cover" }}
            />
          )}
                <div className="card-body">
                  <h5 className="card-title">{group.name}</h5>
                  <p className="card-text">{group.description}</p>
                  <p className="card-text"><strong>السعر:</strong> {group.price} دولار</p>
                  <button onClick={() => onAddToCart(group._id, "groupproduct", group)} className="button-add">Add To Cart</button>
                  <button onClick={() => handleBuyNow(group._id)} className="button-buy">Buy</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default  Groups;