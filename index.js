import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET órdenes (placeholder: deberías reemplazar con lectura de tu sheet)
app.get('/api/ordenes', async (req, res) => {
  try {
    res.json({ ok: true, data: [] });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Error al cargar órdenes" });
  }
});

// POST crear orden -> reenvía al Apps Script
app.post('/api/ordenes', async (req, res) => {
  try {
    const scriptUrl = process.env.GSCRIPT_URL; // URL de tu Apps Script publicado como API
    const resp = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Error enviando orden a Google Sheets:", err);
    res.status(500).json({ ok: false, error: "Error creando orden" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
