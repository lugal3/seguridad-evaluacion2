// Configuración central de la API HuellitasVet
module.exports = {
  port: process.env.PORT || 4000,
  // [DEFECTO-SEC-08] Secreto JWT embebido como valor por defecto.
  jwtSecret: process.env.JWT_SECRET || "huellitas-dev-secret",
  // Horario de atención de la clínica (para validar agendamiento)
  horario: { aperturaHora: 9, cierreHora: 19 },
  ivaTasa: 0.19,
  uploadsDir: require("path").join(__dirname, "..", "uploads"),
};
