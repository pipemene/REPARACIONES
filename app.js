const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'bluehome_secret',
  resave: false,
  saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rutas
const usuariosRoutes = require('./routes/usuarios');
app.use('/', usuariosRoutes);

const ordenesRoutes = require('./routes/ordenes');
app.use('/ordenes', ordenesRoutes);

// Ruta raíz muestra login
app.get('/', (req, res) => {
  res.render('login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
