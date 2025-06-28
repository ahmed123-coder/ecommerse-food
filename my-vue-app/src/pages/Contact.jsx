import React, { useEffect, useState } from "react";
import "../styles/Contact.css";

const Contact = () => {
     const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("darkMode") === "enabled";
      });
  return (
    <div>
    <div className={`contact-page ${darkMode ? "dark-mode" : ""}`}>
      {/* Page Header */}
      <div className="contact-header">
        <h1>Contact Us</h1>
        <p>We'd love to hear from you! Reach out to us for any questions or feedback.</p>
      </div>

      {/* Contact Content */}
      <div className="contact-container">
        {/* Contact Form */}
        <div className="contact-form">
          <h2>Send Us a Message</h2>
          <form>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input type="text" id="name" name="name" placeholder="Enter your name" required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" placeholder="Enter your email" required />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" placeholder="Enter your message" rows="5" required />
            </div>
            <button type="submit" className="submit-btn">Send Message</button>
          </form>
        </div>

        {/* Contact Information */}
        <div className="contact-info">
          <h2>Contact Information</h2>
          <ul>
            <li>
              <i className="bi bi-geo-alt"></i>
              <span>123 Main St, City, Country</span>
            </li>
            <li>
              <i className="bi bi-telephone"></i>
              <span>+216 21863971</span>
            </li>
            <li>
              <i className="bi bi-envelope"></i>
              <span>hamoudkhmiri@gmail.com</span>
            </li>
          </ul>

          {/* Social Media Links */}
          <div className="social-links">
            <a href="https://facebook.com" aria-label="Facebook">
              <i className="bi bi-facebook"></i>
            </a>
            <a href="https://twitter.com" aria-label="Twitter">
              <i className="bi bi-twitter"></i>
            </a>
            <a href="https://instagram.com" aria-label="Instagram">
              <i className="bi bi-instagram"></i>
            </a>
            <a href="https://linkedin.com" aria-label="LinkedIn">
              <i className="bi bi-linkedin"></i>
            </a>
          </div>
        </div>
      </div>

      {/* Embedded Google Map */}
      <div className="map-container">
        <iframe
          title="Google Map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.835434509374!2d144.9537353153166!3d-37.816279742021665!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf577d2fed4f5b6e1!2s123%20Main%20St%2C%20City%2C%20Country!5e0!3m2!1sen!2sus!4v1633033226788!5m2!1sen!2sus"
          width="100%"
          height="400"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </div>
    </div>
    </div>
  );
};

export default Contact;