const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");
const config = require("./config.json");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const APPSCRIPT_URL = config.APPSCRIPT_URL;

// ==== USUARIOS ====
app.get("/usuarios.json", async (req, res) => {
  try {
    const response = await fetch(`${APPSCRIPT_URL}?action=getUsuarios`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Error obteniendo usuarios:", err);
    res.status(500).json({ error: "No se pudieron obtener los usuarios" });
  }
});

app.post("/api/usuarios", async (req, res) => {
  try {
    const response = await fetch(APPSCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addUsuario", ...req.body })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Error creando usuario:", err);
    res.status(500).json({ error: "No se pudo crear el usuario" });
  }
});

app.put("/api/usuarios/:user", async (req, res) => {
  try {
    const response = await fetch(APPSCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateUsuario", user: req.params.user, ...req.body })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Error actualizando usuario:", err);
    res.status(500).json({ error: "No se pudo actualizar el usuario" });
  }
});

app.delete("/api/usuarios/:user", async (req, res) => {
  try {
    const response = await fetch(APPSCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteUsuario", user: req.params.user })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Error eliminando usuario:", err);
    res.status(500).json({ error: "No se pudo eliminar el usuario" });
  }
});

// ==== ÓRDENES ====
app.get("/api/ordenes", async (req, res) => {
  try {
    const response = await fetch(`${APPSCRIPT_URL}?action=getOrdenes`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Error obteniendo órdenes:", err);
    res.status(500).json({ error: "No se pudieron obtener las órdenes" });
  }
});

app.post("/api/ordenes", async (req, res) => {
  try {
    const nuevaOrden = {
      action: "addOrden",
      radicado: config.RADICADO_PREFIX + Date.now(),
      ...req.body
    };

    const response = await fetch(APPSCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevaOrden)
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Error creando orden:", err);
    res.status(500).json({ error: "No se pudo crear la orden" });
  }
});

app.put("/api/ordenes/:radicado", async (req, res) => {
  try {
    const response = await fetch(APPSCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateOrden", radicado: req.params.radicado, ...req.body })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Error actualizando orden:", err);
    res.status(500).json({ error: "No se pudo actualizar la orden" });
  }
});

// ==== REDIRECCIÓN ====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

const PORT = process.env.PORT || config.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
