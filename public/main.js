const API_URL = "https://script.google.com/macros/s/AKfycbzxafMgpA3zEFBlbQJoSu0knbUYaNDxXC0EG_O36Emn4Tt1NUU5UE6piW2XCCh6NuzQYw/exec";

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(API_URL + "?action=getUsuarios");
    const usuarios = await res.json();

    const user = usuarios.find(u => u.user === username && u.pass === password);
    if (user) {
      localStorage.setItem("usuario", JSON.stringify(user));
      window.location.href = "index.html";
    } else {
      alert("Credenciales incorrectas");
    }
  } catch (err) {
    alert("Error al verificar usuarios. Revisa el backend.");
  }
}

async function cargarUsuarios() {
  const res = await fetch(API_URL + "?action=getUsuarios");
  const usuarios = await res.json();
  const tbody = document.querySelector("#usuariosTable tbody");
  tbody.innerHTML = "";
  usuarios.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${u.user}</td><td>${u.rol}</td>`;
    tbody.appendChild(tr);
  });
}

async function cargarOrdenes() {
  const res = await fetch(API_URL + "?action=getOrdenes");
  const ordenes = await res.json();
  const tbody = document.querySelector("#ordenesTable tbody");
  tbody.innerHTML = "";
  ordenes.forEach(o => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${o.radicado}</td><td>${o.fecha}</td><td>${o.inquilino}</td><td>${o.descripcion}</td><td>${o.tecnico}</td><td>${o.estado}</td>`;
    tbody.appendChild(tr);
  });
}

function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("usuariosTable")) cargarUsuarios();
  if (document.getElementById("ordenesTable")) cargarOrdenes();
});