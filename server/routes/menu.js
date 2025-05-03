const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Menu = require("../models/Menu");

// Create a menu item (reception only)
router.post("/", auth, async (req, res) => {
  if (req.user.role !== "reception") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  try {
    const { name, price, category, ml } = req.body;
    if (!name || !price || isNaN(price) || price <= 0) {
      return res
        .status(400)
        .json({ message: "Name and valid price are required" });
    }
    if (!["Veg", "Non-Veg", "Drinks", "Beverages"].includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }
    if (category === "Beverages") {
      if (!ml || isNaN(ml) || ml <= 0) {
        return res
          .status(400)
          .json({ message: "Valid ml value required for Beverages" });
      }
    } else if (ml) {
      return res
        .status(400)
        .json({ message: "ml field only allowed for Beverages" });
    }
    const menuItem = new Menu({
      name,
      price,
      category,
      ...(category === "Beverages" && { ml }),
    });
    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (err) {
    console.error("Create menu item error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all menu items
router.get("/", auth, async (req, res) => {
  try {
    const menuItems = await Menu.find();
    res.json(menuItems);
  } catch (err) {
    console.error("Fetch menu items error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
