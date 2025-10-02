const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.JWT_SECRET || "bluehome2025",
  resave: false,
  saveUninitialized: true
}));

// Configuración de vistas
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Endpoint para login
app.post("/login", async (req, res) => {
  try {
    const { usuario, clave } = req.body;
    const url = `${process.env.SHEETS_API_URL}?action=getUsuarios`;
    const response = await fetch(url);
    const usuarios = await response.json();

    const user = usuarios.find(u => 
      u.Usuario === usuario && u.Clave === clave
    );

    if (user) {
      req.session.user = user;
      return res.json({ success: true });
    } else {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }
  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ success: false, message: "Error interno" });
  }
});

// Middleware de autenticación
function authMiddleware(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/");
  }
}

// Vista login
app.get("/", (req, res) => {
  res.render("login", { error: null });
});

// Vista principal
app.get("/ordenes", authMiddleware, async (req, res) => {
  try {
    const url = `${process.env.SHEETS_API_URL}?action=getOrdenes`;
    const response = await fetch(url);
    const ordenes = await response.json();
    res.render("ordenes", { ordenes, user: req.session.user });
  } catch (err) {
    console.error("Error al obtener órdenes:", err);
    res.render("ordenes", { ordenes: [], user: req.session.user });
  }
});

// Salir
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
