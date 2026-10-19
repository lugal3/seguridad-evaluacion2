const jwt = require("jsonwebtoken");
const config = require("../config");

// Verifica el JWT y adjunta el payload a req.usuario.
function autenticar(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  if (!token) {
    return res.status(401).json({ error: "Falta el token de autenticación" });
  }
  try {
    req.usuario = jwt.verify(token, config.jwtSecret);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// Restringe el acceso a los roles indicados.
function requiereRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: "No tiene permisos para esta acción" });
    }
    next();
  };
}

module.exports = { autenticar, requiereRol };
