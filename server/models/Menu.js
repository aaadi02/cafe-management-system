const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: {
    type: String,
    enum: ["Veg", "Non-Veg", "Drinks", "Beverages"],
    required: true,
  },
  ml: { type: Number }, // Optional, used only for Beverages
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Menu", menuSchema);
