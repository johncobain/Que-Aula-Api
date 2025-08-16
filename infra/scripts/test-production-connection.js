require("dotenv").config();
const { Client } = require("pg");

async function testProductionConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("🔄 Testing production database connection...");

    await client.connect();
    console.log("✅ Successfully connected to Neon database!");

    const result = await client.query("SELECT version()");
    console.log("📊 Database version:", result.rows[0].version);

    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    console.log(
      "📋 Existing tables:",
      tablesResult.rows.map((row) => row.table_name)
    );
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  } finally {
    await client.end();
  }
}

testProductionConnection();
