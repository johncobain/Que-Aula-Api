const express = require("express");
const controller = require("../controllers/flowchart");

const router = express.Router();

router.get("/", controller.list);
router.get("/:classFlowchartName", controller.get);

module.exports = router;
