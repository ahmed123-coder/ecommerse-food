const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const DetailsClient = require("../models/DetailsClient");
const ProductGroup = require("../models/ProductGroup");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// ----------- STATIC ROUTES FIRST -----------

// Create a new order in store
router.post("/in-store", async (req, res) => {
  try {
    const { customer, products, productGroups, paymentMethod, status } = req.body;
    let totalPrice = 0;

    // التحقق من المنتجات وتحديث الكميات
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ error: `Product with ID ${item.product} not found` });
      }
      // إذا الكمية null اعتبرها غير محدودة ولا تنقصها ولا تتحقق منها
      if (product.quantity !== null && product.quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient quantity for product ${product.name}` });
      }
      totalPrice += product.price * item.quantity;
      if (product.quantity !== null) {
        product.quantity -= item.quantity;
        await product.save();
      }
    }

    // التحقق من مجموعات المنتجات وتحديث الكميات
    for (const groupItem of productGroups) {
      const group = await ProductGroup.findById(groupItem.group).populate("products.product");
      if (!group) {
        return res.status(404).json({ error: `Product group with ID ${groupItem.group} not found` });
      }
      for (const item of group.products) {
        // إذا الكمية null اعتبرها غير محدودة ولا تنقصها ولا تتحقق منها
        if (item.product.quantity !== null && item.product.quantity < item.quantity * groupItem.quantity) {
          return res.status(400).json({ error: `Insufficient quantity for product ${item.product.name} in group ${group.name}` });
        }
        if (item.product.quantity !== null) {
          item.product.quantity -= item.quantity * groupItem.quantity;
          await item.product.save();
        }
      }
      totalPrice += group.price * groupItem.quantity;
    }

    const lastOrder = await Order.findOne({ isInStore: true }).sort({ queueNumber: -1 });
    let queueNumber = 1;
    if (lastOrder && typeof lastOrder.queueNumber === "number" && !isNaN(lastOrder.queueNumber)) {
      queueNumber = lastOrder.queueNumber + 1;
    }

    const order = new Order({
      customer,
      products,
      productGroups,
      totalPrice,
      status: status || "pending",
      paymentMethod: paymentMethod || "cash",
      isInStore: true,
      queueNumber,
      createdAt: new Date(),
    });

    await order.save();

    // Populate details for response
    const populatedOrder = await Order.findById(order._id)
      .populate("products.product", "name price image")
      .populate("productGroups.group", "name price image");

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error("Error creating order:", error.message || error);
    res.status(500).json({ error: error.message || "Error creating order" });
  }
});

// Create a new order not in store
router.post("/", async (req, res) => {
  try {
    console.log("Received Order Data:", req.body);
    const { customer, products, productGroups, paymentMethod, createdAt } = req.body;

    let totalPrice = 0;

    // التحقق من المنتجات وتحديث الكميات
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ error: `Product with ID ${item.product} not found` });
      }
      // إذا الكمية null اعتبرها غير محدودة ولا تنقصها ولا تتحقق منها
      if (product.quantity !== null && product.quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient quantity for product ${product.name}` });
      }
      totalPrice += product.price * item.quantity;
      if (product.quantity !== null) {
        product.quantity -= item.quantity;
        await product.save();
      }
    }

    // التحقق من مجموعات المنتجات وتحديث الكميات
    for (const groupItem of productGroups) {
      const group = await ProductGroup.findById(groupItem.group).populate("products.product");
      if (!group) {
        return res.status(404).json({ error: `Product group with ID ${groupItem.group} not found` });
      }
      for (const item of group.products) {
        // إذا الكمية null اعتبرها غير محدودة ولا تنقصها ولا تتحقق منها
        if (item.product.quantity !== null && item.product.quantity < item.quantity * groupItem.quantity) {
          return res.status(400).json({ error: `Insufficient quantity for product ${item.product.name} in group ${group.name}` });
        }
        if (item.product.quantity !== null) {
          item.product.quantity -= item.quantity * groupItem.quantity;
          await item.product.save();
        }
      }
      totalPrice += group.price * groupItem.quantity;
    }

    const order = new Order({
      customer,
      products,
      productGroups,
      totalPrice,
      status: "pending",
      paymentMethod: paymentMethod || "cash",
      isInStore: false,
      createdAt: createdAt || new Date(),
    });
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error.message || error);
    res.status(500).json({ error: error.message || "Error creating order" });
  }
});

