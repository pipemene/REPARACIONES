import express from 'express';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { google } from 'googleapis';

const app = express();
app.use(express.json());

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
app.post('/api/ordenes/:radicado/pdf', async (req,res)=>{
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

app.listen(process.env.PORT || 3000, ()=>{
  console.log('BlueHome OS v10.1 corriendo');
});
