const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const config = require("../config");
const { esEmail } = require("../utils/validacion");

const router = express.Router();

// [DEFECTO-SEC-07] Hashing de contraseñas con MD5 sin sal.
function md5(texto) {
  return crypto.createHash("md5").update(texto).digest("hex");
}

// POST /autenticacion/login  { email, password }
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son obligatorios" });
  }
  try {
    const { rows } = await pool.query(
      "SELECT id, nombre, email, rol FROM usuarios WHERE email = $1 AND password_hash = $2 AND activo = TRUE",
      [email, md5(password)]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    const u = rows[0];
    // [DEFECTO-SEC-02] Token sin fecha de expiración.
    const token = jwt.sign(
      { sub: u.id, nombre: u.nombre, email: u.email, rol: u.rol },
      config.jwtSecret
    );
    res.json({ token, usuario: u });
  } catch (e) {
    // [DEFECTO-SEC-03] Se devuelve el detalle del error de la base de datos.
    res.status(500).json({ error: "Error en login", detalle: e.message });
  }
});

// POST /autenticacion/registro  (alta de clientes)
router.post("/registro", async (req, res) => {
  const { rut, nombre, email, telefono, direccion, password } = req.body || {};
  if (!rut || !nombre || !email || !password) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  if (!esEmail(email)) {
    return res.status(400).json({ error: "Email inválido" });
  }
  try {
    const existe = await pool.query("SELECT 1 FROM usuarios WHERE email = $1", [email]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }
    const { rows } = await pool.query(
      `INSERT INTO usuarios (rut, nombre, email, telefono, direccion, password_hash, rol)
       VALUES ($1,$2,$3,$4,$5,$6,'cliente') RETURNING id, nombre, email, rol`,
      [rut, nombre, email, telefono || null, direccion || null, md5(password)]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "No se pudo registrar", detalle: e.message });
  }
});

// GET /autenticacion/perfil
router.get("/perfil", require("../middleware/auth").autenticar, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, rut, nombre, email, telefono, direccion, rol, especialidad, preferencias FROM usuarios WHERE id = $1",
    [req.usuario.sub]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json(rows[0]);
});

module.exports = router;
module.exports.md5 = md5;
