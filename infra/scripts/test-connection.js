require("dotenv").config();
const { Client } = require("pg");

async function testConnection() {
  const client = new Client({
    host: process.env.POSTGRES_HOST || "localhost",
    port: process.env.POSTGRES_PORT || 5430,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  });

  try {
    console.log("Attempting to connect to database...");
    console.log("Config:", {
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
    });

    await client.connect();
    console.log("✅ Successfully connected to PostgreSQL!");

    const result = await client.query("SELECT version()");
    console.log("Database version:", result.rows[0].version);
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    console.error("Full error:", error);
  } finally {
    await client.end();
  }
}

testConnection();
