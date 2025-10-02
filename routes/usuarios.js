const express = require("express");
const router = express.Router();
const axios = require("axios");

const SHEETS_API_URL = process.env.SHEETS_API_URL;

if (!SHEETS_API_URL) {
  console.error("❌ No se encontró SHEETS_API_URL en variables de entorno");
}

router.post("/login", async (req, res) => {
  const { usuario, clave } = req.body;

  try {
    const response = await axios.get(`${SHEETS_API_URL}?action=getUsuarios`);
    const usuarios = response.data;

    const user = usuarios.find(
      (u) =>
        (u.usuario || u.Usuario) === usuario &&
        (u.clave || u.Clave) === clave
    );

    if (user) {
      req.session.usuario = {
        nombre: user.usuario || user.Usuario,
        rol: user.rol || user.Rol,
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

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
