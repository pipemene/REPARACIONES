function login() {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;

  // 🚨 Aquí debes poner tus usuarios/contraseñas reales (mantendré lo que ya definiste)
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
    const ordenes = await res.json();

    const tbody = document.querySelector("#tablaOrdenes tbody");
    tbody.innerHTML = "";

    ordenes.forEach(o => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${o.radicado}</td>
        <td>${o.inquilino}</td>
        <td>${o.descripcion}</td>
        <td>${o.tecnico}</td>
        <td>${o.estado}</td>
        <td>${o.fecha}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Error cargando órdenes:", err);
  }
}

function logout() {
  localStorage.removeItem("logueado");
  window.location.href = "login.html";
}
