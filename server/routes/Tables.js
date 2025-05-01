const express = require("express");
const router = express.Router();
const Table = require("../models/Table");
const User = require("../models/User");
const auth = require("../middleware/auth");

// Create a new table (reception only)
router.post("/", auth, async (req, res) => {
  const { tableNumber } = req.body;

  if (req.user.role.toLowerCase() !== "reception") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const existingTable = await Table.findOne({ tableNumber });
    if (existingTable) {
      return res.status(400).json({ message: "Table number already exists" });
    }

    const table = new Table({ tableNumber });
    await table.save();

    res.status(201).json(table);
  } catch (error) {
    console.error("Create table error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update table details (waiter only: assign waiter, customer name)
router.put("/:id", auth, async (req, res) => {
  const { customerName, waiterId } = req.body;

  if (req.user.role.toLowerCase() !== "waiter") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    if (waiterId) {
      const waiter = await User.findById(waiterId);
      if (
        !waiter ||
        waiter.role.toLowerCase() !== "waiter" ||
        !waiter.isLoggedIn
      ) {
        return res
          .status(400)
          .json({ message: "Invalid or unavailable waiter" });
      }
      table.waiterId = waiterId;
    }

    if (customerName !== undefined) {
      table.customerName = customerName;
    }

    await table.save();
    const populatedTable = await Table.findById(req.params.id).populate(
      "waiterId",
      "name"
    );
    res.json(populatedTable);
  } catch (error) {
    console.error("Update table error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a table (reception only)
router.delete("/:id", auth, async (req, res) => {
  if (req.user.role.toLowerCase() !== "reception") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    if (!table.isPaid) {
      return res
        .status(400)
        .json({ message: "Cannot delete table with unpaid bill" });
    }

    await table.deleteOne();
    res.json({ message: "Table deleted" });
  } catch (error) {
    console.error("Delete table error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add order to a table (waiter only)
router.post("/:id/orders", auth, async (req, res) => {
  const { itemName, price, quantity, waiterId } = req.body;

  if (req.user.role.toLowerCase() !== "waiter") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    const waiter = await User.findById(waiterId);
    if (
      !waiter ||
      waiter.role.toLowerCase() !== "waiter" ||
      !waiter.isLoggedIn
    ) {
      return res.status(400).json({ message: "Invalid or unavailable waiter" });
    }

    table.orders.push({ itemName, price, quantity, waiterId });
    table.totalBill += price * quantity;
    await table.save();

    const populatedTable = await Table.findById(req.params.id).populate(
      "waiterId",
      "name"
    );
    res.json(populatedTable);
  } catch (error) {
    console.error("Add order error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Pay bill for a table (reception only)
router.post("/:id/pay", auth, async (req, res) => {
  if (req.user.role.toLowerCase() !== "reception") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    if (table.isPaid) {
      return res.status(400).json({ message: "Bill already paid" });
    }

    table.isPaid = true;
    await table.save();

    res.json(table);
  } catch (error) {
    console.error("Pay bill error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all tables (reception and waiter)
router.get("/", auth, async (req, res) => {
  if (
    !["reception", "waiter"]
      .map((r) => r.toLowerCase())
      .includes(req.user.role.toLowerCase())
  ) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const tables = await Table.find()
      .populate("waiterId", "name")
      .populate("orders.waiterId", "name");
    res.json(tables);
  } catch (error) {
    console.error("Get tables error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
