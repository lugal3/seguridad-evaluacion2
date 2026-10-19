const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");

const app = express();
// [DEFECTO-SEC-05] No se configuran cabeceras de seguridad (CSP, X-Frame-Options,
// X-Content-Type-Options...) y Express anuncia su versión con X-Powered-By.

// [DEFECTO-SEC-04] CORS totalmente abierto: cualquier origen puede llamar a la API.
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Rutas
app.use("/autenticacion", require("./routes/auth"));
app.use("/usuarios", require("./routes/usuarios"));
app.use("/mascotas", require("./routes/mascotas"));
app.use("/servicios", require("./routes/servicios"));
app.use("/citas", require("./routes/citas"));
app.use("/boletas", require("./routes/boletas"));
app.use("/adjuntos", require("./routes/adjuntos"));
app.use("/reportes", require("./routes/reportes"));

// Documentación OpenAPI
const openapi = require("./openapi.json");
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));
app.get("/openapi.json", (_req, res) => res.json(openapi));

app.get("/", (_req, res) => {
  res.json({ name: "HuellitasVet API", status: "ok", version: "1.0.0" });
});
app.get("/salud", (_req, res) => res.json({ status: "ok" }));

// Manejador de errores final
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno", detalle: err.message });
});

module.exports = app;
