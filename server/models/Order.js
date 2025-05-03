const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Table",
    required: true,
  },
  items: [
    {
      menuItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Menu",
        required: true,
      },
      quantity: { type: Number, required: true, min: 1 },
    },
  ],
  total: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ["pending", "preparing", "ready", "served", "paid"],
    default: "pending",
  },
  waiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  billGenerated: { type: Boolean, default: false },
  paid: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);
