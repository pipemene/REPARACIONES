const express = require("express");
const router = express.Router();
const axios = require("axios");
const path = require("path");
const fs = require("fs");

// Intentar leer desde variable o config.json
let SHEETS_API_URL = process.env.SHEETS_API_URL;
if (!SHEETS_API_URL) {
  const configPath = path.join(__dirname, '../config.json');
  if (fs.existsSync(configPath)) {
    const config = require(configPath);
    SHEETS_API_URL = config.sheetsApiUrl;
  }
}
if (!SHEETS_API_URL) {
  console.error("❌ No se encontró SHEETS_API_URL ni en variables ni en config.json");
}

router.post("/login", async (req, res) => {
  const { usuario, clave } = req.body;

  try {
    const response = await axios.get(`${SHEETS_API_URL}?action=getUsuarios`);
    const usuarios = response.data;

    const user = usuarios.find(
      (u) =>
        u.Usuario &&
        u.Clave &&
        u.Usuario.toString().trim().toLowerCase() === usuario.toString().trim().toLowerCase() &&
        u.Clave.toString().trim() === clave.toString().trim()
    );

    if (user) {
      req.session.usuario = {
        nombre: user.Usuario,
        rol: user.Rol,
      };
      return res.redirect("/ordenes");
    } else {
      return res.send(
        "<script>alert('Usuario o clave incorrectos'); window.location='/';</script>"
      );
    }
  } catch (error) {
    console.error("Error al verificar usuarios:", error.message);
    return res.send(
      "<script>alert('Error al verificar usuarios.'); window.location='/';</script>"
    );
  }
});

module.exports = router;
