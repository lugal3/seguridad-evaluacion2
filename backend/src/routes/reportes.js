const express = require("express");
const { pool } = require("../db");
const { autenticar, requiereRol } = require("../middleware/auth");

const router = express.Router();
router.use(autenticar);

// GET /reportes/dashboard  (métricas para la portada del personal)
router.get("/dashboard", requiereRol("admin", "veterinario", "recepcionista"), async (req, res) => {
  try {
    const citasHoy = await pool.query(
      "SELECT COUNT(*)::int AS n FROM citas WHERE fecha_hora::date = CURRENT_DATE AND estado <> 'cancelada'"
    );
    const mascotas = await pool.query("SELECT COUNT(*)::int AS n FROM mascotas WHERE activa = TRUE");
    const clientes = await pool.query("SELECT COUNT(*)::int AS n FROM usuarios WHERE rol = 'cliente' AND activo = TRUE");
    const ingresosMes = await pool.query(
      "SELECT COALESCE(SUM(total),0)::int AS n FROM boletas WHERE date_trunc('month', creado_en) = date_trunc('month', CURRENT_DATE)"
    );
    res.json({
      citas_hoy: citasHoy.rows[0].n,
      mascotas_activas: mascotas.rows[0].n,
      clientes: clientes.rows[0].n,
      ingresos_mes: ingresosMes.rows[0].n,
    });
  } catch (e) {
    res.status(500).json({ error: "Error", detalle: e.message });
  }
});

// GET /reportes/citas-por-mes
router.get("/citas-por-mes", requiereRol("admin", "veterinario", "recepcionista"), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT to_char(date_trunc('month', fecha_hora), 'YYYY-MM') AS mes,
              COUNT(*)::int AS total
       FROM citas
       WHERE fecha_hora >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY 1 ORDER BY 1`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error", detalle: e.message });
  }
});

// GET /reportes/historico  (listado completo de atenciones; sin paginación)
router.get("/historico", requiereRol("admin", "veterinario", "recepcionista"), async (req, res) => {
  try {
    // [DEFECTO-NF-01] Devuelve todas las atenciones con sus relaciones y sin
    // paginación ni límite: el tiempo de respuesta y el payload crecen sin tope.
    const { rows } = await pool.query(
      `SELECT a.*, m.nombre AS mascota_nombre, u.nombre AS tutor_nombre, v.nombre AS veterinario_nombre
       FROM atenciones a
       JOIN mascotas m ON m.id = a.mascota_id
       JOIN usuarios u ON u.id = m.tutor_id
       JOIN usuarios v ON v.id = a.veterinario_id
       ORDER BY a.fecha DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error", detalle: e.message });
  }
});

module.exports = router;
