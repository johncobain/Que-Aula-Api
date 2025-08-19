require("dotenv").config();
const database = require("../database");

async function cleanDatabase() {
  let client;

  try {
    client = await database.getNewClient();

    await client.query("BEGIN");

    await client.query("DELETE FROM class_schedules");
    await client.query("DELETE FROM class_groups");
    await client.query("DELETE FROM subjects");
    await client.query("DELETE FROM teachers");
    await client.query("DELETE FROM classrooms");

    console.log("✅ Cleared existing data");

    await client.query("COMMIT");
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    console.error("❌ Cleaning failed:", error);
    throw error;
  } finally {
    if (client) {
      await client.end();
    }
  }
}

if (require.main === module) {
  cleanDatabase().catch(console.error);
}

module.exports = cleanDatabase;
