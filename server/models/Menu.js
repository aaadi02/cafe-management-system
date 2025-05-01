const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ["Food", "Drinks"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Menu", menuSchema);
