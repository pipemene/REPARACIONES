const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs-extra");
const config = require("./config.json");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const usuariosPath = path.join(__dirname, "usuarios.json");

// Servir usuarios.json
app.get("/usuarios.json", (req, res) => {
  res.sendFile(usuariosPath);
});

// CRUD de usuarios
app.post("/api/usuarios", async (req, res) => {
  try {
    const usuarios = await fs.readJson(usuariosPath);
    usuarios.push(req.body);
    await fs.writeJson(usuariosPath, usuarios, { spaces: 2 });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "No se pudo crear el usuario" });
  }
});

app.put("/api/usuarios/:user", async (req, res) => {
  try {
    const usuarios = await fs.readJson(usuariosPath);
    const index = usuarios.findIndex(u => u.user === req.params.user);
    if (index === -1) return res.status(404).json({ error: "Usuario no encontrado" });
    usuarios[index] = { ...usuarios[index], ...req.body };
    await fs.writeJson(usuariosPath, usuarios, { spaces: 2 });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "No se pudo actualizar el usuario" });
  }
});

app.delete("/api/usuarios/:user", async (req, res) => {
  try {
    let usuarios = await fs.readJson(usuariosPath);
    usuarios = usuarios.filter(u => u.user !== req.params.user);
    await fs.writeJson(usuariosPath, usuarios, { spaces: 2 });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "No se pudo eliminar el usuario" });
  }
});

// Crear orden
app.post("/api/ordenes", async (req, res) => {
  try {
    const nuevaOrden = {
      fecha: req.body.fecha,
      inquilino: req.body.inquilino,
      descripcion: req.body.descripcion,
      tecnico: req.body.tecnico || "",
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

// Leer órdenes
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

const PORT = process.env.PORT || config.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
