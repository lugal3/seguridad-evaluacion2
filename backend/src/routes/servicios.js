const express = require("express");
const { pool } = require("../db");
const { autenticar, requiereRol } = require("../middleware/auth");

const router = express.Router();

// GET /servicios  (público, para la pantalla de agendamiento)
router.get("/", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM servicios WHERE activo = TRUE ORDER BY nombre"
  );
  res.json(rows);
});

// POST /servicios  (admin)
router.post("/", autenticar, requiereRol("admin"), async (req, res) => {
  const { nombre, descripcion, precio, duracion_min } = req.body || {};
  if (!nombre || precio === undefined) {
    return res.status(400).json({ error: "Nombre y precio son obligatorios" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO servicios (nombre, descripcion, precio, duracion_min)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [nombre, descripcion || null, precio, duracion_min || 30]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "No se pudo crear el servicio", detalle: e.message });
  }
});

// PUT /servicios/:id  (admin)
router.put("/:id", autenticar, requiereRol("admin"), async (req, res) => {
  const { nombre, descripcion, precio, duracion_min, activo } = req.body || {};
  try {
    const { rows } = await pool.query(
      `UPDATE servicios SET
         nombre = COALESCE($1, nombre),
         descripcion = COALESCE($2, descripcion),
         precio = COALESCE($3, precio),
         duracion_min = COALESCE($4, duracion_min),
         activo = COALESCE($5, activo)
       WHERE id = $6 RETURNING *`,
      [nombre, descripcion, precio, duracion_min, activo, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Servicio no encontrado" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Error", detalle: e.message });
  }
});

module.exports = router;
