const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    customerName: {
      type: String,
      default: "",
    },
    waiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    orders: [
      {
        itemName: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        waiterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    totalBill: {
      type: Number,
      default: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Table", tableSchema);
