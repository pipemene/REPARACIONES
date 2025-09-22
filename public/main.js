function login() {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;

  if (user === "admin" && pass === "1234") {
    localStorage.setItem("logueado", "true");
    window.location.href = "index.html";
  } else {
    alert("Credenciales incorrectas");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.endsWith("index.html")) {
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
    const csv = await res.text();
    const filas = csv.trim().split("\n").map(r => r.split(","));

    const tbody = document.querySelector("#tablaOrdenes tbody");
    tbody.innerHTML = "";

    for (let i = 1; i < filas.length; i++) {
      const row = document.createElement("tr");
      filas[i].forEach(col => {
        const td = document.createElement("td");
        td.innerText = col;
        row.appendChild(td);
      });
      tbody.appendChild(row);
    }
  } catch (err) {
    console.error("Error cargando órdenes:", err);
  }
}

function logout() {
  localStorage.removeItem("logueado");
  window.location.href = "login.html";
}
