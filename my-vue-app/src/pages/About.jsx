import React, { useEffect, useState } from "react";
import "../styles/about.css";

const About = () => {
   const [darkMode, setDarkMode] = useState(() => {
      return localStorage.getItem("darkMode") === "enabled";
    });
  return (
    <div className={`about-page ${darkMode ? "dark-mode" : ""}`}>
      {/* Page Header */}
      <div className="about-header">
        <h1>About Us</h1>
        <p>Learn more about our company, mission, and values.</p>
      </div>

      {/* About Content */}
      <div className="about-content">
        {/* Company Overview */}
        <div className="about-section">
          <h2>Our Story</h2>
          <p>
            Founded in 2025, My E-Commerce is dedicated to providing high-quality products and exceptional customer service. We believe in making online shopping easy, secure, and enjoyable for everyone.
          </p>
        </div>

        {/* Mission Section */}
        <div className="about-section">
          <h2>Our Mission</h2>
          <p>
            Our mission is to deliver the best shopping experience by offering a wide range of products, fast delivery, and excellent customer support. We strive to build long-lasting relationships with our customers.
          </p>
        </div>

        {/* Values Section */}
        <div className="about-section">
          <h2>Our Values</h2>
          <ul>
            <li><i className="bi bi-check-circle"></i> Customer Satisfaction</li>
            <li><i className="bi bi-check-circle"></i> Quality Products</li>
            <li><i className="bi bi-check-circle"></i> Transparency</li>
            <li><i className="bi bi-check-circle"></i> Innovation</li>
            <li><i className="bi bi-check-circle"></i> Sustainability</li>
          </ul>
        </div>

        {/* Team Section */}
        <div className="about-section">
          <h2>Our Team</h2>
          <div className="team-grid">
            {/* Team Member 1 */}
            <div className="team-member">
              <img src="https://via.placeholder.com/150" alt="Team Member 1" />
              <h3>John Doe</h3>
              <p>CEO & Founder</p>
            </div>

            {/* Team Member 2 */}
            <div className="team-member">
              <img src="https://via.placeholder.com/150" alt="Team Member 2" />
              <h3>Jane Smith</h3>
              <p>Marketing Director</p>
            </div>

            {/* Team Member 3 */}
            <div className="team-member">
              <img src="https://via.placeholder.com/150" alt="Team Member 3" />
              <h3>Mike Johnson</h3>
              <p>Head of Operations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;