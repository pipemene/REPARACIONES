const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");
const config = require("./config.json");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Servir usuarios.json para el login
app.get("/usuarios.json", (req, res) => {
  res.sendFile(path.join(__dirname, "usuarios.json"));
});

// Crear orden -> POST App Script
app.post("/api/ordenes", async (req, res) => {
  try {
    const nuevaOrden = {
      fecha: req.body.fecha,
      inquilino: req.body.inquilino,
      descripcion: req.body.descripcion,
      tecnico: req.body.tecnico,
      estado: req.body.estado,
      radicado: config.RADICADO_PREFIX + Date.now()
    };

    const response = await fetch(config.APPSCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevaOrden)
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("❌ Error creando orden:", error);
    res.status(500).json({ error: "No se pudo crear la orden" });
  }
});

// Leer órdenes -> GET App Script
app.get("/api/ordenes", async (req, res) => {
  try {
    const response = await fetch(config.APPSCRIPT_URL);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("❌ Error leyendo órdenes:", error);
    res.status(500).json({ error: "No se pudo leer la hoja" });
  }
});

// Redirigir raíz al login
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

const PORT = config.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
