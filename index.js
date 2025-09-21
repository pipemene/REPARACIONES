import express from 'express';
import fs from 'fs';
import path from 'path';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let users = [];
try {
  const data = fs.readFileSync(path.join(__dirname, 'users.json'));
  users = JSON.parse(data);
  console.log("✅ Usuarios cargados:", users.map(u => u.username).join(", "));
} catch (err) {
  console.error("❌ Error cargando usuarios:", err);
}

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log("📩 Body recibido:", req.body);

  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    console.log(`✅ Login correcto: ${username} (${user.role})`);
    res.json({ success: true, role: user.role, username: user.username });
  } else {
    console.log(`❌ Usuario o contraseña inválida: ${username}`);
    res.status(401).json({ success: false, message: "Credenciales inválidas" });
  }
});

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
});
