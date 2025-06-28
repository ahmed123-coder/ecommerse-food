require("dotenv").config(); // ✅ لقراءة ملف .env
const cors = require("cors");
const path = require("path");
const express = require("express");
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const app = express();
app.use(cors());
// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

require("./config/connect"); // Ensure this file connects to MongoDB
const routercategory = require("./routes/Category");
const routeruser = require("./routes/User");
const routerproducts = require("./routes/Product");
const routerorders = require("./routes/Order");
const routergroupproducts = require("./routes/Groupproducts");
const routerdetails = require("./routes/DetailsClient");
app.use("/api/orders", routerorders);
app.use("/api/categorys", routercategory);
app.use("/api/users", routeruser);
app.use("/api/products", routerproducts);
app.use("/api/groupproducts", routergroupproducts)
app.use("/api/details", routerdetails);
// ahmedkhemirii@gmail.com  ahmed 2003 admin
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Server is running...");
});
