const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Table = require("../models/Table");

// Get all tables
router.get("/", auth, async (req, res) => {
  try {
    // Allow reception, waiter, and kitchen roles
    if (!["reception", "waiter", "kitchen"].includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const tables = await Table.find().populate("waiterId");
    res.json(tables);
  } catch (err) {
    console.error("Fetch tables error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a table (reception only)
router.post("/", auth, async (req, res) => {
  if (req.user.role !== "reception") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  try {
    const { tableNumber } = req.body;
    if (!tableNumber) {
      return res.status(400).json({ message: "Table number is required" });
    }
    const table = new Table({ tableNumber });
    await table.save();
    res.status(201).json(table);
  } catch (err) {
    console.error("Create table error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a table (reception or waiter)
router.put("/:id", auth, async (req, res) => {
  if (!["reception", "waiter"].includes(req.user.role)) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    const { customerName, waiterId } = req.body;
    if (customerName !== undefined) table.customerName = customerName;
    if (waiterId !== undefined) table.waiterId = waiterId;
    await table.save();
    res.json(table);
  } catch (err) {
    console.error("Update table error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a table (reception only)
router.delete("/:id", auth, async (req, res) => {
  if (req.user.role !== "reception") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    await table.remove();
    res.json({ message: "Table deleted" });
  } catch (err) {
    console.error("Delete table error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
