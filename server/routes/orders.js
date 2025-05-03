const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Order = require("../models/Order");
const Menu = require("../models/Menu");

router.post("/", auth, async (req, res) => {
  try {
    if (!["waiter", "reception"].includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const { tableId, items } = req.body;
    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "Table ID and items are required" });
    }
    // Validate items
    const validatedItems = [];
    let total = 0;
    for (const item of items) {
      const menuItem = await Menu.findById(item.menuItemId);
      if (!menuItem) {
        return res
          .status(400)
          .json({ message: `Invalid menu item: ${item.menuItemId}` });
      }
      if (!item.quantity || item.quantity <= 0) {
        return res
          .status(400)
          .json({ message: `Invalid quantity for ${item.name}` });
      }
      validatedItems.push({
        menuItemId: item.menuItemId,
        name: menuItem.name,
        quantity: item.quantity,
        category: menuItem.category,
        ml: menuItem.ml || undefined,
      });
      total += menuItem.price * item.quantity;
    }
    const order = new Order({
      tableId,
      items: validatedItems,
      status: "pending",
      total,
    });
    await order.save();
    const io = req.app.get("io");
    io.emit("orderUpdate", order);
    console.log("Order created:", order);
    res.status(201).json(order);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const orders = await Order.find().populate("tableId", "tableNumber");
    console.log("Orders fetched:", orders);
    res.json(orders);
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "accepted", "served"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    const io = req.app.get("io");
    io.emit("orderUpdate", order);
    console.log("Order status updated:", order);
    res.json(order);
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
