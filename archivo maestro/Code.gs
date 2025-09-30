// Extensión para manejar finalizarOrden
function doPost(e) {
  const action = e.parameter.action;
  const body = JSON.parse(e.postData.contents);

  if (action === "finalizarOrden") {
    const { id, observaciones, fotos, firma } = body;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ordenes");
    const data = sheet.getDataRange().getValues();
    for (let i=1;i<data.length;i++){
      if (data[i][0] == id){
        sheet.getRange(i+1,8).setValue("Finalizada"); // Estado
        sheet.getRange(i+1,9).setValue(observaciones);
        sheet.getRange(i+1,10).setValue(fotos.join(","));
        sheet.getRange(i+1,11).setValue(firma);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success:true}));
  }
}
