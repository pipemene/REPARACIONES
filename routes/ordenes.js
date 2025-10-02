const express = require("express");
const router = express.Router();
const axios = require("axios");

const SHEETS_API_URL = process.env.SHEETS_API_URL;

if (!SHEETS_API_URL) {
  console.error("❌ No se encontró SHEETS_API_URL en variables de entorno");
}

// 👉 Listar órdenes
router.get("/", async (req, res) => {
  try {
    const response = await axios.get(`${SHEETS_API_URL}?action=getOrdenes`);
    const data = response.data;
    res.render("ordenes", { ordenes: data });
  } catch (err) {
    console.error("❌ Error al cargar órdenes:", err.message);
    res.status(500).send("Error al cargar órdenes");
  }
});

// 👉 Ver detalle de una orden
router.get("/:id", async (req, res) => {
  try {
    const response = await axios.get(`${SHEETS_API_URL}?action=getOrdenes`);
    const data = response.data;
    const orden = data.find(o => o.Radicado === req.params.id);

    if (!orden) {
      return res.status(404).send("Orden no encontrada");
    }

    res.render("orden_detalle", { orden });
  } catch (err) {
    console.error("❌ Error al cargar detalle de orden:", err.message);
    res.status(500).send("Error al cargar detalle de orden");
  }
});

// 👉 Actualizar estado/técnico de una orden
router.put("/:id/update", async (req, res) => {
  try {
    const { tecnicoId, estado } = req.body;
    const response = await axios.get(SHEETS_API_URL, {
      params: {
        action: "updateOrden",
        radicado: req.params.id,
        tecnico: tecnicoId,
        estado: estado,
      },
    });
    res.json(response.data);
  } catch (err) {
    console.error("❌ Error al actualizar orden:", err.message);
    res.status(500).json({ success: false });
  }
});

// 👉 Finalizar orden
router.post("/:id/finalizar", async (req, res) => {
  const { id } = req.params;
  const { observaciones, fotos, firma } = req.body;

  try {
    const response = await axios.post(SHEETS_API_URL, null, {
      params: {
        action: "finalizarOrden",
        radicado: id,
        observaciones,
        fotos: JSON.stringify(fotos || []),
        firma,
      },
    });
    res.json(response.data);
  } catch (err) {
    console.error("❌ Error al finalizar orden:", err.message);
    res.status(500).json({ success: false, error: "Error al finalizar la orden" });
  }
});

module.exports = router;
