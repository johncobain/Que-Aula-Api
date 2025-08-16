const express = require("express");
const migrator = require("../../models/migrator");

const router = express.Router();

router.get("/", getHandler);
router.post("/", postHandler);

async function getHandler(request, response) {
  try {
    const pendingMigrations = await migrator.listPendingMigrations();
    return response.status(200).json(pendingMigrations);
  } catch (error) {
    console.error("Error listing migrations:", error);
    return response.status(500).json({ error: "Failed to list migrations" });
  }
}

async function postHandler(request, response) {
  try {
    const migratedMigrations = await migrator.runPendingMigrations();

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }
    return response.status(200).json(migratedMigrations);
  } catch (error) {
    console.error("Error running migrations:", error);
    return response.status(500).json({ error: "Failed to run migrations" });
  }
}

module.exports = router;
