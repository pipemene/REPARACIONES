function doGet(e) {
  const action = e.parameter.action;

  if (action === "getOrdenes") {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ordenes");
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const ordenes = data.map(r => ({
      id: r[0],
      fecha: r[1],
      cliente: r[2],
      descripcion: r[3],
      tecnicoId: r[4],
      estado: r[5]
    }));
    return ContentService.createTextOutput(JSON.stringify(ordenes)).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "getTecnicos") {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("tecnicos");
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const tecnicos = data.map(r => ({
      id: r[0],
      nombre: r[1]
    }));
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
        sheet.getRange(i + 1, 5).setValue(tecnicoId);
        sheet.getRange(i + 1, 6).setValue(estado);
        break;
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  }
}
