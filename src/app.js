if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const { version } = require("../package.json");

const classesRouter = require("./routes/classes");
const flowchartRouter = require("./routes/flowchart");
const migrationsRouter = require("./routes/migrations");

const app = express();

// Middleware for CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Que Aula API is running!",
    version: version,
    lastUpdate: new Date().toLocaleString("en-US", {
      timeZone: "America/Sao_Paulo",
    }),
    architecture: {
      database: "PostgreSQL (Neon)",
      fallback: "JSON files",
      deployment: "Vercel Serverless",
    },
    endpoints: {
      classes: "/classes (GET, POST, PUT, PATCH, DELETE)",
      flowchart: "/flowchart (GET)",
      migrations: "/migrations (GET, POST)",
    },
    guideUrl: "https://github.com/johncobain/Que-Aula-Api/blob/main/GUIDE.md",
  });
});

app.use("/classes", classesRouter);
app.use("/flowchart", flowchartRouter);
app.use("/migrations", migrationsRouter);

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports = app;
