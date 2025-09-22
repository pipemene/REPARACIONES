function login() {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;

  // 🚨 Aquí van tus usuarios/contraseñas reales
  if (user === "admin" && pass === "1234") {
    localStorage.setItem("logueado", "true");
    window.location.href = "index.html";
  } else {
    alert("Credenciales incorrectas");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.endsWith("ordenes.html")) {
    if (localStorage.getItem("logueado") !== "true") {
      window.location.href = "login.html";
    }

    cargarOrdenes();

    const form = document.getElementById("ordenForm");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const orden = {
          fecha: new Date().toLocaleString(),
          inquilino: document.getElementById("inquilino").value,
          descripcion: document.getElementById("descripcion").value,
          tecnico: document.getElementById("tecnico").value,
          estado: document.getElementById("estado").value
        };
        try {
          const res = await fetch("/api/ordenes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orden)
          });
          const data = await res.json();

          if (data.radicado) {
            document.getElementById("mensaje").innerText =
              "✅ Orden generada con radicado: " + data.radicado;
          } else {
            document.getElementById("mensaje").innerText =
              "⚠️ Orden enviada pero no se recibió radicado";
          }

          form.reset();
          cargarOrdenes();
        } catch (err) {
          document.getElementById("mensaje").innerText = "❌ Error creando orden";
        }
      });
    }
  }
});

async function cargarOrdenes() {
  try {
    const res = await fetch("/api/ordenes");
    const ordenes = await res.json();

    const tbody = document.querySelector("#tablaOrdenes tbody");
    tbody.innerHTML = "";

    ordenes.forEach((o, index) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${o.radicado}</td>
        <td>${o.inquilino}</td>
        <td>${o.descripcion}</td>
        <td>${o.tecnico}</td>
        <td>${o.estado}</td>
        <td>${o.fecha}</td>
        <td>
          <button onclick="editarFila(${index})">Editar</button>
          <button onclick="guardarFila(${index})" style="display:none;">Guardar</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Error cargando órdenes:", err);
  }
}

function editarFila(index) {
  const tbody = document.querySelector("#tablaOrdenes tbody");
  const row = tbody.rows[index];

  // Inquilino
  const inq = row.cells[1].innerText;
  row.cells[1].innerHTML = `<input type='text' value='${inq}'>`;

  // Descripción
  const desc = row.cells[2].innerText;
  row.cells[2].innerHTML = `<input type='text' value='${desc}'>`;

  // Técnico
  const tec = row.cells[3].innerText;
  row.cells[3].innerHTML = `<input type='text' value='${tec}'>`;

  // Estado como select
  const est = row.cells[4].innerText;
  row.cells[4].innerHTML = `
    <select>
      <option value="Pendiente" ${est === "Pendiente" ? "selected" : ""}>Pendiente</option>
      <option value="En Proceso" ${est === "En Proceso" ? "selected" : ""}>En Proceso</option>
      <option value="Finalizado" ${est === "Finalizado" ? "selected" : ""}>Finalizado</option>
    </select>`;

  row.cells[6].children[0].style.display = "none"; // Editar
  row.cells[6].children[1].style.display = "inline"; // Guardar
}

function guardarFila(index) {
  const tbody = document.querySelector("#tablaOrdenes tbody");
  const row = tbody.rows[index];

  const inq = row.cells[1].children[0].value;
  const desc = row.cells[2].children[0].value;
  const tec = row.cells[3].children[0].value;
  const est = row.cells[4].children[0].value;

  row.cells[1].innerText = inq;
  row.cells[2].innerText = desc;
  row.cells[3].innerText = tec;
  row.cells[4].innerText = est;

  row.cells[6].children[0].style.display = "inline"; // Editar
  row.cells[6].children[1].style.display = "none"; // Guardar
}

function logout() {
  localStorage.removeItem("logueado");
  window.location.href = "login.html";
}
