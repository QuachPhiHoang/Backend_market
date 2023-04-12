const router = require("express").Router();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
} = require("./verifyToken");

router.post("/process", verifyToken, async (req, res, next) => {
  console.log("req", req.params);
  try {
    const myPayment = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "USD",
      metadata: {
        company: "Ecommerce",
      },
    });
    return res
      .status(200)
      .json({ success: true, client_secret: myPayment.client_secret });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
});

router.get("/stripeapikey", verifyToken, async (req, res, next) => {
  try {
    return res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
  } catch (error) {
    return res.status(500).json({ error });
  }
});

module.exports = router;
