require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const ordenesRoutes = require("./routes/ordenes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

app.use("/ordenes", ordenesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
