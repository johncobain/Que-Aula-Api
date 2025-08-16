require("dotenv").config();
const { execSync } = require("child_process");

console.log("🚀 Running production migrations...");
console.log("Database URL:", process.env.DATABASE_URL ? "Set" : "Not set");

try {
  execSync("npx node-pg-migrate up", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
    },
  });

  console.log("✅ Migrations completed successfully!");
} catch (error) {
  console.error("❌ Migration failed:", error.message);
  process.exit(1);
}