// GET order in store
router.get('/in-store', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const orders = await Order.find({ isInStore: true })
      .populate("customer", "firstName lastName email")
      .populate("products.product", "name price image")
      .populate("productGroups.group", "name price image")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching not in-store orders' });
  }
});

// Get all orders when the orders not in store
router.get("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const orders = await Order.find({ isInStore: false })
      .populate("customer", "firstName lastName email")
      .populate("products.product", "name price image")
      .populate("productGroups.group", "name price image")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: error.message || "Error fetching orders" });
  }
});

// delete all order in store
router.delete("/in-store", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin") {
      const orders = await Order.find({ isInStore: true });
      if (orders.length === 0) {
        return res.status(404).json({ message: "No orders found in store" });
      }

      // استعادة الكميات السابقة عند الحذف
      for (const order of orders) {
        for (const item of order.products) {
          const product = await Product.findById(item.product);
          if (product) {
            product.quantity += item.quantity;
            await product.save();
          }
        }

        for (const groupItem of order.productGroups) {
          const group = await ProductGroup.findById(groupItem.group).populate("products.product");
          if (group) {
            for (const item of group.products) {
              item.product.quantity += item.quantity * groupItem.quantity;
              await item.product.save();
            }
          }
        }

        await Order.findByIdAndDelete(order._id);
      }

      res.status(200).json({ message: "All orders in store deleted successfully" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete all order not in store
router.delete("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin") {
      const orders = await Order.find({ isInStore: false });
      if (orders.length === 0) {
        return res.status(404).json({ message: "No orders found not in store" });
      }

      // استعادة الكميات السابقة عند الحذف
      for (const order of orders) {
        for (const item of order.products) {
          const product = await Product.findById(item.product);
          if (product) {
            product.quantity += item.quantity;
            await product.save();
          }
        }

        for (const groupItem of order.productGroups) {
          const group = await ProductGroup.findById(groupItem.group).populate("products.product");
          if (group) {
            for (const item of group.products) {
              item.product.quantity += item.quantity * groupItem.quantity;
              await item.product.save();
            }
          }
        }

        await Order.findByIdAndDelete(order._id);
      }

      res.status(200).json({ message: "All orders not in store deleted successfully" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------- DYNAMIC ROUTES AFTER STATIC ROUTES -----------

// Update status to pending when the order is not in store 
router.put("/:id/pending", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if(!user){
      return res.status(404).json({ message: "User not found" });
    }
    if(user.role === "admin"){
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (order.isInStore) {
        return res.status(400).json({ error: "Order is not in store" });
      }
      order.status = "pending";
      await order.save();
      res.status(200).json(order);
    }
  } catch (error) {
    res.status(500).json({ error: "Error updating delivery status" });
  }
});

// Update status to pending when the order is in store
router.put("/:id/pending/in-store", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if(!user){
      return res.status(404).json({ message: "User not found" });
    }
    if(user.role === "admin"){
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (!order.isInStore) {
        return res.status(400).json({ error: "Order is not in store" });
      }
      order.status = "pending";
      await order.save();
      res.status(200).json(order);
    }
  } catch (error) {
    res.status(500).json({ error: "Error updating delivery status" });
  }
});

// Update status to delivered when the order in not store
router.put("/:id/delivered", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if(!user){
      return res.status(404).json({ message: "User not found" });
    }
    if(user.role === "admin"){
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (order.isInStore) {
        return res.status(400).json({ error: "Order is not in store" });
      }
      order.status = "delivered";
      await order.save();
      res.status(200).json(order);
    }
  } catch (error) {
    res.status(500).json({ error: "Error updating delivery status" });
  }
});

// Update delivery status to delivered when the order in store
router.put("/:id/delivered/in-store", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if(!user){
      return res.status(404).json({ message: "User not found" });
    }
    if(user.role === "admin"){
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (!order.isInStore) {
        return res.status(400).json({ error: "Order is not in store" });
      }
      order.status = "delivered";
      await order.save();
      res.status(200).json(order);
    }
  } catch (error) {
    res.status(500).json({ error: "Error updating delivery status" });
  }
});

// Update delivery status to cancelled when the order in not store
router.put("/:id/canceled", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (order.isInStore) {
      return res.status(400).json({ error: "Order is not in store" });
    }
    order.status = "cancelled";
    await order.save();
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: "Error updating delivery status" });
  }
});

