
import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// Cargar usuarios desde users.json
let users = [];
try {
  const data = fs.readFileSync('users.json');
  users = JSON.parse(data);
  console.log("✅ Usuarios cargados:", users.map(u => `'${u.username} (${u.role})'`));
} catch (err) {
  console.error("❌ Error cargando usuarios:", err);
}

// Ruta login con debug
app.post("/api/login", (req, res) => {
  console.log("📩 Body recibido:", req.body); // DEBUG

  const { username, password } = req.body;
  console.log("🟡 Intento de login ->", username, password);

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    console.log("❌ Usuario no encontrado:", username);
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  console.log("✅ Login correcto:", username);
  res.json({ usuario: user.username, rol: user.role });
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
});
