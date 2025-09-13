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

// Helpers
function ensureDir(dir){ if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true}); }
function readJsonSafe(p, fallback){ try{ return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p)) : fallback; } catch { return fallback; } }
function writeJsonSafe(p, data){ ensureDir(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(data,null,2)); }
function cleanStr(v){ if(v===null||v===undefined) return ''; return String(v).normalize('NFKC').trim(); }
function normRol(v){ const r=cleanStr(v).toLowerCase(); const allowed=['superadmin','admin','operador','tecnico']; return allowed.includes(r)?r:'operador'; }

app.use(cors());
app.use(bodyParser.json({limit:'20mb'}));
ensureDir('uploads'); ensureDir('data');
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

const storage = multer.diskStorage({
  destination: (req,file,cb)=>cb(null,'uploads/'),
  filename: (req,file,cb)=>{ const u=Date.now()+'-'+Math.round(Math.random()*1e9); cb(null,file.fieldname+'-'+u+path.extname(file.originalname)); }
});
const upload = multer({ storage });

const dbPathOrdenes='./data/ordenes.json';
const dbPathUsuarios='./data/usuarios.json';
let ordenes = readJsonSafe(dbPathOrdenes, []);
let usuarios = readJsonSafe(dbPathUsuarios, []);
function saveOrdenes(){ writeJsonSafe(dbPathOrdenes, ordenes); }
function saveUsuarios(){ writeJsonSafe(dbPathUsuarios, usuarios); }
function registrarHistorial(orden, usuario, accion){
  if(!orden.historial) orden.historial=[];
  orden.historial.push({ fecha:new Date().toLocaleString(), usuario, accion });
}

// Seed: usuarios pedidos
if(!usuarios.length){
  usuarios.push(
    { id:1, usuario:'PIPEMENE', password:'Blu3h0m32016', rol:'superadmin' },
    { id:2, usuario:'ARRENDAMIENTOS', password:'Bluehome2016', rol:'admin' },
    { id:3, usuario:'TECNICO1', password:'1234', rol:'tecnico' }
  );
  saveUsuarios();
  console.log('Seed: PIPEMENE(superadmin), ARRENDAMIENTOS(admin), TECNICO1(tecnico)');
}

// Root + salud
app.get('/', (_req,res)=>res.sendFile(path.resolve('public/index.html')));
app.get('/api/health', (_req,res)=>res.json({ok:true, ts:new Date().toISOString()}));

// Usuarios (debug listado seguro para la UI)
app.get('/api/usuarios', (_req,res)=>res.json(usuarios));
app.get('/api/usuarios/roles', (_req,res)=>res.json(['superadmin','admin','operador','tecnico']));

// Auth
app.post('/api/login', (req,res)=>{
  const usuarioIn = cleanStr(req.body.usuario||req.body.username);
  const passIn = String(req.body.password ?? req.body.pass ?? req.body.contrasena ?? '');
  if(!usuarioIn || passIn==='') return res.status(400).json({error:'Faltan credenciales'});
  const user = usuarios.find(u=>cleanStr(u.usuario).toLowerCase()===usuarioIn.toLowerCase());
  if(!user || String(user.password)!==passIn) return res.status(401).json({error:'Usuario o contraseña incorrectos'});
  const rol=user.rol;
  const isSuperAdmin = rol==='superadmin';
  const isAdmin = isSuperAdmin || rol==='admin';
  const isTecnico = rol==='tecnico';
  const isOperador = rol==='operador';
  const permisos = isSuperAdmin ? ['*']
    : isAdmin ? ['usuarios:leer','ordenes:*']
    : isTecnico ? ['ordenes:leer','ordenes:actualizar','ordenes:tomar']
    : ['ordenes:crear','ordenes:leer'];
  res.json({ id:user.id, usuario:user.usuario, rol, isSuperAdmin, isAdmin, isTecnico, isOperador, permisos });
});

