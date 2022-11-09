const Product = require("../models/Product");
const {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
} = require("./verifyToken");

const ApiFeature = require("../util/apiFeature");

const router = require("express").Router();

//CREATE PRODUCT--ADMIN

router.post("/", verifyTokenAndAdmin, async (req, res) => {
  const newProduct = new Product(req.body);
  newProduct.user = req.user.id;

  try {
    const savedProduct = await newProduct.save();
    res.status(200).json(savedProduct);
  } catch (err) {
    res.status(500).json(err);
  }
});

//UPDATE
router.put("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const updateProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updateProduct);
  } catch (err) {
    res.status(500).json(err);
  }
});

// //DELETE

router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json("Product has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

// //GET Product

router.get("/find/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json(err);
  }
});

// //GET ALL PRODUCTS

router.get("/", verifyToken, async (req, res) => {
  const resultPerPage = 6;
  const productCount = await Product.countDocuments();
  const apiFeature = new ApiFeature(Product.find(), req.query)
    .search()
    .filter()
    .pagination(resultPerPage);
  try {
    let products = await apiFeature.query;
    res.status(200).json({ products, productCount });
  } catch (err) {
    res.status(500).json(err);
  }
});

//CREATE REVIEWS

router.put("/review/:id", verifyToken, async (req, res) => {
  const { rating, comment } = req.body;

  const review = {
    user: req.user.id,
    name: req.user.email,
    rating: Number(rating),
    comment,
  };
  console.log(review);

  const product = await Product.findById(req.params.id);

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user.id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user.id.toString())
        (rev.rating = rating), (rev.comment = comment);
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }
  let avg = 0;
  product.reviews.forEach((rev) => {
    avg = avg + rev.rating;
  });
  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

//GET ALL REVIEWS PRODUCTS

router.get("/reviews", async (req, res) => {
  const product = await Product.findById(req.query.id);

  console.log(product);

  if (!product) {
    return res.status(404).json("Product not found");
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

//DELETE REVIEWS

router.delete(
  "/delete/review",
  verifyTokenAndAuthorization,
  async (req, res) => {
    const product = await Product.findById(req.query.productId);

    if (!product) {
      return res.status(404).json("Product not found");
    }

    const reviews = product.reviews.filter(
      (rev) => rev.id.toString() !== req.query.id.toString()
    );

    console.log(reviews);
    let avg = 0;
    reviews.forEach((rev) => {
      avg = avg + rev.rating;
    });
    const ratings = avg / reviews.length;

    const numOfReviews = reviews.length;

    await Product.findByIdAndUpdate(
      req.query.productId,
      {
        reviews,
        ratings,
        numOfReviews,
      },
      {
        new: true,
        runValidators: true,
        userFindAndModify: false,
      }
    );

    res.status(200).json({
      success: true,
    });
  }
);

module.exports = router;
