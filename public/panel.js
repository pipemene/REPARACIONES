async function cargarResumen() {
  try {
    const res = await fetch(CONFIG.API_URL + "?action=getOrdenes");
    const ordenes = await res.json();

    const pendientes = ordenes.filter(o => o.estado.toLowerCase() === "pendiente").length;
    const proceso = ordenes.filter(o => o.estado.toLowerCase() === "en proceso").length;
    const finalizadas = ordenes.filter(o => o.estado.toLowerCase() === "finalizada").length;

    document.getElementById("pendientesCount").innerText = pendientes;
    document.getElementById("procesoCount").innerText = proceso;
    document.getElementById("finalizadasCount").innerText = finalizadas;

    const ctx = document.getElementById("graficoOrdenes").getContext("2d");
    new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Pendientes", "En Proceso", "Finalizadas"],
        datasets: [{
          data: [pendientes, proceso, finalizadas],
          backgroundColor: ["#ff9800", "#2196f3", "#4caf50"]
        }]
      }
    });
  } catch (error) {
    console.error("Error cargando resumen:", error);
  }
}

document.addEventListener("DOMContentLoaded", cargarResumen);