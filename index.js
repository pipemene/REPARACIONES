import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cargar usuarios
const usersPath = path.join(__dirname, 'users.json');
let users = [];
if (fs.existsSync(usersPath)) {
  users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
}

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, username: user.username, role: user.role });
  } else {
    res.json({ success: false });
  }
});

// GET órdenes desde CSV publicado
app.get('/api/ordenes', async (req, res) => {
  try {
    const SHEET_CSV = process.env.SHEET_CSV;
    const resp = await fetch(SHEET_CSV);
    const text = await resp.text();

    const lines = text.split('\n').filter(l => l.trim() !== '');
    const data = lines.slice(1).map(row => {
      const cols = row.split(',');
      return {
        radicado: cols[0],
        fecha: cols[1],
        inquilino: cols[2],
        tecnico: cols[3],
        estado: cols[4]
      };
    });

    res.json({ ok: true, data });
  } catch (err) {
    console.error("❌ Error leyendo Google Sheets:", err);
    res.status(500).json({ ok: false, error: "Error al leer órdenes" });
  }
});

// POST crear orden -> reenvía a Apps Script
app.post('/api/ordenes', async (req, res) => {
  try {
    const GSCRIPT_URL = process.env.GSCRIPT_URL;
    const resp = await fetch(GSCRIPT_URL, {
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
