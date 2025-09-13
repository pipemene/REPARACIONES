
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

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }
function readJsonSafe(p, fallback) { try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p)) : fallback; } catch { return fallback; } }
function writeJsonSafe(p, data) { ensureDir(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(data, null, 2)); }
function cleanStr(v) { if (v === null || v === undefined) return ''; return String(v).normalize('NFKC').trim(); }
function normRol(v) { const r = cleanStr(v).toLowerCase(); const allowed = ['superadmin','admin','operador','tecnico']; return allowed.includes(r) ? r : 'operador'; }

app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(express.static('public'));
ensureDir('uploads'); ensureDir('data');
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => { const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); }
});
const upload = multer({ storage });

const dbPathOrdenes = './data/ordenes.json';
const dbPathUsuarios = './data/usuarios.json';
let ordenes = readJsonSafe(dbPathOrdenes, []);
let usuarios = readJsonSafe(dbPathUsuarios, []);
function saveOrdenes() { writeJsonSafe(dbPathOrdenes, ordenes); }
function saveUsuarios() { writeJsonSafe(dbPathUsuarios, usuarios); }
function registrarHistorial(orden, usuario, accion) { if (!orden.historial) orden.historial = []; orden.historial.push({ fecha: new Date().toLocaleString(), usuario, accion }); }

if (!usuarios.length) { usuarios.push({ id: 1, usuario: 'superadmin', password: 'admin', rol: 'superadmin' }); saveUsuarios(); console.log('Seed: superadmin/admin creado'); }

app.get('/', (req,res)=>{ res.send('Backend de Reparaciones funcionando. Usa /api/health'); });
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
app.get('/api/debug/users', (_req, res) => { res.json(usuarios.map(u => ({ id: u.id, usuario: u.usuario, rol: u.rol }))); });

// AUTH
app.post('/api/login', (req, res) => {
  const usuarioIn = cleanStr(req.body.usuario || req.body.username);
  const passIn = String(req.body.password ?? req.body.pass ?? req.body.contrasena ?? '');
  if (!usuarioIn || passIn === '') return res.status(400).json({ error: 'Faltan credenciales' });
  const user = usuarios.find(u => cleanStr(u.usuario).toLowerCase() === usuarioIn.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  if (String(user.password) !== passIn) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  const rol = user.rol;
  const isSuperAdmin = rol === 'superadmin';
  const isAdmin = isSuperAdmin || rol === 'admin';
  const isTecnico = rol === 'tecnico';
  const isOperador = rol === 'operador';
  const permisos = isSuperAdmin ? ['*'] : isAdmin ? ['usuarios:leer','usuarios:editar','ordenes:*'] : isTecnico ? ['ordenes:leer','ordenes:actualizar'] : ['ordenes:crear','ordenes:leer'];
  res.json({ id: user.id, usuario: user.usuario, rol, isSuperAdmin, isAdmin, isTecnico, isOperador, permisos });
});

// USERS CRUD
app.get('/api/usuarios', (_req, res) => res.json(usuarios));
app.post('/api/usuarios', (req, res) => {
  const usuario = cleanStr(req.body.usuario || req.body.username);
  const password = String(req.body.password ?? req.body.pass ?? req.body.contrasena ?? '');
  const rol = normRol(req.body.rol || req.body.role);
  if (!usuario || password === '') return res.status(400).json({ error: 'usuario y password son requeridos' });
  if (usuarios.find(u => cleanStr(u.usuario).toLowerCase() === usuario.toLowerCase())) return res.status(400).json({ error: 'Usuario ya existe' });
  const nuevo = { id: usuarios.length ? Math.max(...usuarios.map(u => u.id)) + 1 : 1, usuario, password, rol };
  usuarios.push(nuevo); saveUsuarios(); res.json({ id: nuevo.id, usuario: nuevo.usuario, rol: nuevo.rol });
});
app.put('/api/usuarios/:id', (req, res) => {
  const { id } = req.params; const user = usuarios.find(u => u.id === parseInt(id)); if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const usuario = cleanStr(req.body.usuario || req.body.username);
  const password = req.body.password ?? req.body.pass ?? req.body.contrasena;
  const rol = req.body.rol || req.body.role;
  if (usuario) { const exists = usuarios.find(u => u.id !== user.id && cleanStr(u.usuario).toLowerCase() === usuario.toLowerCase()); if (exists) return res.status(400).json({ error: 'Otro usuario ya tiene ese nombre' }); user.usuario = usuario; }
  if (typeof password !== 'undefined') user.password = String(password);
  if (rol) user.rol = normRol(rol);
  saveUsuarios(); res.json({ id: user.id, usuario: user.usuario, rol: user.rol });
});
app.delete('/api/usuarios/:id', (req, res) => { const { id } = req.params; usuarios = usuarios.filter(u => u.id !== parseInt(id)); saveUsuarios(); res.json({ mensaje: 'Usuario eliminado' }); });

// ORDERS CRUD simplified (omit to save space in answer)
app.get('/api/ordenes', (_req, res) => res.json(ordenes));
// ... (mantén el resto igual que v3)

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
