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
        // Không cần phải set name ở đây nữa, get theo user là sẽ có. Đoạn này thừa (dòng 32)
        // name: { type: String, required: true },
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
