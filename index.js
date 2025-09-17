import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// Usuarios válidos
const users = [
  { username: 'PIPEMENE', password: 'Blu3h0m32016#', role: 'Superadmin' },
  { username: 'ARRENDAMIENTOS', password: 'Bluehome2016', role: 'Administrador' },
  { username: 'Dayan', password: 'bluehome2016', role: 'Técnico' },
  { username: 'Mauricio', password: 'bluehome2016', role: 'Técnico' },
  { username: 'Jair', password: 'bluehome2016', role: 'Técnico' },
  { username: 'Juandavid', password: 'bluehome2016', role: 'Técnico' }
];

// Ruta de login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// Middleware para validar token
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'Token requerido' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = decoded;
    next();
  });
}

// Ruta para obtener info de usuario
app.get('/api/user', verifyToken, (req, res) => {
  res.json({ username: req.user.username, role: req.user.role });
});

// Cliente Drive
function getDriveClient(){
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });
  return google.drive({ version: 'v3', auth });
}

// Generar y subir PDF
app.post('/api/ordenes/:radicado/pdf', verifyToken, async (req,res)=>{
  try{
    const radicado = req.params.radicado;
    const doc = new PDFDocument();
    const pdfPath = `/tmp/${radicado}.pdf`;
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);
    doc.fontSize(20).text(`Orden ${radicado}`, {align:'center'});
    doc.end();
    await new Promise(r=>stream.on('finish',r));

    const drive = getDriveClient();
    const folderId = process.env.GOOGLE_FOLDER_ID;
    const fileMeta = { name: `${radicado}.pdf`, parents:[folderId] };
    const media = { mimeType:'application/pdf', body: fs.createReadStream(pdfPath) };
    const upload = await drive.files.create({ resource:fileMeta, media, fields:'id,webViewLink' });

    await drive.permissions.create({
      fileId: upload.data.id,
      requestBody: { role:'reader', type:'anyone' }
    });

    res.json({ link: upload.data.webViewLink });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: 'Error generando o subiendo PDF' });
  }
});

// Ruta principal sirve login.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(process.env.PORT || 3000, ()=>{
  console.log('BlueHome OS v10.1.2 corriendo');
});
