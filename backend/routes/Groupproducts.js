const express = require("express");
const multer = require("multer");
const router = express.Router();
const ProductGroup = require("../models/ProductGroup");
const Product = require("../models/Product");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "your_secret_key";

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/"); // Save files in the "uploads" folder
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname); // Rename file to avoid conflicts
    },
  });
  
const upload = multer({ storage: storage });
router.get("/", async (req, res)=>{
    try{
        const productGroups = await ProductGroup.find().populate("products.product", "name price quantity");
        res.status(200).json(productGroups);
    }catch(error){
        res.status(500).json({error: error.message});
    }
});
// Get a single product group by ID
router.get("/:id", async (req, res) => {
    try {
      const group = await ProductGroup.findById(req.params.id)
        .populate("products.product", "name price quantity");
      if (!group) {
        return res.status(404).json({ error: "Product group not found" });
      }
      res.status(200).json(group);
    } catch (error) {
      res.status(500).json({ error: "Error fetching product group" });
    }
  });
  router.put("/:id", upload.single("image"), async (req, res)=>{
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decode = jwt.verify(token, JWT_SECRET);
    try{
        const user = await User.findById(decode.id);
        if(!user){
          return res.status(404).json({ message: "User not found" });
        }
        if(user.role === "admin"){
          const updateData = req.body;
          if (req.file) updateData.image = req.file.path;
          const group = await ProductGroup.findById(req.params.id);
          if(!group){
              return res.status(404).json({ error: `Product with ID ${item.product} not found`});
          }
          if(updateData.products){
              for(const item of updateData.products){
                  const product = await Product.findById(item.product);
                  if(!product){
                    res.status(404).json({ error: `Product with ID ${item.product} not found` });
                  }
              }
          }
          const updatedGroup = await ProductGroup.findByIdAndUpdate(req.params.id, updateData, { new: true });
          res.status(200).json(updatedGroup);
          res.status(200).json(group);
        }
    }catch(error){
        res.status(500).json({ error: "Error updating product group" });
    }
  });
router.post("/", upload.single("image"),async (req, res)=>{
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decode = jwt.verify(token, JWT_SECRET);
    try{
        const user = await User.findById(decode.id);
        if(!user){
            return res.status(404).json({ message: "User not found" });
        }
        if (user.role === "admin"){
            const image = req.file ? req.file.path : null; // Save the file path
            const {name, description, products, price} =req.body;
            for(const item of products){
                const product = await Product.findById(item.product);
                if(!product){
                    res.status(404).json({ error: `Product with ID ${item.product} not found` });
                }
            }
            const productGroup = new ProductGroup({name, description, products, price, image});
            await productGroup.save();
            res.status(201).json(productGroup);
        }
    }catch(error){
        res.status(500).json({error: "Error creating product group"})
    }
});
router.delete("/:id", async (req, res)=>{
  try{
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if(!user){
      return res.status(401).json({ message: "No token provided" });
    }
    if(user.role === "admin"){
      const idgroup = req.params.id;
      await ProductGroup.findByIdAndDelete(idgroup);
      res.status(200).json({ message: "User deleted successfully" });
    }
  }catch(error){
    res.status(200).json({error: error.message});
  }
});

module.exports = router;