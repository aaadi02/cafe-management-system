const express = require("express");
const router = express.Router();
const Menu = require("../models/Menu");
const auth = require("../middleware/auth");

// Add a menu item (reception only)
router.post("/", auth, async (req, res) => {
  const { name, price, category } = req.body;

  if (req.user.role.toLowerCase() !== "reception") {
    return res.status(403).json({ message: "Access denied" });
  }

  if (!["Food", "Drinks"].includes(category)) {
    return res.status(400).json({ message: "Invalid category" });
  }

  try {
    const existingItem = await Menu.findOne({ name, category });
    if (existingItem) {
      return res
        .status(400)
        .json({ message: "Item already exists in this category" });
    }

    const menuItem = new Menu({ name, price, category });
    await menuItem.save();

    res.status(201).json(menuItem);
  } catch (error) {
    console.error("Add menu item error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a menu item (reception only)
router.put("/:id", auth, async (req, res) => {
  const { name, price, category } = req.body;

  if (req.user.role.toLowerCase() !== "reception") {
    return res.status(403).json({ message: "Access denied" });
  }

  if (category && !["Food", "Drinks"].includes(category)) {
    return res.status(400).json({ message: "Invalid category" });
  }

  try {
    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    if (name) menuItem.name = name;
    if (price !== undefined) menuItem.price = price;
    if (category) menuItem.category = category;

    await menuItem.save();
    res.json(menuItem);
  } catch (error) {
    console.error("Update menu item error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a menu item (reception only)
router.delete("/:id", auth, async (req, res) => {
  if (req.user.role.toLowerCase() !== "reception") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    await menuItem.deleteOne();
    res.json({ message: "Menu item deleted" });
  } catch (error) {
    console.error("Delete menu item error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all menu items (reception and waiter)
router.get("/", auth, async (req, res) => {
  if (
    !["reception", "waiter"]
      .map((r) => r.toLowerCase())
      .includes(req.user.role.toLowerCase())
  ) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const menuItems = await Menu.find().sort({ category: 1, name: 1 });
    res.json(menuItems);
  } catch (error) {
    console.error("Get menu items error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