// CRUD usuarios (solo backend; la UI los expone solo a superadmin)
app.post('/api/usuarios', (req,res)=>{
  const usuario = cleanStr(req.body.usuario || req.body.username);
  const password = String(req.body.password ?? req.body.pass ?? req.body.contrasena ?? '');
  const rol = normRol(req.body.rol || req.body.role);
  if(!usuario || password==='') return res.status(400).json({error:'usuario y password son requeridos'});
  if(usuarios.find(u=>cleanStr(u.usuario).toLowerCase()===usuario.toLowerCase())) return res.status(400).json({error:'Usuario ya existe'});
  const nuevo = { id: usuarios.length? Math.max(...usuarios.map(u=>u.id))+1 : 1, usuario, password, rol };
  usuarios.push(nuevo); saveUsuarios();
  res.json({ id:nuevo.id, usuario:nuevo.usuario, rol:nuevo.rol });
});
app.put('/api/usuarios/:id', (req,res)=>{
  const {id}=req.params;
  const user=usuarios.find(u=>u.id===parseInt(id));
  if(!user) return res.status(404).json({error:'Usuario no encontrado'});
  const usuario=cleanStr(req.body.usuario||req.body.username);
  const password=req.body.password ?? req.body.pass ?? req.body.contrasena;
  const rol=req.body.rol || req.body.role;
  if(usuario){
    const exists = usuarios.find(u=>u.id!==user.id && cleanStr(u.usuario).toLowerCase()===usuario.toLowerCase());
    if(exists) return res.status(400).json({error:'Otro usuario ya tiene ese nombre'});
    user.usuario=usuario;
  }
  if(typeof password!=='undefined') user.password=String(password);
  if(rol) user.rol=normRol(rol);
  saveUsuarios(); res.json({id:user.id, usuario:user.usuario, rol:user.rol});
});
app.delete('/api/usuarios/:id', (req,res)=>{
  const {id}=req.params;
  usuarios = usuarios.filter(u=>u.id!==parseInt(id));
  saveUsuarios(); res.json({mensaje:'Usuario eliminado'});
});