// Update order when the order is not in store
router.put("/:id", async (req, res) => {
  try {
    const token  = req.headers.authorization?.split(" ")[1];
    if(!token){
      return res.status(401).json({ message: "No token provided" });
    }
    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if(!user){
      return res.status(404).json({ message: "No token provided" });
    }
    if(user.role === "admin"){
      const { customer, products, productGroups, paymentMethod, createdAt } = req.body;

      const order = await Order.findById(req.params.id);
      if (order.isInStore) {
        return res.status(400).json({ message: "Cannot update in-store orders" });
      }
      if (!order) return res.status(404).json({ error: "Order not found" });

      let totalPrice = 0;

      // استعادة الكميات السابقة
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (product) product.quantity += item.quantity;
        await product.save();
      }
      for (const groupItem of order.productGroups) {
        const group = await ProductGroup.findById(groupItem.group).populate("products.product");
        if (group) {
          for (const item of group.products) {
            item.product.quantity += item.quantity * groupItem.quantity;
            await item.product.save();
          }
        }
      }

      // التحقق من المنتجات الجديدة وتحديث المخزون
      for (const item of products) {
        const product = await Product.findById(item.product);
        if (!product) return res.status(404).json({ error: `Product with ID ${item.product} not found` });

        if (product.quantity < item.quantity) {
          return res.status(400).json({ error: `Insufficient quantity for product ${product.name}` });
        }

        totalPrice += product.price * item.quantity;
        product.quantity -= item.quantity;
        await product.save();
      }

      // التحقق من مجموعات المنتجات الجديدة
      for (const groupItem of productGroups) {
        const group = await ProductGroup.findById(groupItem.group).populate("products.product");
        if (!group) return res.status(404).json({ error: `Product group with ID ${groupItem.group} not found` });

        for (const item of group.products) {
          if (item.product.quantity < item.quantity * groupItem.quantity) {
            return res.status(400).json({ error: `Insufficient quantity for product ${item.product.name} in group ${group.name}` });
          }
          item.product.quantity -= item.quantity * groupItem.quantity;
          await item.product.save();
        }

        totalPrice += group.price * groupItem.quantity;
      }

      // تحديث الطلب
      order.customer = customer || order.customer;
      order.products = products || order.products;
      order.productGroups = productGroups || order.productGroups;
      order.totalPrice = totalPrice || order.totalPrice;
      order.paymentMethod = paymentMethod || order.paymentMethod;
      order.createdAt = createdAt || order.createdAt;

      await order.save();
      res.status(200).json(order);
    }
  } catch(err){
    res.status(500).json({ error: err.message });
  }
});

// Update order when the order is in store
router.put("/:id/in-store", async (req, res) => {
  try {
    const token  = req.headers.authorization?.split(" ")[1];
    if(!token){
      return res.status(401).json({ message: "No token provided" });
    }
    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if(!user){
      return res.status(404).json({ message: "No token provided" });
    }
    if(user.role === "admin"){
      const { customer, products, productGroups, paymentMethod, status } = req.body;

      const order = await Order.findById(req.params.id);
      if (!order.isInStore) {
        return res.status(400).json({ message: "Cannot update not in-store orders" });
      }
      if (!order) return res.status(404).json({ error: "Order not found" });

      let totalPrice = 0;

      // استعادة الكميات السابقة
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (product) product.quantity += item.quantity;
        await product.save();
      }
      for (const groupItem of order.productGroups) {
        const group = await ProductGroup.findById(groupItem.group).populate("products.product");
        if (group) {
          for (const item of group.products) {
            item.product.quantity += item.quantity * groupItem.quantity;
            await item.product.save();
          }
        }
      }

      // التحقق من المنتجات الجديدة وتحديث المخزون
      for (const item of products) {
        const product = await Product.findById(item.product);
        if (!product) return res.status(404).json({ error: `Product with ID ${item.product} not found` });

        if (product.quantity < item.quantity) {
          return res.status(400).json({ error: `Insufficient quantity for product ${product.name}` });
        }

        totalPrice += product.price * item.quantity;
        product.quantity -= item.quantity;
        await product.save();
      }

      // التحقق من مجموعات المنتجات الجديدة
      for (const groupItem of productGroups) {
        const group = await ProductGroup.findById(groupItem.group).populate("products.product");
        if (!group) return res.status(404).json({ error: `Product group with ID ${groupItem.group} not found` });

        for (const item of group.products) {
          if (item.product.quantity < item.quantity * groupItem.quantity) {
            return res.status(400).json({ error: `Insufficient quantity for product ${item.product.name} in group ${group.name}` });
          }
          item.product.quantity -= item.quantity * groupItem.quantity;
          await item.product.save();
        }

        totalPrice += group.price * groupItem.quantity;
      }

      // تحديث الطلب
      order.customer = customer || order.customer;
      order.products = products || order.products;
      order.productGroups = productGroups || order.productGroups;
      order.totalPrice = totalPrice;
      order.paymentMethod = paymentMethod;
      order.status = status || "pending"; // إعادة تعيين الحالة إلى pending عند التحديث
      await order.save();
      res.status(200).json(order);
    }
  } catch(err){
    res.status(500).json({ error: err.message });
  }
});

