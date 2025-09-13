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

// --------- Helpers utilitarios ----------
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
function readJsonSafe(p, fallback) {
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p)) : fallback; }
  catch { return fallback; }
}
function writeJsonSafe(p, data) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}
function cleanStr(v) {
  if (v === null || v === undefined) return '';
  return String(v).normalize('NFKC').trim();
}
function normRol(v) {
  const r = cleanStr(v).toLowerCase();
  const allowed = ['superadmin','admin','operador','tecnico'];
  return allowed.includes(r) ? r : 'operador';
}

// --------- App base ----------
app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(express.static('public'));

ensureDir('uploads');
ensureDir('data');
app.use('/uploads', express.static('uploads'));

// Multer para evidencias
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const dbPathOrdenes = './data/ordenes.json';
const dbPathUsuarios = './data/usuarios.json';

let ordenes = readJsonSafe(dbPathOrdenes, []);
let usuarios = readJsonSafe(dbPathUsuarios, []);

function saveOrdenes() { writeJsonSafe(dbPathOrdenes, ordenes); }
function saveUsuarios() { writeJsonSafe(dbPathUsuarios, usuarios); }

function registrarHistorial(orden, usuario, accion) {
  if (!orden.historial) orden.historial = [];
  orden.historial.push({
    fecha: new Date().toLocaleString(),
    usuario,
    accion
  });
}

// --------- Seed superadmin si no hay usuarios ----------
if (!usuarios.length) {
  usuarios.push({ id: 1, usuario: 'superadmin', password: 'admin', rol: 'superadmin' });
  saveUsuarios();
  console.log('Seed: superadmin/admin (superadmin) creado');
}

// --------- Salud / debug ----------
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
app.get('/api/debug/users', (_req, res) => {
  res.json(usuarios.map(u => ({ id: u.id, usuario: u.usuario, rol: u.rol })));
});

