const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

router.get("/", async (req, res) => {
  try {
    const response = await fetch(process.env.SHEETS_API_URL + "?action=getOrdenes");
    const data = await response.json();

    res.render("ordenes", {
      ordenes: data || [],   // el array que manda tu Script
      tecnicos: []           // vacío por ahora
    });
  } catch (error) {
    console.error("Error cargando órdenes:", error);
    res.status(500).send("Error interno cargando órdenes");
  }
});

module.exports = router;
