if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");

const classesRouter = require("./routes/classes");
const flowchartRouter = require("./routes/flowchart");
const migrationsRouter = require("./routes/migrations");

const app = express();

// Middleware para CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
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
    message: "Que Aula API está funcionando!",
    version: "1.0.0",
    lastUpdate: new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    }),
    endpoints: {
      classes: "/classes",
      flowchart: "/flowchart",
      info: "/info",
      migrations: "/migrations",
    },
  });
});

app.get("/info", (req, res) => {
  const classes = require("./data/classes.json");
  const flowchart = require("./data/flowchart.json");

  res.status(200).json({
    message: "Informações da API Que Aula",
    stats: {
      totalClasses: classes.length,
      totalFlowchartSemesters: flowchart.length,
      totalFlowchartSubjects: flowchart.flat().filter((item) => item.name)
        .length,
    },
    lastCheck: new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    }),
    guideUrl:
      "https://github.com/johncobain/Que-Aula-Api/blob/main/DADOS-GUIA.md",
  });
});

app.use("/classes", classesRouter);
app.use("/flowchart", flowchartRouter);
app.use("/migrations", migrationsRouter);

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Servidor escutando na porta ${PORT}`));
}

module.exports = app;
