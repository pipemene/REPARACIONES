import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import fetch from 'node-fetch';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
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
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_ID = process.env.SHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || 'Hoja1';

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

// Obtener todas las órdenes desde Sheets
app.get('/api/ordenes', authMiddleware, async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_NAME,
    });
    const rows = result.data.values;
    if (!rows || rows.length === 0) return res.json({ ok: true, data: [] });
    const headers = rows[0];
    const data = rows.slice(1).map(r => Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])));
    res.json({ ok: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error leyendo Google Sheets' });
  }
});

// Crear nueva orden en Sheets
app.post('/api/ordenes', authMiddleware, async (req, res) => {
  try {
    const { inquilino, telefono, descripcion, tecnico } = req.body;
    const fecha = new Date();
    const dd = String(fecha.getDate()).padStart(2,'0');
    const mm = String(fecha.getMonth()+1).padStart(2,'0');
    const yy = String(fecha.getFullYear()).slice(-2);
    const base = dd+mm+yy;
    const consecutivo = Date.now().toString().slice(-3); // simple consecutivo
    const radicado = base+consecutivo;

    const nuevaFila = [
      radicado,
      fecha.toISOString().split('T')[0],
      inquilino,
      telefono,
      descripcion,
      tecnico || '',
      'Pendiente',
      '',
      ''
    ];

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: SHEET_NAME,
      valueInputOption: 'RAW',
      requestBody: { values: [nuevaFila] }
    });

    res.json({ ok: true, radicado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creando orden en Google Sheets' });
  }
});

// PDF de orden
app.get('/api/ordenes/:radicado/pdf', authMiddleware, async (req, res) => {
  try {
    const radicado = req.params.radicado;
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_NAME,
    });
    const rows = result.data.values;
    const headers = rows[0];
    const data = rows.slice(1).map(r => Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])));
    const orden = data.find(o => o.radicado === radicado);
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=orden_${radicado}.pdf`);
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    doc.pipe(res);

    // Cabecera azul con logo blanco
    doc.rect(0, 0, doc.page.width, 80).fill('#003366');
    const logoPath = path.join(__dirname, 'public', 'logo-white.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, doc.page.width / 2 - 40, 15, { width: 80 });
    }
    doc.fillColor('white').fontSize(16).text('Orden de Trabajo', 50, 30, { align: 'right' });

    doc.moveDown(3).fillColor('black');
    doc.fontSize(12).text(`Radicado: ${orden.radicado}`);
    doc.text(`Fecha: ${orden.fecha}`);
    doc.text(`Inquilino: ${orden.inquilino}`);
    doc.text(`Teléfono: ${orden.telefono}`);
    doc.text(`Descripción: ${orden.descripcion}`);
    doc.text(`Técnico: ${orden.tecnico}`);
    doc.text(`Estado: ${orden.estado}`);

    doc.moveDown(2);
    doc.text('Firma del Inquilino:', { align: 'left' });
    if (orden.firma) {
      doc.image(orden.firma, { fit: [200,100] });
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generando PDF' });
  }
});

// Login (usuarios planos)
const usersPath = path.join(__dirname, 'data/users.json');
let users = [];
try {
  users = JSON.parse(fs.readFileSync(usersPath));
  console.log("✅ Usuarios cargados:", users.map(u => `${u.username} (${u.role})`));
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

// Status
app.get('/status', (req, res) => res.json({ ok: true, mensaje: "Servidor activo 🚀" }));

// Ruta raíz -> login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
