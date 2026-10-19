const express = require("express");
const { pool } = require("../db");
const { autenticar, requiereRol } = require("../middleware/auth");
const { md5 } = require("./auth");

const router = express.Router();
router.use(autenticar);

// GET /usuarios  (personal; listado de usuarios)
router.get("/", requiereRol("admin", "recepcionista"), async (req, res) => {
  const { rol } = req.query;
  const params = [];
  let sql =
    "SELECT id, rut, nombre, email, telefono, rol, especialidad, activo, creado_en FROM usuarios";
  if (rol) {
    params.push(rol);
    sql += ` WHERE rol = $${params.length}`;
  }
  sql += " ORDER BY nombre LIMIT 1000";
  try {
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error", detalle: e.message });
  }
});

// GET /usuarios/veterinarios  (público para agendar)
router.get("/veterinarios", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, nombre, especialidad FROM usuarios WHERE rol = 'veterinario' AND activo = TRUE ORDER BY nombre"
  );
  res.json(rows);
});

// PUT /usuarios/perfil  (el usuario edita sus propios datos)
router.put("/perfil", async (req, res) => {
  const id = req.usuario.sub;
  const editables = ["nombre", "telefono", "direccion", "password"];
  const sets = [];
  const params = [];
  for (const [k, v] of Object.entries(req.body || {})) {
    if (!editables.includes(k)) continue;
    params.push(k === "password" ? md5(String(v)) : v);
    const col = k === "password" ? "password_hash" : k;
    sets.push(`${col} = $${params.length}`);
  }
  if (sets.length === 0) return res.status(400).json({ error: "Nada que actualizar" });
  params.push(id);
  try {
    const { rows } = await pool.query(
      `UPDATE usuarios SET ${sets.join(", ")} WHERE id = $${params.length}
       RETURNING id, nombre, email, rol`,
      params
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "No se pudo actualizar el perfil", detalle: e.message });
  }
});

// POST /usuarios  (admin crea personal)
router.post("/", requiereRol("admin"), async (req, res) => {
  const { rut, nombre, email, telefono, password, rol, especialidad } = req.body || {};
  if (!rut || !nombre || !email || !password || !rol) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO usuarios (rut, nombre, email, telefono, password_hash, rol, especialidad)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, nombre, email, rol`,
      [rut, nombre, email, telefono || null, md5(password), rol, especialidad || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "No se pudo crear el usuario", detalle: e.message });
  }
});

// DELETE /usuarios/:id  (admin desactiva)
router.delete("/:id", requiereRol("admin"), async (req, res) => {
  try {
    const { rowCount } = await pool.query("UPDATE usuarios SET activo = FALSE WHERE id = $1", [
      req.params.id,
    ]);
    if (rowCount === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Error", detalle: e.message });
  }
});

module.exports = router;
