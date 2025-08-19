const express = require("express");
const controller = require("../controllers/classes");

const router = express.Router();

router.get("/", controller.list);
router.get("/:className", controller.get);
router.post("/", controller.create);
router.delete("/:className", controller.delete);

module.exports = router;
