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

// Configuración de Multer para evidencias
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const dbPathOrdenes = './data/ordenes.json';
const dbPathUsuarios = './data/usuarios.json';

let ordenes = [];
if (fs.existsSync(dbPathOrdenes)) {
  ordenes = JSON.parse(fs.readFileSync(dbPathOrdenes));
}

let usuarios = [];
if (fs.existsSync(dbPathUsuarios)) {
  usuarios = JSON.parse(fs.readFileSync(dbPathUsuarios));
}

function saveOrdenes() {
  fs.writeFileSync(dbPathOrdenes, JSON.stringify(ordenes, null, 2));
}

// Endpoint para obtener usuarios (solo técnicos)
app.get('/api/usuarios', (req, res) => {
  const tecnicos = usuarios.filter(u => u.rol === 'tecnico');
  res.json(tecnicos);
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = usuarios.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
  res.json({ mensaje: 'Login exitoso', tecnicoId: user.id, nombre: user.nombre, rol: user.rol });
});

// Crear orden
app.post('/api/ordenes', (req, res) => {
  const { codigoInmueble, nombre, telefono, descripcion } = req.body;
  if (!codigoInmueble || !nombre || !telefono || !descripcion) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
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
    fecha: new Date()
  };
  ordenes.push(nuevaOrden);
  saveOrdenes();
  res.json(nuevaOrden);
});

// Asignar técnico
app.put('/api/ordenes/:id/asignar', (req, res) => {
  const { id } = req.params;
  const { tecnicoId } = req.body;
  const orden = ordenes.find(o => o.id === parseInt(id));
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
  orden.tecnicoId = parseInt(tecnicoId);
  saveOrdenes();
  res.json(orden);
});

// Listar todas
app.get('/api/ordenes', (req, res) => {
  res.json(ordenes);
});

// Listar mis órdenes
app.get('/api/mis-ordenes/:tecnicoId', (req, res) => {
  const { tecnicoId } = req.params;
  const misOrdenes = ordenes.filter(o => o.tecnicoId === parseInt(tecnicoId));
  res.json(misOrdenes);
});

// Subir evidencia
app.post('/api/ordenes/:id/evidencia', upload.single('evidencia'), (req, res) => {
  const { id } = req.params;
  const orden = ordenes.find(o => o.id === parseInt(id));
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  orden.evidencias.push(req.file.path);
  saveOrdenes();
  res.json({ mensaje: 'Evidencia subida correctamente', archivo: req.file.path });
});

// Actualizar orden (estado, firma)
app.put('/api/ordenes/:id', (req, res) => {
  const { id } = req.params;
  const orden = ordenes.find(o => o.id === parseInt(id));
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

  const { estado, firma } = req.body;
  if (estado) orden.estado = estado;
  if (firma) {
    const fileName = `uploads/firma_${id}.png`;
    const base64Data = firma.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(fileName, base64Data, 'base64');
    orden.firma = fileName;
  }

  saveOrdenes();
  res.json(orden);
});

// Generar PDF con nombre del técnico
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
    const tecnico = usuarios.find(u => u.id === orden.tecnicoId);
    doc.text(`Técnico asignado: ${tecnico ? tecnico.nombre : orden.tecnicoId}`);
  } else {
    doc.text(`Técnico asignado: Sin asignar`);
  }

  if (orden.firma && fs.existsSync(orden.firma)) {
    doc.addPage().fontSize(16).text('Firma del cliente:', { align: 'left' });
    doc.image(orden.firma, { fit: [300, 200], align: 'center' });
  }

  if (orden.evidencias.length > 0) {
    doc.addPage().fontSize(16).text('Evidencias:', { align: 'left' });
    orden.evidencias.forEach((ev, i) => {
      if (fs.existsSync(ev)) {
        try {
          doc.image(ev, { fit: [250, 250] });
          doc.moveDown();
        } catch (err) {
          doc.text(`Archivo: ${ev}`);
        }
      } else {
        doc.text(`Archivo no encontrado: ${ev}`);
      }
    });
  }

  doc.end();
  stream.on('finish', () => {
    res.download(filePath);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
