const express = require('express');
const router = express.Router();
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Intentar leer desde variable o config.json
let SHEETS_API_URL = process.env.SHEETS_API_URL;
if (!SHEETS_API_URL) {
  const configPath = path.join(__dirname, '../config.json');
  if (fs.existsSync(configPath)) {
    const config = require(configPath);
    SHEETS_API_URL = config.sheetsApiUrl;
  }
}
if (!SHEETS_API_URL) {
  console.error("❌ No se encontró SHEETS_API_URL ni en variables ni en config.json");
}

// Listar órdenes
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(SHEETS_API_URL + '?action=getOrdenes');
    const data = response.data;
    res.render('ordenes', { ordenes: data.ordenes || data, tecnicos: data.tecnicos || [] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar órdenes');
  }
});

// Actualizar estado/técnico
router.put('/:id/update', async (req, res) => {
  try {
    const { tecnicoId, estado } = req.body;
    const response = await axios.get(SHEETS_API_URL, {
      params: {
        action: 'updateOrden',
        radicado: req.params.id,
        tecnico: tecnicoId,
        estado: estado
      }
    });
    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// Finalizar orden
router.post('/:id/finalizar', async (req, res) => {
  const { id } = req.params;
  const { observaciones, fotos, firma } = req.body;
  try {
    const response = await axios.post(SHEETS_API_URL, null, {
      params: {
        action: 'finalizarOrden',
        radicado: id,
        observaciones,
        fotos: JSON.stringify(fotos || []),
        firma
      }
    });
    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error al finalizar la orden' });
  }
});

module.exports = router;
