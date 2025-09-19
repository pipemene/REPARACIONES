import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ================= JWT Middleware =================
function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bluehome2025');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
}

// ================= Google Sheets Config =================
const SHEETS_CSV_URL = process.env.SHEETS_CSV_URL;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'];

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
  },
  scopes: SCOPES,
});

// Simulación: leer CSV publicado (GET)
app.get('/api/ordenes', authMiddleware, async (req, res) => {
  try {
    const resp = await fetch(SHEETS_CSV_URL);
    const text = await resp.text();
    const rows = text.trim().split('\n').map(r => r.split(','));
    const headers = rows[0];
    const data = rows.slice(1).map(r => Object.fromEntries(headers.map((h,i)=>[h,r[i]])));
    res.json({ ok: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error leyendo Google Sheets' });
  }
});

// Login (usuarios planos)
const usersPath = path.join(__dirname, 'data/users.json');
let users = [];
try {
  users = JSON.parse(fs.readFileSync(usersPath));
  console.log("✅ Usuarios cargados desde users.json:", users.map(u => `${u.username} (${u.role})`));
} catch (err) {
  console.error("❌ Error cargando users.json:", err.message);
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
  const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET || 'bluehome2025', { expiresIn: '7d' });
  res.json({ token, role: user.role, username: user.username });
});

app.get('/api/user', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Status
app.get('/status', (req, res) => res.json({ ok: true, mensaje: "Servidor activo 🚀" }));

// Ruta raíz -> login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
