import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de estado
app.get('/status', (req,res)=>{
  res.json({ok:true,mensaje:"Servidor activo 🚀"});
});

// Inicializar encabezados en Google Sheets
async function initSheet(){
  try{
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const sheets = google.sheets({version:'v4',auth});
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'A1:G1'
    });
    const rows = result.data.values||[];
    if(rows.length===0){
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: 'A1:G1',
        valueInputOption: 'RAW',
        requestBody:{values:[['radicado','fecha','inquilino','descripcion','tecnico','estado','link_pdf']]}
      });
      console.log("Encabezados iniciales agregados a Google Sheets ✅");
    } else {
      console.log("Google Sheets ya tiene encabezados ✅");
    }
  }catch(err){
    console.error("Error inicializando Google Sheets:",err.message);
  }
}

initSheet();

// Ruta raíz: login
app.get('/', (req,res)=>{
  res.sendFile(path.join(__dirname,'public','login.html'));
});

app.listen(process.env.PORT||3000, ()=>console.log("BlueHome OS v10.2.1 corriendo 🚀"));
