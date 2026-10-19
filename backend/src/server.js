require("dotenv").config();
const app = require("./app");
const config = require("./config");

app.listen(config.port, () => {
  console.log(`HuellitasVet API escuchando en el puerto ${config.port}`);
  console.log(`Documentación: http://localhost:${config.port}/docs`);
});
