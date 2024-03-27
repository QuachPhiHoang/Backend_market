const router = require("express").Router();
const Color = require("../models/Color");

const {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
} = require("./verifyToken");

router.post("/create", verifyTokenAndAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    const newColor = await Color.create({
      name,
    });
    res.status(200).json({
      success: true,
      newColor,
    });
  } catch (err) {
    return res.status(500).json({ message: "Color already!" });
  }
});
//GETALL

router.get("/all", async (req, res) => {
  try {
    const colors = await Color.find();
    res.status(200).json({
      success: true,
      colors,
    });
  } catch (error) {
    return res.status(500).json(error);
  }
});
//DELETE
router.delete("/delete/:id", verifyTokenAndAdmin, async (req, res, next) => {
  try {
    const color = await Color.findByIdAndDelete(req.params.id);
    if (!color) {
      return next("Color not found", 404);
    }

    await color.remove();
    res
      .status(200)
      .json({ success: true, message: "Color has been deleted..." });
  } catch (err) {
    return res.status(500).json(err);
  }
});

//UPDATE
router.put("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const isDuplicate = await Color.exists({
      name: req.body.name,
    });
    if (isDuplicate) {
      return res.status(500).json({ message: "Màu sắc đã tồn tại" });
    }
    const updateColor = await Color.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    return res.status(200).json({ success: true, updateColor });
  } catch (err) {
    res.status(500).json(err);
  }
});
module.exports = router;
