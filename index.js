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
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

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

// Login (case insensitive usuario)
app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body;
  const user = usuarios.find(u => u.usuario.toLowerCase() === usuario.toLowerCase() && u.password === password);
  if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  res.json({ id: user.id, usuario: user.usuario, rol: user.rol });
});

// CRUD Usuarios
app.get('/api/usuarios', (req, res) => res.json(usuarios));
app.post('/api/usuarios', (req, res) => {
  const { usuario, password, rol } = req.body;
  if (!usuario || !password || !rol) return res.status(400).json({ error: 'Campos requeridos' });
  if (usuarios.find(u => u.usuario.toLowerCase() === usuario.toLowerCase())) {
    return res.status(400).json({ error: 'Usuario ya existe' });
  }
  const nuevo = { id: usuarios.length + 1, usuario, password, rol };
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

// Crear orden
app.post('/api/ordenes', (req, res) => {
  const { codigoInmueble, nombre, telefono, descripcion } = req.body;
  if (!codigoInmueble || !nombre || !telefono || !descripcion) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  const nuevaOrden = {
    id: ordenes.length + 1,
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

// Obtener órdenes
app.get('/api/ordenes', (req, res) => res.json(ordenes));

// Obtener historial
app.get('/api/ordenes/:id/historial', (req, res) => {
  const { id } = req.params;
  const orden = ordenes.find(o => o.id === parseInt(id));
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
  res.json(orden.historial || []);
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
