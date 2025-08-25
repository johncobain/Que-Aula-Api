const express = require("express");
const controller = require("../controllers/classes");

const router = express.Router();

router.get("/", controller.list);
router.get("/:className", controller.get);
router.post("/", controller.create);
router.put("/:className", controller.update);
router.patch("/:className", controller.update);
router.delete("/:className", controller.delete);

// Administrative routes
router.post("/populate", controller.populate);
router.delete("/clean", controller.clean);

module.exports = router;
