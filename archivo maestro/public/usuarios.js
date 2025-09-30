document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("tablaUsuarios");

  fetch(`${CONFIG.API_URL}?action=getUsuarios`)
    .then(res => res.json())
    .then(data => {
      renderUsuarios(data);
    })
    .catch(err => console.error("Error al cargar usuarios:", err));

  function renderUsuarios(lista) {
    tabla.innerHTML = "";
    lista.forEach(u => {
      const fila = `
        <tr>
          <td>${u.user}</td>
          <td>${u.rol}</td>
        </tr>`;
      tabla.insertAdjacentHTML("beforeend", fila);
    });
  }
});