const express = require("express");
const morgan = require("morgan");
const { default: helmet } = require("helmet");
const app = express();
const dotenv = require("dotenv").config;
const cloudinary = require("cloudinary");
const paymentRoute = require("./routes/payment");
const userRoute = require("./routes/user");
const authRoute = require("./routes/auth");
const productRoute = require("./routes/product");
const cartRoute = require("./routes/cart");
const orderRoute = require("./routes/order");
const bodyParser = require("body-parser");
const sizeRoute = require("./routes/size");
const colorRoute = require("./routes/color");
const variantsRoute = require("./routes/variants");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");

app.use(morgan("dev"));
app.use(helmet());
app.use(cors({ credentials: true, origin: true }));
app.use(compression());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//connect mongoose
require("./src/dbs/init.mongodb");

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/products", productRoute);
app.use("/api/carts", cartRoute);
app.use("/api/orders", orderRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/size", sizeRoute);
app.use("/api/color", colorRoute);
app.use("/api/variants", variantsRoute);

module.exports = app;