// Delete order when the order is not in store
router.delete("/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if(!user){
      return res.status(404).json({ message: "User not found" });
    }
    if(user.role === "admin"){
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ error: "Order not found" });
      if (order.isInStore) {
        return res.status(400).json({ error: "Order is not in store" });
      }

      // استعادة الكميات السابقة عند الحذف
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (product) {
          product.quantity += item.quantity;
          await product.save();
        }
      }

      for (const groupItem of order.productGroups) {
        const group = await ProductGroup.findById(groupItem.group).populate("products.product");
        if (group) {
          for (const item of group.products) {
            item.product.quantity += item.quantity * groupItem.quantity;
            await item.product.save();
          }
        }
      }

      await Order.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Order deleted successfully" });
    }
  } catch(err){
    res.status(500).json({ error: err.message });
  }
});

// Delete order when the order is in store
router.delete("/:id/in-store", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if(!user){
      return res.status(404).json({ message: "User not found" });
    }
    if(user.role === "admin"){
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ error: "Order not found" });
      if (!order.isInStore) {
        return res.status(400).json({ error: "Order is not in store" });
      }

      // استعادة الكميات السابقة عند الحذف
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (product) {
          product.quantity += item.quantity;
          await product.save();
        }
      }

      for (const groupItem of order.productGroups) {
        const group = await ProductGroup.findById(groupItem.group).populate("products.product");
        if (group) {
          for (const item of group.products) {
            item.product.quantity += item.quantity * groupItem.quantity;
            await item.product.save();
          }
        }
      }

      await Order.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Order deleted successfully" });
    }
  } catch(err){
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id => جلب الأوردر والتفاصيل المرتبطة به
router.get("/:id/detailclient", async (req, res) => {
  try {
    const orderId = req.params.id;

    // 1. جلب الأوردر
    const order = await Order.findById(orderId);
    if (order.isInStore) {
      return res.status(400).json({ message: "الطلب داخلي ولا يحتوي على تفاصيل عميل" });
    }

    if (!order) return res.status(404).json({ message: "الطلب غير موجود" });

    // 2. جلب بيانات DetailsClient
    const detailsClient = await DetailsClient.findOne({ idorder: orderId });

    res.json(detailsClient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء جلب البيانات" });
  }
});

// Get orders for a specific user
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const orders = await Order.find({ customer: userId })
      .populate({ path: "customer", select: "firstName lastName email", strictPopulate: false })
      .populate("products.product", "name price image")
      .populate("productGroups.group", "name price image")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/orders/stats/days/in-store?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/stats/days/in-store', async (req, res) => {
  let { start, end } = req.query;
  let startDate = start ? new Date(start) : new Date("2000-01-01");
  let endDate = end ? new Date(end) : new Date();
  endDate.setHours(23,59,59,999);

  const orders = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, isInStore: true } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  res.json(orders);
});
// GET /api/orders/stats/days/not-in-store?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/stats/days', async (req, res) => {
  let { start, end } = req.query;
  let startDate = start ? new Date(start) : new Date("2000-01-01");
  let endDate = end ? new Date(end) : new Date();
  endDate.setHours(23,59,59,999);

  const orders = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, isInStore: false } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  res.json(orders);
});
// GET /api/orders/stats/months?start=YYYY-MM&end=YYYY-MM
router.get('/stats/months', async (req, res) => {
  let { start, end } = req.query;
  let startDate = start ? new Date(start + "-01") : new Date("2000-01-01");
  let endDate = end ? new Date(end + "-31") : new Date();
  endDate.setHours(23,59,59,999);

  const orders = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, isInStore: false } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  res.json(orders);
});
// GET /api/orders/stats/months/in-store?start=YYYY-MM&end=YYYY-MM
router.get('/stats/months/in-store', async (req, res) => {
  let { start, end } = req.query;
  let startDate = start ? new Date(start + "-01") : new Date("2000-01-01");
  let endDate = end ? new Date(end + "-31") : new Date();
  endDate.setHours(23,59,59,999);

  const orders = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, isInStore: true } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  res.json(orders);
});
// GET /api/orders/stats/top-products-all/in-store?mode=days|months&start=YYYY-MM-DD|YYYY-MM&end=YYYY-MM-DD|YYYY-MM
router.get('/stats/top-products-all/in-store', async (req, res) => {
  try {
    const { mode = "days", start, end } = req.query;
    let startDate, endDate, groupFormat;
    if (mode === "months") {
      startDate = start ? new Date(start + "-01") : new Date("2000-01-01");
      endDate = end ? new Date(end + "-31") : new Date();
      groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
    } else {
      startDate = start ? new Date(start) : new Date("2000-01-01");
      endDate = end ? new Date(end) : new Date();
      groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    }
    endDate.setHours(23,59,59,999);

    // المنتجات المفردة
    const singleProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, isInStore: true } },
      { $unwind: "$products" },
      {
        $group: {
          _id: {
            product: "$products.product",
            period: groupFormat
          },
          totalSold: { $sum: "$products.quantity" }
        }
      }
    ]);

    // مجموعات المنتجات
    const groupProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, isInStore: true } },
      { $unwind: "$productGroups" },
      {
        $lookup: {
          from: "productgroups",
          localField: "productGroups.group",
          foreignField: "_id",
          as: "groupInfo"
        }
      },
      { $unwind: "$groupInfo" },
      { $unwind: "$groupInfo.products" },
      {
        $group: {
          _id: {
            product: "$groupInfo.products.product",
            period: groupFormat
          },
          totalSold: {
            $sum: {
              $multiply: [
                "$groupInfo.products.quantity",
                "$productGroups.quantity"
              ]
            }
          }
        }
      }
    ]);

    // دمج النتائج
    const totals = {};
    singleProducts.forEach(p => {
      const key = `${p._id.product}_${p._id.period}`;
      totals[key] = (totals[key] || 0) + p.totalSold;
    });
    groupProducts.forEach(p => {
      const key = `${p._id.product}_${p._id.period}`;
      totals[key] = (totals[key] || 0) + p.totalSold;
    });

    // جلب بيانات المنتجات
    const Product = require("../models/Product");
    const productIds = [...new Set(Object.keys(totals).map(k => k.split("_")[0]))];
    const products = await Product.find({ _id: { $in: productIds } });

    // تجهيز الرد النهائي
    const result = [];
    Object.entries(totals).forEach(([key, totalSold]) => {
      const [prodId, period] = key.split("_");
      const prod = products.find(p => p._id.toString() === prodId);
      if (prod) {
        result.push({
          productId: prod._id,
          name: prod.name,
          period,
          totalSold,
          price: prod.price,
          image: prod.image
        });
      }
    });
    result.sort((a, b) => a.period.localeCompare(b.period) || b.totalSold - a.totalSold);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }  
});
// GET /api/orders/stats/top-products-all/not-in-store?mode=days|months&start=YYYY-MM-DD|YYYY-MM&end=YYYY-MM-DD|YYYY-MM
router.get('/stats/top-products-all', async (req, res) => {
  try {
    const { mode = "days", start, end } = req.query;
    let startDate, endDate, groupFormat;
    if (mode === "months") {
      startDate = start ? new Date(start + "-01") : new Date("2000-01-01");
      endDate = end ? new Date(end + "-31") : new Date();
      groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
    } else {
      startDate = start ? new Date(start) : new Date("2000-01-01");
      endDate = end ? new Date(end) : new Date();
      groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    }
    endDate.setHours(23,59,59,999);

    // المنتجات المفردة
    const singleProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, isInStore: false } },
      { $unwind: "$products" },
      {
        $group: {
          _id: {
            product: "$products.product",
            period: groupFormat
          },
          totalSold: { $sum: "$products.quantity" }
        }
      }
    ]);

    // مجموعات المنتجات
    const groupProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, isInStore: false } },
      { $unwind: "$productGroups" },
      {
        $lookup: {
          from: "productgroups",
          localField: "productGroups.group",
          foreignField: "_id",
          as: "groupInfo"
        }
      },
      { $unwind: "$groupInfo" },
      { $unwind: "$groupInfo.products" },
      {
        $group: {
          _id: {
            product: "$groupInfo.products.product",
            period: groupFormat
          },
          totalSold: {
            $sum: {
              $multiply: [
                "$groupInfo.products.quantity",
                "$productGroups.quantity"
              ]
            }
          }
        }
      }
    ]);

    // دمج النتائج
    const totals = {};
    singleProducts.forEach(p => {
      const key = `${p._id.product}_${p._id.period}`;
      totals[key] = (totals[key] || 0) + p.totalSold;
    });
    groupProducts.forEach(p => {
      const key = `${p._id.product}_${p._id.period}`;
      totals[key] = (totals[key] || 0) + p.totalSold;
    });

    // جلب بيانات المنتجات
    const Product = require("../models/Product");
    const productIds = [...new Set(Object.keys(totals).map(k => k.split("_")[0]))];
    const products = await Product.find({ _id: { $in: productIds } });

    // تجهيز الرد النهائي
    const result = [];
    Object.entries(totals).forEach(([key, totalSold]) => {
      const [prodId, period] = key.split("_");
      const prod = products.find(p => p._id.toString() === prodId);
      if (prod) {
        result.push({
          productId: prod._id,
          name: prod.name,
          period,
          totalSold,
          price: prod.price,
          image: prod.image
        });
      }
    });
    result.sort((a, b) => a.period.localeCompare(b.period) || b.totalSold - a.totalSold);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET /api/orders/stats/product/:productId/days/in-store?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/stats/product/:productId/days/in-store', async (req, res) => {
  const { productId } = req.params;
  let { start, end } = req.query;
  let startDate = start ? new Date(start) : new Date("2000-01-01");
  let endDate = end ? new Date(end) : new Date();
  endDate.setHours(23,59,59,999);

  // المنتجات المفردة
  const single = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, isInStore: true } },
    { $unwind: "$products" },
    { $match: { "products.product": new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: "$products.quantity" }
      }
    }
  ]);

  // مجموعات المنتجات
  const group = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, isInStore: true } },
    { $unwind: "$productGroups" },
    {
      $lookup: {
        from: "productgroups",
        localField: "productGroups.group",
        foreignField: "_id",
        as: "groupInfo"
      }
    },
    { $unwind: "$groupInfo" },
    { $unwind: "$groupInfo.products" },
    { $match: { "groupInfo.products.product": new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: {
          $sum: { $multiply: ["$groupInfo.products.quantity", "$productGroups.quantity"] }
        }
      }
    }
  ]);

  // دمج النتائج
  const totals = {};
  single.forEach(d => { totals[d._id] = (totals[d._id] || 0) + d.count; });
  group.forEach(d => { totals[d._id] = (totals[d._id] || 0) + d.count; });

  const result = Object.keys(totals)
    .filter(date => date >= start && date <= end)
    .sort()
    .map(date => ({
      date,
      count: totals[date]
    }));

  res.json(result);
});

