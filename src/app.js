const express = require("express");

const classesRouter = require("./routes/classes");
const flowchartRouter = require("./routes/flowchart");

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
    endpoints: {
      classes: "/classes",
      flowchart: "/flowchart",
    },
  });
});

app.use("/classes", classesRouter);
app.use("/flowchart", flowchartRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Servidor escutando na porta ${PORT}`));

module.exports = app;
