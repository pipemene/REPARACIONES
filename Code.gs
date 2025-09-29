function doGet(e) {
  const action = e.parameter.action;
  if (action === "getOrdenes") {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ordenes");
    const data = sheet.getDataRange().getValues();
    data.shift();
    const ordenes = data.map(r => ({
      id: r[0],
      fecha: r[1],
      cliente: r[2],
      telefono: r[3],
      codigo: r[4],
      descripcion: r[5],
      tecnicoId: r[6],
      estado: r[7]
    }));
    return ContentService.createTextOutput(JSON.stringify(ordenes)).setMimeType(ContentService.MimeType.JSON);
  }
  if (action === "getTecnicos") {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("tecnicos");
    const data = sheet.getDataRange().getValues();
    data.shift();
    const tecnicos = data.map(r => ({ id: r[0], nombre: r[1] }));
    return ContentService.createTextOutput(JSON.stringify(tecnicos)).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const action = e.parameter.action;
  const body = JSON.parse(e.postData.contents);
  if (action === "updateOrden") {
    const { id, tecnicoId, estado } = body;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ordenes");
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.getRange(i+1, 7).setValue(tecnicoId);
        sheet.getRange(i+1, 8).setValue(estado);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success:true}));
  }
  if (action === "finalizarOrden") {
    const { id, observaciones, fotos, firma } = body;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ordenes");
    const data = sheet.getDataRange().getValues();
    for (let i=1;i<data.length;i++){
      if (data[i][0] == id){
        sheet.getRange(i+1,8).setValue("Finalizada");
        sheet.getRange(i+1,9).setValue(observaciones);
        sheet.getRange(i+1,10).setValue(fotos.join(","));
        sheet.getRange(i+1,11).setValue(firma);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success:true}));
  }
}
