const Order = require("../models/Order");
const Product = require("../models/Product");

const { verifyToken, verifyTokenAndAdmin } = require("./verifyToken");

const router = require("express").Router();

//CREATE ORDER

router.post("/new", verifyToken, async (req, res) => {
  const {
    shippingInfo,
    orderItem,
    paymentInfo,
    itemsPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  const newOrder = new Order({
    shippingInfo,
    orderItem,
    paymentInfo,
    itemsPrice,
    shippingPrice,
    totalPrice,
    paidAt: Date.now(),
    user: req.user.id,
  });
  newOrder.user = req.user.id;

  try {
    const savedOrder = await newOrder.save();
    return res.status(200).json({ success: true, order: savedOrder });
  } catch (err) {
    return res.status(500).json(err);
  }
});

//GET LOGGER IN USER ORDER

router.get("/my-order", verifyToken, async (req, res) => {
  const myOrder = await Order.find({ user: req.user.id });

  if (!myOrder) {
    return res.status(404).json("Not found order!!!");
  }
  const currentMyOrder = myOrder.filter((ord) => ord.user.id === req.user.id);

  if (currentMyOrder) {
    return res.status(200).json({
      success: true,
      orders: myOrder,
    });
  } else {
    return res.status(403).json("You are not allowed to do that!");
  }
});

//GET SINGLE ORDER

router.get("/:id", verifyToken, async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "username email"
  );

  if (!order) {
    return res.status(404).json("Not found order!!!");
  }

  if (req.user.id === order.user.id || req.user.isAdmin) {
    return res.status(200).json({
      success: true,
      order,
    });
  } else {
    return res.status(403).json("You are not allowed to do that!");
  }
});

//GET ALL ORDER -- ADMIN

router.get("/", verifyTokenAndAdmin, async (req, res) => {
  const orders = await Order.find();

  let totalAmount = 0;

  orders.forEach((order) => {
    totalAmount += order.totalPrice;
  });

  return res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

//UPDATE ORDER STATUS
router.put("/:id", verifyTokenAndAdmin, async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order.orderStatus === "Delivered") {
    return res.status(400).json({
      success: false,
      message: "you have already delivered this product",
    });
  }

  order.orderItem.forEach(async (item) => {
    await updateStock(item.product, item.quantity);
  });

  order.orderStatus = req.body.status;
  if (req.body.status === "Delivered") {
    order.deliveryAt = Date.now();
  }

  await order.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    order,
  });
});

async function updateStock(id, quantity) {
  const product = await Product.findById(id);
  product.stock -= quantity;

  product.save({ validateBeforeSave: false });
}

//DELETE ORDER -- ADMIN

router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json("Not found order!!!");
  }

  await order.remove();
  return res.status(200).json({
    success: true,
  });
});

//GET MONTHLY INCOME--ADMIN

router.get("/income", verifyTokenAndAdmin, async (req, res) => {
  const date = new Date();
  const lastMonth = new Date(date.setMonth(date.getMonth() - 1));
  const previousMonth = new Date(new Date().setMonth(lastMonth.getMonth() - 1));
  try {
    const income = await Order.aggregate([
      { $match: { createdAt: { $gte: previousMonth } } },
      {
        $project: {
          month: { $month: "$createdAt" },
          sales: "$amount",
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: "$sales" },
        },
      },
    ]);
    return res.status(200).json({ income });
  } catch (err) {
    return res.status(500).json(err);
  }
});

module.exports = router;
