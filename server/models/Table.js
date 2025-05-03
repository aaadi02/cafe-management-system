const mongoose = require("mongoose");
const tableSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true, unique: true },
  customerName: { type: String },
  waiterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order", default: [] }],
  totalBill: { type: Number, default: 0 },
});
module.exports = mongoose.model("Table", tableSchema);
