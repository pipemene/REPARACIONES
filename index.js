import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';
import multer from 'multer';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Multer for evidence uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const dbPathOrdenes = './data/ordenes.json';
const dbPathUsuarios = './data/usuarios.json';

let ordenes = fs.existsSync(dbPathOrdenes) ? JSON.parse(fs.readFileSync(dbPathOrdenes)) : [];
let usuarios = fs.existsSync(dbPathUsuarios) ? JSON.parse(fs.readFileSync(dbPathUsuarios)) : [];

function saveOrdenes() { fs.writeFileSync(dbPathOrdenes, JSON.stringify(ordenes, null, 2)); }
function saveUsuarios() { fs.writeFileSync(dbPathUsuarios, JSON.stringify(usuarios, null, 2)); }

function registrarHistorial(orden, usuario, accion) {
  if (!orden.historial) orden.historial = [];
  orden.historial.push({
    fecha: new Date().toLocaleString(),
    usuario,
    accion
  });
}

// ---- AUTH ----
app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario || !password) return res.status(400).json({ error: 'Faltan credenciales' });
  const user = usuarios.find(u => u.usuario?.toLowerCase() === String(usuario).toLowerCase() && u.password === password);
  if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  res.json({ id: user.id, usuario: user.usuario, rol: user.rol });
});

// ---- USERS CRUD ----
app.get('/api/usuarios', (req, res) => res.json(usuarios));

app.post('/api/usuarios', (req, res) => {
  const { usuario, password, rol } = req.body;
  if (!usuario || !password || !rol) return res.status(400).json({ error: 'Campos requeridos' });
  if (usuarios.find(u => u.usuario?.toLowerCase() === String(usuario).toLowerCase())) {
    return res.status(400).json({ error: 'Usuario ya existe' });
  }
  const nuevo = { id: usuarios.length ? Math.max(...usuarios.map(u => u.id)) + 1 : 1, usuario, password, rol };
  usuarios.push(nuevo);
  saveUsuarios();
  res.json(nuevo);
});

app.put('/api/usuarios/:id', (req, res) => {
  const { id } = req.params;
  const user = usuarios.find(u => u.id === parseInt(id));
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const { usuario, password, rol } = req.body;
  if (usuario) user.usuario = usuario;
  if (password) user.password = password;
  if (rol) user.rol = rol;
  saveUsuarios();
  res.json(user);
});

app.delete('/api/usuarios/:id', (req, res) => {
  const { id } = req.params;
  usuarios = usuarios.filter(u => u.id !== parseInt(id));
  saveUsuarios();
  res.json({ mensaje: 'Usuario eliminado' });
});

// ---- ORDERS ----
app.get('/api/ordenes', (req, res) => res.json(ordenes));

app.post('/api/ordenes', (req, res) => {
  const { codigoInmueble, nombre, telefono, descripcion } = req.body;
  if (!codigoInmueble || !nombre || !telefono || !descripcion) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  const nuevaOrden = {
    id: ordenes.length ? Math.max(...ordenes.map(o => o.id)) + 1 : 1,
    codigoInmueble,
    nombre,
    telefono,
    descripcion,
    estado: 'pendiente',
    evidencias: [],
    firma: null,
    tecnicoId: null,
    fecha: new Date(),
    historial: []
  };
  registrarHistorial(nuevaOrden, 'Sistema', 'Orden creada');
  ordenes.push(nuevaOrden);
  saveOrdenes();
  res.json(nuevaOrden);
});

// Assign technician
app.put('/api/ordenes/:id/asignar', (req, res) => {
  const { id } = req.params;
  const { tecnicoId, usuario } = req.body;
  const orden = ordenes.find(o => o.id === parseInt(id));
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
  orden.tecnicoId = parseInt(tecnicoId);
  registrarHistorial(orden, usuario || 'Admin', `Técnico asignado: ${tecnicoId}`);
  saveOrdenes();
  res.json(orden);
});

// Update state or save signature
app.put('/api/ordenes/:id', (req, res) => {
  const { id } = req.params;
  const { estado, firma, usuario } = req.body;
  const orden = ordenes.find(o => o.id === parseInt(id));
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

  if (estado) {
    orden.estado = estado;
    registrarHistorial(orden, usuario || 'Sistema', `Estado cambiado a ${estado}`);
  }
  if (firma) {
    const fileName = `uploads/firma_${id}.png`;
    const base64Data = String(firma).replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(fileName, base64Data, 'base64');
    orden.firma = fileName;
    registrarHistorial(orden, usuario || 'Técnico', 'Firma capturada');
  }
  saveOrdenes();
  res.json(orden);
});

// Upload evidence
app.post('/api/ordenes/:id/evidencia', upload.single('evidencia'), (req, res) => {
  const { id } = req.params;
  const { usuario } = req.body;
  const orden = ordenes.find(o => o.id === parseInt(id));
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
  orden.evidencias.push(req.file.path);
  registrarHistorial(orden, usuario || 'Técnico', 'Evidencia subida');
  saveOrdenes();
  res.json({ mensaje: 'Evidencia subida', archivo: req.file.path });
});

// Get order history
app.get('/api/ordenes/:id/historial', (req, res) => {
  const { id } = req.params;
  const orden = ordenes.find(o => o.id === parseInt(id));
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
  res.json(orden.historial || []);
});

// PDF generation including technician name & history & evidences
app.get('/api/ordenes/:id/pdf', (req, res) => {
  const { id } = req.params;
  const orden = ordenes.find(o => o.id === parseInt(id));
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

  const doc = new PDFDocument();
  const filePath = `uploads/orden_${id}.pdf`;
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(20).text(`Orden de Servicio #${orden.id}`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Código inmueble: ${orden.codigoInmueble}`);
  doc.text(`Cliente: ${orden.nombre}`);
  doc.text(`Teléfono: ${orden.telefono}`);
  doc.text(`Descripción: ${orden.descripcion}`);
  doc.text(`Estado: ${orden.estado}`);
  doc.text(`Fecha: ${new Date(orden.fecha).toLocaleString()}`);
  if (orden.tecnicoId) {
    const t = usuarios.find(u => u.id === orden.tecnicoId);
    doc.text(`Técnico asignado: ${t ? t.usuario : orden.tecnicoId}`);
  } else {
    doc.text(`Técnico asignado: Sin asignar`);
  }

  if (orden.historial && orden.historial.length) {
    doc.addPage().fontSize(16).text('Historial de Cambios:', { align: 'left' });
    orden.historial.forEach(h => {
      doc.fontSize(12).text(`${h.fecha} - ${h.usuario}: ${h.accion}`);
    });
  }

  if (orden.firma && fs.existsSync(orden.firma)) {
    doc.addPage().fontSize(16).text('Firma del cliente:', { align: 'left' });
    doc.image(orden.firma, { fit: [300, 200], align: 'center' });
  }

  if (orden.evidencias && orden.evidencias.length) {
    doc.addPage().fontSize(16).text('Evidencias:', { align: 'left' });
    orden.evidencias.forEach(ev => {
      if (fs.existsSync(ev)) {
        try { doc.image(ev, { fit: [250, 250] }); doc.moveDown(); }
        catch { doc.fontSize(12).text(`Archivo: ${ev}`); }
      } else {
        doc.fontSize(12).text(`Archivo no encontrado: ${ev}`);
      }
    });
  }

  doc.end();
  stream.on('finish', () => res.download(filePath));
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
