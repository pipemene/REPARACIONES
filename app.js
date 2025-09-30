require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const ordenesRoutes = require("./routes/ordenes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/ordenes", ordenesRoutes);

// raíz opcional: redirigir a /ordenes
app.get("/", (req, res) => res.redirect("/ordenes"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
