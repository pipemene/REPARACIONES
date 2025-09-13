import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Para aceptar firmas base64

// Simulación de base de datos (JSON en /data)
const dbPath = './data/ordenes.json';

// Cargar base inicial
let ordenes = [];
if (fs.existsSync(dbPath)) {
  ordenes = JSON.parse(fs.readFileSync(dbPath));
}

// Guardar cambios en el archivo
function saveDB() {
  fs.writeFileSync(dbPath, JSON.stringify(ordenes, null, 2));
}

// Crear nueva orden de servicio
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
    fecha: new Date()
  };
  ordenes.push(nuevaOrden);
  saveDB();
  res.json(nuevaOrden);
});

// Listar todas las órdenes
app.get('/api/ordenes', (req, res) => {
  res.json(ordenes);
});

// Actualizar orden (estado, evidencia, firma base64)
app.put('/api/ordenes/:id', (req, res) => {
  const { id } = req.params;
  const orden = ordenes.find(o => o.id === parseInt(id));
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

  const { estado, evidencia, firma } = req.body;
  if (estado) orden.estado = estado;
  if (evidencia) orden.evidencias.push(evidencia);
  if (firma) {
    const fileName = `uploads/firma_${id}.png`;
    const base64Data = firma.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(fileName, base64Data, 'base64');
    orden.firma = fileName;
  }

  saveDB();
  res.json(orden);
});

// Generar PDF de la orden
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

  if (orden.firma && fs.existsSync(orden.firma)) {
    doc.addPage().fontSize(16).text('Firma del cliente:', { align: 'left' });
    doc.image(orden.firma, { fit: [300, 200], align: 'center' });
  }

  if (orden.evidencias.length > 0) {
    doc.addPage().fontSize(16).text('Evidencias:', { align: 'left' });
    orden.evidencias.forEach((ev, i) => {
      doc.text(`- ${ev}`);
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
