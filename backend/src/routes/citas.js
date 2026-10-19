const express = require("express");
const { pool } = require("../db");
const { autenticar, requiereRol } = require("../middleware/auth");
const config = require("../config");

const router = express.Router();
router.use(autenticar);

// GET /citas  (filtros: estado, veterinario_id, desde, hasta)
router.get("/", async (req, res) => {
  const { estado, veterinario_id, desde, hasta } = req.query;
  const where = [];
  const params = [];
  if (estado) { params.push(estado); where.push(`c.estado = $${params.length}`); }
  if (veterinario_id) { params.push(veterinario_id); where.push(`c.veterinario_id = $${params.length}`); }
  if (desde) { params.push(desde); where.push(`c.fecha_hora >= $${params.length}`); }
  if (hasta) { params.push(hasta); where.push(`c.fecha_hora <= $${params.length}`); }
  // Un cliente solo ve las citas de sus mascotas.
  if (req.usuario.rol === "cliente") {
    params.push(req.usuario.sub);
    where.push(`m.tutor_id = $${params.length}`);
  }
  const sql = `
    SELECT c.*, m.nombre AS mascota_nombre, s.nombre AS servicio_nombre,
           v.nombre AS veterinario_nombre
    FROM citas c
    JOIN mascotas m ON m.id = c.mascota_id
    JOIN servicios s ON s.id = c.servicio_id
    JOIN usuarios v ON v.id = c.veterinario_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY c.fecha_hora DESC LIMIT 500`;
  try {
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error al listar citas", detalle: e.message });
  }
});

// POST /citas  (agendar)
router.post("/", async (req, res) => {
  const { mascota_id, veterinario_id, servicio_id, fecha_hora, motivo } = req.body || {};
  if (!mascota_id || !veterinario_id || !servicio_id || !fecha_hora) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  const cuando = new Date(fecha_hora);
  if (isNaN(cuando.getTime())) {
    return res.status(400).json({ error: "fecha_hora inválida" });
  }
  // Regla: dentro del horario de atención de la clínica.
  const hora = cuando.getHours();
  if (hora < config.horario.aperturaHora || hora >= config.horario.cierreHora) {
    return res.status(400).json({
      error: `La clínica atiende entre las ${config.horario.aperturaHora}:00 y las ${config.horario.cierreHora}:00`,
    });
  }
  try {
    // [DEFECTO-FUNC-01] No se comprueba si el veterinario ya tiene una cita
    // a la misma hora: se permite sobrecupo (doble reserva).
    const { rows } = await pool.query(
      `INSERT INTO citas (mascota_id, veterinario_id, servicio_id, fecha_hora, motivo, creado_por, estado)
       VALUES ($1,$2,$3,$4,$5,$6,'agendada') RETURNING *`,
      [mascota_id, veterinario_id, servicio_id, fecha_hora, motivo || null, req.usuario.sub]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "No se pudo agendar", detalle: e.message });
  }
});

// PUT /citas/:id/estado
router.put("/:id/estado", requiereRol("admin", "veterinario", "recepcionista"), async (req, res) => {
  const { estado } = req.body || {};
  const validos = ["agendada", "confirmada", "atendida", "cancelada"];
  if (!validos.includes(estado)) {
    return res.status(400).json({ error: "Estado inválido" });
  }
  try {
    const { rows } = await pool.query(
      "UPDATE citas SET estado = $1 WHERE id = $2 RETURNING *",
      [estado, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Cita no encontrada" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Error", detalle: e.message });
  }
});

// DELETE /citas/:id  (cancelar)
router.delete("/:id", async (req, res) => {
  try {
    if (req.usuario.rol === "cliente") {
      const own = await pool.query(
        "SELECT 1 FROM citas c JOIN mascotas m ON m.id = c.mascota_id WHERE c.id = $1 AND m.tutor_id = $2",
        [req.params.id, req.usuario.sub]
      );
      if (own.rows.length === 0) return res.status(404).json({ error: "Cita no encontrada" });
    }
    const { rows } = await pool.query(
      "UPDATE citas SET estado = 'cancelada' WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Cita no encontrada" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Error", detalle: e.message });
  }
});

module.exports = router;
