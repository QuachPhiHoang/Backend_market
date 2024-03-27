const router = require("express").Router();
const Size = require("../models/Size");

const {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
} = require("./verifyToken");

//CREATE
router.post("/create", verifyTokenAndAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    const newSize = await Size.create({
      name,
    });
    res.status(200).json({
      success: true,
      newSize,
    });
  } catch (err) {
    return res.status(500).json({ message: "Size already!" });
  }
});
//GETALL

router.get("/all", async (req, res) => {
  try {
    const sizes = await Size.find();
    res.status(200).json({
      success: true,
      sizes,
    });
  } catch (error) {
    return res.status(500).json(error);
  }
});
//DELETE
router.delete("/delete/:id", verifyTokenAndAdmin, async (req, res, next) => {
  try {
    const size = await Size.findByIdAndDelete(req.params.id);
    if (!size) {
      return next("Size not found", 404);
    }

    await size.remove();
    res
      .status(200)
      .json({ success: true, message: "Size has been deleted..." });
  } catch (err) {
    return res.status(500).json(err);
  }
});

//UPDATE
router.put("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const isDuplicate = await Size.exists({
      name: req.body.name,
    });
    if (isDuplicate) {
      return res.status(500).json({ message: "kích thước đã tồn tại" });
    }
    const updateSize = await Size.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    return res.status(200).json({ success: true, updateSize });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
