const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

const SHEETS_API_URL = process.env.SHEETS_API_URL;

// Listar órdenes
router.get("/", async (req, res) => {
  try {
    const respOrdenes = await fetch(`${SHEETS_API_URL}?action=getOrdenes`);
    const ordenes = await respOrdenes.json();

    const respTecnicos = await fetch(`${SHEETS_API_URL}?action=getTecnicos`);
    const tecnicos = await respTecnicos.json();

    res.render("ordenes", { ordenes, tecnicos });
  } catch (err) {
    console.error(err);
    res.render("ordenes", { ordenes: [], tecnicos: [] });
  }
});

// Actualizar orden
router.put("/:id/update", async (req, res) => {
  const { id } = req.params;
  const { tecnicoId, estado } = req.body;

  try {
    const response = await fetch(`${SHEETS_API_URL}?action=updateOrden`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, tecnicoId, estado })
    });

    if (!response.ok) throw new Error("Error al actualizar en Sheets");

    res.status(200).json({ message: "Orden actualizada en Google Sheets" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en la actualización" });
  }
});

module.exports = router;
