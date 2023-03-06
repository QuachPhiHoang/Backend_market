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
    const product = await Product.findById(req.params.id).populate(
      "reviews.user",
      "_id username"
    );
    res.header("Access-Control-Allow-Origin", "*");
    return res.status(200).json(product);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// //GET ALL PRODUCTS

router.get("/", async (req, res) => {
  const resultPerPage = 8;
  const productCount = await Product.countDocuments();
  const apiFeature = new ApiFeature(Product.find(), req.query)
    .search()
    .filter();
  let products = await apiFeature.query;
  apiFeature.pagination(resultPerPage);
  let filteredProductsCount = products.length;
  products = await apiFeature.query.clone();
  try {
    res.header("Access-Control-Allow-Origin", "*");
    return res.status(200).json({
      success: true,
      products,
      productCount,
      resultPerPage,
      filteredProductsCount,
    });
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.get("/search", async (req, res) => {
  const resultPerPage = 5;
  const apiFeature = new ApiFeature(Product.find(), req.query).search();
  let products = await apiFeature.query;
  apiFeature.pagination(resultPerPage);
  let filteredProductsCount = products.length;
  products = await apiFeature.query.clone();
  try {
    res.header("Access-Control-Allow-Origin", "*");
    return res.status(200).json({
      success: true,
      resultPerPage,
      products,
      filteredProductsCount,
    });
  } catch (err) {
    return res.status(500).json(err);
  }
});

//CREATE REVIEWS

router.put("/review/:id", verifyToken, async (req, res) => {
  const { rating, comment } = req.body;

  const review = {
    user: req.user.id,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(req.params.id).populate(
    "reviews.user",
    "_id username"
  );

  if (!product) {
    return res.status(404).json("product not found!");
  }

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user.id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user.id.toString()) {
        rev.rating = rating;
        rev.comment = comment;
      }
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
    product: product,
  });
});

//GET ALL REVIEWS PRODUCTS

router.get("/reviews", async (req, res) => {
  const product = await (
    await Product.findById(req.query.id)
  ).populate("reviews.user", "_id username");

  if (!product) {
    return res.status(404).json("Product not found");
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

//DELETE REVIEWS

router.delete("/delete/review/:id", verifyToken, async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json("Product not found");
  }

  if (!req.query.reviewId) {
    return res.status(404).json("ReviewId not found");
  }
  const reviews = product.reviews.filter(
    (rev) => rev.id.toString() !== req.query.reviewId.toString()
  );
  const currentReview = product.reviews.find(
    (rev) => rev.id === req.query.reviewId
  );

  if (
    (currentReview && req.user.id === currentReview.user._id.toString()) ||
    req.user.isAdmin === true
  ) {
    let ratings = 0;
    const numOfReviews = reviews.length;
    console.log(req.user.isAdmin);
    let avg = 0;
    reviews.forEach((rev) => {
      avg = avg + rev.rating;
    });

    if (reviews.length === 0) {
      ratings = reviews.length;
    } else {
      ratings = avg / reviews.length;
    }
    await Product.findByIdAndUpdate(
      req.params.id,
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
  } else {
    res.status(403).json("You are not allowed to do that!");
  }
});

module.exports = router;
