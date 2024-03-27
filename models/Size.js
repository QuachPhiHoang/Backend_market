const mongoose = require("mongoose");

const SizeSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    trim: true,
  },
});
module.exports = mongoose.model("Size", SizeSchema);
