const mongoose = require("mongoose");

const ColorSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    trim: true,
  },
});

module.exports = mongoose.model("Color", ColorSchema);
