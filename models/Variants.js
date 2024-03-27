const mongoose = require("mongoose");

const VariantSchema = new mongoose.Schema({
  // productId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Product",
  //   required: true,
  // },
  size: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Size",
    required: true,
  },
  color: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Color",
    required: true,
  },
  stock: { type: Number, default: 0 },
});

VariantSchema.pre("remove", async function (next) {
  try {
    // Find the product and remove the variant reference
    const product = await mongoose.model("Product").findById(this.productId);
    if (product) {
      product.variants.pull(this._id);
      await product.save();
    }
    next();
  } catch (error) {
    next(error);
  }
});
module.exports = mongoose.model("Variants", VariantSchema);