// Órdenes
app.get('/api/ordenes', (req,res)=>{
  const tecnicoId = req.query.tecnicoId ? parseInt(req.query.tecnicoId) : null;
  const soloMias = req.query.mine==='1' && tecnicoId;
  if(soloMias){
    return res.json(ordenes.filter(o=>o.tecnicoId===tecnicoId));
  }
  res.json(ordenes);
});
app.post('/api/ordenes', (req,res)=>{
  const codigoInmueble=cleanStr(req.body.codigoInmueble||req.body.codigo||req.body.codInmueble);
  const nombre=cleanStr(req.body.nombre||req.body.cliente||req.body.persona);
  const telefono=cleanStr(req.body.telefono||req.body.tel||req.body.celular);
  const descripcion=cleanStr(req.body.descripcion||req.body.daño||req.body.detalle);
  if(!codigoInmueble||!nombre||!telefono||!descripcion) return res.status(400).json({error:'Todos los campos son requeridos'});
  const nueva={ id:ordenes.length?Math.max(...ordenes.map(o=>o.id))+1:1, codigoInmueble,nombre,telefono,descripcion,estado:'pendiente',evidencias:[],firma:null,tecnicoId:null,fecha:new Date(),historial:[] };
  registrarHistorial(nueva,'Sistema','Orden creada');
  ordenes.push(nueva); saveOrdenes(); res.json(nueva);
});
app.put('/api/ordenes/:id/asignar', (req,res)=>{
  const {id}=req.params; const tecnicoId=parseInt(req.body.tecnicoId ?? req.body.tecnico);
  const usuario = cleanStr(req.body.usuario||'Admin');
  const orden=ordenes.find(o=>o.id===parseInt(id)); if(!orden) return res.status(404).json({error:'Orden no encontrada'});
  if(!tecnicoId) return res.status(400).json({error:'tecnicoId requerido'});
  orden.tecnicoId=tecnicoId; registrarHistorial(orden,usuario,`Técnico asignado: ${tecnicoId}`); saveOrdenes(); res.json(orden);
});
// Tomar orden (técnico se autoasigna)
app.put('/api/ordenes/:id/tomar', (req,res)=>{
  const {id}=req.params; const tecnicoId=parseInt(req.body.tecnicoId);
  const usuario = cleanStr(req.body.usuario||'Tecnico');
  const orden=ordenes.find(o=>o.id===parseInt(id)); if(!orden) return res.status(404).json({error:'Orden no encontrada'});
  if(!tecnicoId) return res.status(400).json({error:'tecnicoId requerido'});
  orden.tecnicoId=tecnicoId; registrarHistorial(orden,usuario,`Orden tomada por técnico ${tecnicoId}`); saveOrdenes(); res.json(orden);
});
app.put('/api/ordenes/:id', (req,res)=>{
  const {id}=req.params; const estado=cleanStr(req.body.estado); const firma=req.body.firma; const usuario=cleanStr(req.body.usuario||'Sistema');
  const orden=ordenes.find(o=>o.id===parseInt(id)); if(!orden) return res.status(404).json({error:'Orden no encontrada'});
  if(estado){ orden.estado=estado; registrarHistorial(orden,usuario,`Estado cambiado a ${estado}`); }
  if(firma){ const file=`uploads/firma_${id}.png`; const b64=String(firma).replace(/^data:image\/png;base64,/, ''); fs.writeFileSync(file,b64,'base64'); orden.firma=file; registrarHistorial(orden,usuario,'Firma capturada'); }
  saveOrdenes(); res.json(orden);
});
app.post('/api/ordenes/:id/evidencia', upload.single('evidencia'), (req,res)=>{
  const {id}=req.params; const usuario=cleanStr(req.body.usuario||'Técnico');
  const orden=ordenes.find(o=>o.id===parseInt(id)); if(!orden) return res.status(404).json({error:'Orden no encontrada'});
  if(!req.file) return res.status(400).json({error:'No se subió ningún archivo'});
  orden.evidencias.push(req.file.path); registrarHistorial(orden,usuario,'Evidencia subida'); saveOrdenes(); res.json({mensaje:'Evidencia subida', archivo:req.file.path});
});
app.get('/api/ordenes/:id/pdf', (req,res)=>{
  const {id}=req.params; const orden=ordenes.find(o=>o.id===parseInt(id)); if(!orden) return res.status(404).json({error:'Orden no encontrada'});
  const doc=new PDFDocument(); const fp=`uploads/orden_${id}.pdf`; const stream=fs.createWriteStream(fp); doc.pipe(stream);
  doc.fontSize(20).text(`Orden de Servicio #${orden.id}`,{align:'center'}); doc.moveDown();
  doc.fontSize(12).text(`Código inmueble: ${orden.codigoInmueble}`); doc.text(`Cliente: ${orden.nombre}`); doc.text(`Teléfono: ${orden.telefono}`);
  doc.text(`Descripción: ${orden.descripcion}`); doc.text(`Estado: ${orden.estado}`); doc.text(`Fecha: ${new Date(orden.fecha).toLocaleString()}`);
  if(orden.tecnicoId){ const t=usuarios.find(u=>u.id===orden.tecnicoId); doc.text(`Técnico asignado: ${t? t.usuario: orden.tecnicoId}`); } else { doc.text('Técnico asignado: Sin asignar'); }
  if(orden.historial?.length){ doc.addPage().fontSize(16).text('Historial de Cambios:',{align:'left'}); orden.historial.forEach(h=>doc.fontSize(12).text(`${h.fecha} - ${h.usuario}: ${h.accion}`)); }
  if(orden.firma && fs.existsSync(orden.firma)){ doc.addPage().fontSize(16).text('Firma del cliente:',{align:'left'}); doc.image(orden.firma,{fit:[300,200],align:'center'}); }
  if(orden.evidencias?.length){ doc.addPage().fontSize(16).text('Evidencias:',{align:'left'}); orden.evidencias.forEach(ev=>{ if(fs.existsSync(ev)){ try{ doc.image(ev,{fit:[250,250]}); doc.moveDown(); } catch { doc.fontSize(12).text(`Archivo: ${ev}`);} } else { doc.fontSize(12).text(`Archivo no encontrado: ${ev}`);} }); }
  doc.end(); stream.on('finish',()=>res.download(fp));
});

app.listen(PORT, ()=>console.log(`Servidor corriendo en puerto ${PORT}`));