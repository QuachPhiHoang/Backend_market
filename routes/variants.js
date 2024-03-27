const router = require("express").Router();
const Variants = require("../models/Variants");
const Size = require("../models/Size");
const Color = require("../models/Color");
const Product = require("../models/Product");

const {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
} = require("./verifyToken");

router.post("/create/:id", verifyTokenAndAdmin, async (req, res, next) => {
  try {
    const productId = req.params.id;
    const variantOptions = req.body.vars;

    // Check if product, size, and color already exist
    const product = await Product.findById(productId).populate({
      path: "variants",
      populate: { path: "size color" },
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    const variantsToAdd = [];
    for (let i = 0; i < variantOptions.length; i++) {
      const { sizeId, colorId, stock } = variantOptions[i];
      // Check if size and color exist
      const size = await Size.findById(sizeId);
      const color = await Color.findById(colorId);

      if (!size || !color) {
        return res.status(404).json({ error: "Size or color not found" });
      }
      // Check for duplicate variant
      const existingVariant = product.variants.some((variant) => {
        return (
          variant.size._id.toString() === sizeId &&
          variant.color._id.toString() === colorId
        );
      });

      if (existingVariant) {
        return res.status(400).json({
          message:
            "Duplicate variant: Size and color combination already exists.",
        });
      }
      variantsToAdd.push({
        // productId,
        size,
        color,
        stock,
      });
    }
    const newVariants = await Variants.insertMany(variantsToAdd);
    product.variants.push(...newVariants.map((variant) => variant._id));
    await product.save({ validateBeforeSave: false });
    return res.status(200).json({
      success: true,
      newVariants,
    });
  } catch (err) {
    console.log("err: ", err);
    return res.status(500).json(err);
  }
});
// //GETALL

// router.get("/all", async (req, res) => {
//   try {
//     const variants = await Variants.find();
//     res.status(200).json({
//       success: true,
//       variants,
//     });
//   } catch (error) {
//     return res.status(500).json(error);
//   }
// });
// //DELETE
// router.delete("/delete/:id", verifyTokenAndAdmin, async (req, res, next) => {
//   try {
//     const variant = await Variants.findById(req.params.id);
//     console.log(variant);
//     if (!variant) {
//       return next("Variants not found", 404);
//     }

//     await variant.remove();

//     res
//       .status(200)
//       .json({ success: true, message: "Variant has been deleted..." });
//   } catch (err) {
//     return res.status(500).json(err);
//   }
// });

// //UPDATE
// router.put("/:id", verifyTokenAndAdmin, async (req, res, next) => {
//   try {
//     const { size, color, stock } = req.body;
//     const variant = await Variants.findById(req.params.id);
//     const CheckUpdate = Boolean(
//       size === variant.size.toString() &&
//         color === variant.color.toString() &&
//         stock === variant.stock
//     );

//     if (CheckUpdate) {
//       return res.status(400).json({ massage: "Variant not change" });
//     }

//     const updatedVariant = await Variants.findByIdAndUpdate(
//       req.params.id,
//       {
//         size,
//         color,
//         stock,
//       },
//       { new: true }
//     );
//     if (!updatedVariant) {
//       return res.status(404).json({ error: "Variant not found" });
//     }
//     const product = await Product.findOne({ variants: req.params.id });
//     if (!product) {
//       return res
//         .status(404)
//         .json({ error: "Product not found for the variant" });
//     }

//     // Update the product's variant reference
//     // const updatedProduct = await Product.findOneAndUpdate(
//     //   { _id: product._id, "variants._id": req.params.id },
//     //   {
//     //     $set: {
//     //       updatedVariant,
//     //     },
//     //   },
//     //   { new: true }
//     // );
//     // console.log(updatedProduct);
//     res.status(200).json({ updatedVariant });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json(err);
//   }
// });
module.exports = router;
