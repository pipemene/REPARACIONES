const express = require('express');
const router = express.Router();
const axios = require('axios');

const SHEETS_API_URL = process.env.SHEETS_API_URL;

// Listar órdenes
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(SHEETS_API_URL + '?action=getOrdenes');
    const data = response.data;
    res.render('ordenes', { ordenes: data.ordenes, tecnicos: data.tecnicos });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar órdenes');
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