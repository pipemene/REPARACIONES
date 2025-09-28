document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("ordenForm");
  const tabla = document.getElementById("tablaOrdenes");
  const buscador = document.getElementById("buscador");
  let ordenesGlobal = [];

  // Cargar órdenes al iniciar
  fetch(`${CONFIG.API_URL}?action=getOrdenes`)
    .then(res => res.json())
    .then(data => {
      ordenesGlobal = data;
      renderOrdenes(data);
    })
    .catch(err => console.error("Error al cargar órdenes:", err));

  // Crear orden
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const inquilino = document.getElementById("inquilino").value;
    const telefono = document.getElementById("telefono").value;
    const codigo = document.getElementById("codigo").value;
    const descripcion = document.getElementById("descripcion").value;
    const fecha = new Date().toLocaleDateString("es-CO");

    fetch(CONFIG.API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "addOrden",
        fecha,
        inquilino,
        telefono,
        codigo,
        descripcion,
        tecnico: "",
        estado: "Pendiente"
      })
    })
      .then(res => res.json())
      .then(resp => {
        alert("Orden creada con radicado: " + resp.radicado);
        location.reload();
      })
      .catch(err => {
        alert("Error al crear la orden.");
        console.error(err);
      });
  });

  // Filtro dinámico
  buscador.addEventListener("input", () => {
    const texto = buscador.value.toLowerCase();
    const filtradas = ordenesGlobal.filter(o =>
      o.inquilino.toLowerCase().includes(texto) ||
      o.codigo.toLowerCase().includes(texto)
    );
    renderOrdenes(filtradas);
  });

  function renderOrdenes(lista) {
    tabla.innerHTML = "";
    lista.forEach(o => {
      const fila = `
        <tr>
          <td>${o.radicado}</td>
          <td>${o.fecha}</td>
          <td>${o.inquilino}</td>
          <td>${o.telefono}</td>
          <td>${o.codigo}</td>
          <td>${o.descripcion}</td>
          <td>${o.tecnico}</td>
          <td>${o.estado}</td>
        </tr>`;
      tabla.insertAdjacentHTML("beforeend", fila);
    });
  }
});