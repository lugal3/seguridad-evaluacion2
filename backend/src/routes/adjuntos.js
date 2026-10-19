const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const { pool } = require("../db");
const { autenticar } = require("../middleware/auth");
const config = require("../config");

const router = express.Router();
router.use(autenticar);

const destino = path.join(config.uploadsDir, "adjuntos");
fs.mkdirSync(destino, { recursive: true });

// [DEFECTO-SEC-06] No se valida el tipo ni el tamaño del archivo subido.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, destino),
  filename: (req, file, cb) =>
    cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()),
});
const upload = multer({ storage });

// POST /adjuntos  (form-data: mascota_id, file)
router.post("/", upload.single("file"), async (req, res) => {
  const { mascota_id } = req.body || {};
  if (!mascota_id || !req.file) {
    return res.status(400).json({ error: "mascota_id y file son obligatorios" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO adjuntos (mascota_id, nombre_original, archivo, mime, tamano_bytes, subido_por)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [mascota_id, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size, req.usuario.sub]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "No se pudo guardar el adjunto", detalle: e.message });
  }
});

// GET /adjuntos/mascota/:mascotaId
router.get("/mascota/:mascotaId", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM adjuntos WHERE mascota_id = $1 ORDER BY creado_en DESC",
    [req.params.mascotaId]
  );
  res.json(rows);
});

// GET /adjuntos/:id/descargar
router.get("/:id/descargar", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM adjuntos WHERE id = $1", [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: "Adjunto no encontrado" });
  const ruta = path.join(destino, path.basename(rows[0].archivo));
  res.download(ruta, rows[0].nombre_original);
});

module.exports = router;
