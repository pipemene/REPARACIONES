document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("ordenForm");
  const tabla = document.getElementById("tablaOrdenes");

  fetch(`${CONFIG.API_URL}?action=getOrdenes`)
    .then(res => res.json())
    .then(data => {
      renderOrdenes(data);
    })
    .catch(err => console.error("Error al cargar órdenes:", err));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fecha = document.getElementById("fecha").value;
    const inquilino = document.getElementById("inquilino").value;
    const telefono = document.getElementById("telefono").value;
    const codigo = document.getElementById("codigo").value;
    const descripcion = document.getElementById("descripcion").value;

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