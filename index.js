import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cargar usuarios desde users.json
const usersPath = path.join(__dirname, 'users.json');
let users = [];
if (fs.existsSync(usersPath)) {
  users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
}

// Ruta login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, username: user.username, role: user.role });
  } else {
    res.json({ success: false });
  }
});

// Placeholder órdenes para no romper frontend
app.get('/api/ordenes', (req, res) => {
  res.json({ ok: true, data: [] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
