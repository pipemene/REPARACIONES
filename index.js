import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

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

// Actualizar orden (estado, evidencia, firma)
app.put('/api/ordenes/:id', (req, res) => {
  const { id } = req.params;
  const orden = ordenes.find(o => o.id === parseInt(id));
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

  const { estado, evidencia, firma } = req.body;
  if (estado) orden.estado = estado;
  if (evidencia) orden.evidencias.push(evidencia);
  if (firma) orden.firma = firma;

  saveDB();
  res.json(orden);
});

// Generar PDF (pendiente implementar)
app.get('/api/ordenes/:id/pdf', (req, res) => {
  const { id } = req.params;
  const orden = ordenes.find(o => o.id === parseInt(id));
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

  res.json({ mensaje: `Aquí se generará el PDF de la orden ${id}` });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
