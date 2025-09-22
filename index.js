const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs");
const config = require("./config.json");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const usersFile = path.join(__dirname, "users.json");

// Endpoints de usuarios
app.get("/api/usuarios", (req, res) => {
  const usuarios = JSON.parse(fs.readFileSync(usersFile, "utf8"));
  res.json(usuarios);
});

app.post("/api/usuarios", (req, res) => {
  const usuarios = JSON.parse(fs.readFileSync(usersFile, "utf8"));
  usuarios.push(req.body);
  fs.writeFileSync(usersFile, JSON.stringify(usuarios, null, 2));
  res.json({ ok: true, mensaje: "Usuario creado" });
});

app.put("/api/usuarios/:username", (req, res) => {
  let usuarios = JSON.parse(fs.readFileSync(usersFile, "utf8"));
  usuarios = usuarios.map(u =>
    u.username === req.params.username ? { ...u, ...req.body } : u
  );
  fs.writeFileSync(usersFile, JSON.stringify(usuarios, null, 2));
  res.json({ ok: true, mensaje: "Usuario actualizado" });
});

app.delete("/api/usuarios/:username", (req, res) => {
  let usuarios = JSON.parse(fs.readFileSync(usersFile, "utf8"));
  usuarios = usuarios.filter(u => u.username !== req.params.username);
  fs.writeFileSync(usersFile, JSON.stringify(usuarios, null, 2));
  res.json({ ok: true, mensaje: "Usuario eliminado" });
});

// Crear orden
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

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: "Respuesta inválida de AppScript",
        raw: text
      });
    }

    res.json(data);
  } catch (error) {
    console.error("❌ Error creando orden:", error);
    res.status(500).json({ error: "No se pudo crear la orden" });
  }
});

// Leer órdenes desde Google Sheets (CSV)
app.get("/api/ordenes", async (req, res) => {
  try {
    const response = await fetch(config.GSHEET_URL);
    const text = await response.text();
    res.send(text);
  } catch (error) {
    console.error("❌ Error leyendo Google Sheets:", error);
    res.status(500).json({ error: "No se pudo leer la hoja" });
  }
});

const PORT = config.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