// GET /api/orders/stats/product/:productId/days/not-in-store?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/stats/product/:productId/days', async (req, res) => {
  const { productId } = req.params;
  let { start, end } = req.query;
  let startDate = start ? new Date(start) : new Date("2000-01-01");
  let endDate = end ? new Date(end) : new Date();
  endDate.setHours(23,59,59,999);

  // المنتجات المفردة
  const single = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, isInStore: false } },
    { $unwind: "$products" },
    { $match: { "products.product": new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: "$products.quantity" }
      }
    }
  ]);

  // مجموعات المنتجات
  const group = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, isInStore: false } },
    { $unwind: "$productGroups" },
    {
      $lookup: {
        from: "productgroups",
        localField: "productGroups.group",
        foreignField: "_id",
        as: "groupInfo"
      }
    },
    { $unwind: "$groupInfo" },
    { $unwind: "$groupInfo.products" },
    { $match: { "groupInfo.products.product": new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: {
          $sum: { $multiply: ["$groupInfo.products.quantity", "$productGroups.quantity"] }
        }
      }
    }
  ]);

  // دمج النتائج
  const totals = {};
  single.forEach(d => { totals[d._id] = (totals[d._id] || 0) + d.count; });
  group.forEach(d => { totals[d._id] = (totals[d._id] || 0) + d.count; });

  const result = Object.keys(totals)
    .filter(date => date >= start && date <= end)
    .sort()
    .map(date => ({
      date,
      count: totals[date]
    }));

  res.json(result);
});

module.exports = router;