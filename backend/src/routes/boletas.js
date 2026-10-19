const express = require("express");
const { pool } = require("../db");
const { autenticar, requiereRol } = require("../middleware/auth");
const config = require("../config");

const router = express.Router();
router.use(autenticar);

// GET /boletas
router.get("/", requiereRol("admin", "recepcionista"), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, c.fecha_hora, m.nombre AS mascota_nombre
       FROM boletas b JOIN citas c ON c.id = b.cita_id
       JOIN mascotas m ON m.id = c.mascota_id
       ORDER BY b.creado_en DESC LIMIT 500`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error", detalle: e.message });
  }
});

// POST /boletas  { cita_id, descuento_porcentaje, metodo_pago }
router.post("/", requiereRol("admin", "recepcionista"), async (req, res) => {
  const { cita_id, descuento_porcentaje, metodo_pago } = req.body || {};
  if (!cita_id) return res.status(400).json({ error: "cita_id es obligatorio" });
  try {
    const cita = await pool.query(
      `SELECT c.id, s.precio FROM citas c JOIN servicios s ON s.id = c.servicio_id WHERE c.id = $1`,
      [cita_id]
    );
    if (cita.rows.length === 0) return res.status(404).json({ error: "Cita no encontrada" });

    const precio = cita.rows[0].precio;
    const pct = Number(descuento_porcentaje) || 0;

    // [DEFECTO-FUNC-02] El descuento no se valida: un porcentaje > 100 produce
    // un subtotal negativo, y el total final puede quedar por debajo de cero.
    const descuento = Math.round((precio * pct) / 100);
    const subtotal = precio - descuento;

    // [DEFECTO-FUNC-03] El IVA se calcula sobre el precio sin descuento,
    // por lo que el total no corresponde al neto cobrado.
    const iva = Math.round(precio * config.ivaTasa);
    const total = subtotal + iva;

    const { rows } = await pool.query(
      `INSERT INTO boletas (cita_id, subtotal, descuento, iva, total, metodo_pago, pagada, emitida_por)
       VALUES ($1,$2,$3,$4,$5,$6,TRUE,$7) RETURNING *`,
      [cita_id, subtotal, descuento, iva, total, metodo_pago || "efectivo", req.usuario.sub]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "No se pudo emitir la boleta", detalle: e.message });
  }
});

// GET /boletas/resumen  (ingresos del día)
router.get("/resumen", requiereRol("admin", "recepcionista"), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS emitidas, COALESCE(SUM(total),0)::int AS ingresos
       FROM boletas WHERE creado_en::date = CURRENT_DATE`
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Error", detalle: e.message });
  }
});

module.exports = router;
