const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    desc: { type: String, required: true },
    img: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    sale: { type: String, default: 0 },
    categories: { type: Array },
    gender: { type: String, required: true },
    categorySlug: { type: String, required: true },
    size: { type: Array },
    colors: { type: Array },
    price: { type: Number, required: true },
    oldPrice: { type: Number, required: true },
    stock: {
      type: Number,
      required: true,
      default: 1,
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
    ratings: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