// ========== AUTH ==========
app.post('/api/login', (req, res) => {
  const usuarioIn = cleanStr(req.body.usuario || req.body.username);
  const passIn = String(req.body.password ?? req.body.pass ?? req.body.contrasena ?? '');

  if (!usuarioIn || passIn === '') {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }
  const user = usuarios.find(u => cleanStr(u.usuario).toLowerCase() === usuarioIn.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  if (String(user.password) !== passIn) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

  const rol = user.rol; // ya normalizado a minúsculas
  const isSuperAdmin = rol === 'superadmin';
  const isAdmin = isSuperAdmin || rol === 'admin';
  const isTecnico = rol === 'tecnico';
  const isOperador = rol === 'operador';

  const permisos = isSuperAdmin
    ? ['*']
    : isAdmin
      ? ['usuarios:leer', 'usuarios:editar', 'ordenes:*']
      : isTecnico
        ? ['ordenes:leer', 'ordenes:actualizar']
        : ['ordenes:crear', 'ordenes:leer'];

  res.json({
    id: user.id,
    usuario: user.usuario,
    rol,
    isSuperAdmin,
    isAdmin,
    isTecnico,
    isOperador,
    permisos
  });
});
// ========== USERS CRUD ==========
app.get('/api/usuarios', (_req, res) => res.json(usuarios));

app.post('/api/usuarios', (req, res) => {
  // Acepta alias y normaliza rol
  const usuario = cleanStr(req.body.usuario || req.body.username);
  const password = String(req.body.password ?? req.body.pass ?? req.body.contrasena ?? '');
  const rol = normRol(req.body.rol || req.body.role);

  if (!usuario || password === '') return res.status(400).json({ error: 'usuario y password son requeridos' });
  if (usuarios.find(u => cleanStr(u.usuario).toLowerCase() === usuario.toLowerCase())) {
    return res.status(400).json({ error: 'Usuario ya existe' });
  }
  const nuevo = {
    id: usuarios.length ? Math.max(...usuarios.map(u => u.id)) + 1 : 1,
    usuario,
    password,
    rol
  };
  usuarios.push(nuevo);
  saveUsuarios();
  res.json({ id: nuevo.id, usuario: nuevo.usuario, rol: nuevo.rol });
});

app.put('/api/usuarios/:id', (req, res) => {
  const { id } = req.params;
  const user = usuarios.find(u => u.id === parseInt(id));
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const usuario = cleanStr(req.body.usuario || req.body.username);
  const password = req.body.password ?? req.body.pass ?? req.body.contrasena;
  const rol = req.body.rol || req.body.role;

  if (usuario) {
    const exists = usuarios.find(u => u.id !== user.id && cleanStr(u.usuario).toLowerCase() === usuario.toLowerCase());
    if (exists) return res.status(400).json({ error: 'Otro usuario ya tiene ese nombre' });
    user.usuario = usuario;
  }
  if (typeof password !== 'undefined') user.password = String(password);
  if (rol) user.rol = normRol(rol);

  saveUsuarios();
  res.json({ id: user.id, usuario: user.usuario, rol: user.rol });
});

app.delete('/api/usuarios/:id', (req, res) => {
  const { id } = req.params;
  usuarios = usuarios.filter(u => u.id !== parseInt(id));
  saveUsuarios();
  res.json({ mensaje: 'Usuario eliminado' });
});

// ========== ÓRDENES ==========
app.get('/api/ordenes', (_req, res) => res.json(ordenes));

app.post('/api/ordenes', (req, res) => {
  const codigoInmueble = cleanStr(req.body.codigoInmueble || req.body.codigo || req.body.codInmueble);
  const nombre = cleanStr(req.body.nombre || req.body.cliente || req.body.persona);
  const telefono = cleanStr(req.body.telefono || req.body.tel || req.body.celular);
  const descripcion = cleanStr(req.body.descripcion || req.body.daño || req.body.detalle);

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

// Asignar técnico
app.put('/api/ordenes/:id/asignar', (req, res) => {
  const { id } = req.params;
  const tecnicoId = parseInt(req.body.tecnicoId ?? req.body.tecnico);
  const usuario = cleanStr(req.body.usuario || 'Admin');

  const orden = ordenes.find(o => o.id === parseInt(id));
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
  if (!tecnicoId) return res.status(400).json({ error: 'tecnicoId requerido' });

  orden.tecnicoId = tecnicoId;
  registrarHistorial(orden, usuario, `Técnico asignado: ${tecnicoId}`);
  saveOrdenes();
  res.json(orden);
});

// Actualizar estado / guardar firma
app.put('/api/ordenes/:id', (req, res) => {
  const { id } = req.params;
  const estado = cleanStr(req.body.estado);
  const firma = req.body.firma; // base64
  const usuario = cleanStr(req.body.usuario || 'Sistema');

  const orden = ordenes.find(o => o.id === parseInt(id));
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

  if (estado) {
    orden.estado = estado;
    registrarHistorial(orden, usuario, `Estado cambiado a ${estado}`);
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

// Subir evidencia
app.post('/api/ordenes/:id/evidencia', upload.single('evidencia'), (req, res) => {
  const { id } = req.params;
  const usuario = cleanStr(req.body.usuario || 'Técnico');
  const orden = ordenes.find(o => o.id === parseInt(id));
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
  orden.evidencias.push(req.file.path);
  registrarHistorial(orden, usuario, 'Evidencia subida');
  saveOrdenes();
  res.json({ mensaje: 'Evidencia subida', archivo: req.file.path });
});

// Historial
app.get('/api/ordenes/:id/historial', (req, res) => {
  const { id } = req.params;
  const orden = ordenes.find(o => o.id === parseInt(id));
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
  res.json(orden.historial || []);
});

// PDF
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

// ========== Impersonación para superadmin (ver como técnico) ==========
// Nota: en esta base no hay tokens; activas con ?superadmin=1 para depurar la UI.
app.get('/api/impersonar', (req, res) => {
  const isSuper = req.query.superadmin === '1';
  if (!isSuper) return res.status(403).json({ error: 'Solo superadmin' });

  // “Vista técnica” de ejemplo: órdenes asignadas a cualquier técnico + shape mínimo
  const vista = ordenes.map(o => ({
    id: o.id,
    codigoInmueble: o.codigoInmueble,
    descripcion: o.descripcion,
    estado: o.estado,
    tecnicoId: o.tecnicoId,
    evidencias: o.evidencias?.length || 0,
    tieneFirma: !!o.firma
  }));
  res.json({ rolSimulado: 'tecnico', vista });
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));