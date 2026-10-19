const express = require("express");
const { pool } = require("../db");
const { autenticar, requiereRol } = require("../middleware/auth");

const router = express.Router();
router.use(autenticar);

// Un cliente solo puede acceder a sus propias mascotas.
async function verificarAcceso(req, res, next) {
  if (req.usuario.rol !== "cliente") return next();
  const { rows } = await pool.query("SELECT tutor_id FROM mascotas WHERE id = $1", [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: "Mascota no encontrada" });
  if (rows[0].tutor_id !== req.usuario.sub) {
    return res.status(403).json({ error: "No tiene acceso a esta mascota" });
  }
  next();
}

// GET /mascotas  (lista; clientes solo ven las suyas)
router.get("/", async (req, res) => {
  try {
    let sql =
      "SELECT m.*, u.nombre AS tutor_nombre FROM mascotas m JOIN usuarios u ON u.id = m.tutor_id WHERE m.activa = TRUE";
    const params = [];
    if (req.usuario.rol === "cliente") {
      params.push(req.usuario.sub);
      sql += ` AND m.tutor_id = $${params.length}`;
    }
    sql += " ORDER BY m.nombre";
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error al listar mascotas", detalle: e.message });
  }
});

// GET /mascotas/buscar?q=...
router.get("/buscar", async (req, res) => {
  const q = req.query.q || "";
  try {
    // [DEFECTO-SEC-01] Término de búsqueda concatenado dentro de la consulta SQL.
    const sql =
      "SELECT id, nombre, especie, raza FROM mascotas WHERE activa = TRUE AND nombre ILIKE '%" +
      q +
      "%' ORDER BY nombre LIMIT 50";
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error en la búsqueda", detalle: e.message });
  }
});

// GET /mascotas/:id
router.get("/:id", verificarAcceso, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, u.nombre AS tutor_nombre, u.email AS tutor_email
       FROM mascotas m JOIN usuarios u ON u.id = m.tutor_id WHERE m.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Mascota no encontrada" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Error", detalle: e.message });
  }
});

// GET /mascotas/:id/historial  (atenciones y vacunas)
router.get("/:id/historial", verificarAcceso, async (req, res) => {
  try {
    const atenciones = await pool.query(
      "SELECT * FROM atenciones WHERE mascota_id = $1 ORDER BY fecha DESC",
      [req.params.id]
    );
    const vacunas = await pool.query(
      "SELECT * FROM vacunas WHERE mascota_id = $1 ORDER BY fecha_aplicacion DESC",
      [req.params.id]
    );
    res.json({ atenciones: atenciones.rows, vacunas: vacunas.rows });
  } catch (e) {
    res.status(500).json({ error: "Error", detalle: e.message });
  }
});

// POST /mascotas
router.post("/", async (req, res) => {
  const { nombre, especie, raza, sexo, fecha_nacimiento, peso_kg, microchip, observaciones } =
    req.body || {};
  let { tutor_id } = req.body || {};
  if (!nombre || !especie) {
    return res.status(400).json({ error: "Nombre y especie son obligatorios" });
  }
  // Un cliente solo puede crear mascotas a su nombre.
  if (req.usuario.rol === "cliente") tutor_id = req.usuario.sub;
  if (!tutor_id) return res.status(400).json({ error: "tutor_id es obligatorio" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO mascotas (tutor_id, nombre, especie, raza, sexo, fecha_nacimiento, peso_kg, microchip, observaciones)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [tutor_id, nombre, especie, raza || null, sexo || null, fecha_nacimiento || null,
       peso_kg || null, microchip || null, observaciones || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "No se pudo crear la mascota", detalle: e.message });
  }
});

// PUT /mascotas/:id
router.put("/:id", verificarAcceso, async (req, res) => {
  const campos = ["nombre", "especie", "raza", "sexo", "fecha_nacimiento", "peso_kg", "microchip", "observaciones"];
  const sets = [];
  const params = [];
  campos.forEach((c) => {
    if (req.body[c] !== undefined) {
      params.push(req.body[c]);
      sets.push(`${c} = $${params.length}`);
    }
  });
  if (sets.length === 0) return res.status(400).json({ error: "Nada que actualizar" });
  params.push(req.params.id);
  try {
    const { rows } = await pool.query(
      `UPDATE mascotas SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (rows.length === 0) return res.status(404).json({ error: "Mascota no encontrada" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "No se pudo actualizar", detalle: e.message });
  }
});

// DELETE /mascotas/:id  (baja lógica; solo personal)
router.delete("/:id", requiereRol("admin", "veterinario", "recepcionista"), async (req, res) => {
  try {
    const { rowCount } = await pool.query("UPDATE mascotas SET activa = FALSE WHERE id = $1", [
      req.params.id,
    ]);
    if (rowCount === 0) return res.status(404).json({ error: "Mascota no encontrada" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "No se pudo eliminar", detalle: e.message });
  }
});

module.exports = router;
