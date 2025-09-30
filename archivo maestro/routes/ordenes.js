const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const multer = require("multer");
const path = require("path");

const SHEETS_API_URL = process.env.SHEETS_API_URL;

// Multer config for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Detalle de orden
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const resp = await fetch(`${SHEETS_API_URL}?action=getOrdenes`);
    const ordenes = await resp.json();
    const orden = ordenes.find(o => o.id == id);
    if (!orden) return res.status(404).send("No encontrada");
    res.render("orden_detalle", { orden });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error cargando orden");
  }
});

// Finalizar orden
router.post("/:id/finalizar", upload.array("fotos"), async (req, res) => {
  const { id } = req.params;
  const { observaciones, firma } = req.body;
  const fotosPaths = req.files.map(f => "/uploads/" + f.filename);
  try {
    const response = await fetch(`${SHEETS_API_URL}?action=finalizarOrden`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, observaciones, fotos: fotosPaths, firma })
    });
    if (!response.ok) throw new Error("Error en Sheets");
    res.redirect("/ordenes");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error finalizando orden");
  }
});

module.exports = router;
