const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true, unique: true },
    desc: { type: String, required: true },
    img: { type: String, required: true },
    categories: { type: Array },
    gender: { type: String, required: true },
    categorySlug: { type: String, required: true },
    size: { type: Array },
    colors: { type: Array },
    price: { type: Number, required: true },
    oldPrice: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
