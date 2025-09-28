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
    alert("Error al verificar usuarios.");
  }
}

function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}

function getUser() {
  return JSON.parse(localStorage.getItem("usuario"));
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

async function crearUsuario() {
  const nuevoUser = document.getElementById("nuevoUser").value;
  const nuevoPass = document.getElementById("nuevoPass").value;
  const nuevoRol = document.getElementById("nuevoRol").value;
  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "addUsuario", user: nuevoUser, pass: nuevoPass, rol: nuevoRol })
  });
  cargarUsuarios();
}

async function cargarOrdenes() {
  const user = getUser();
  const res = await fetch(API_URL + "?action=getOrdenes");
  const ordenes = await res.json();
  const tbody = document.querySelector("#ordenesTable tbody");
  tbody.innerHTML = "";
  ordenes.forEach(o => {
    // Filtrar según rol
    if (user.rol === "tecnico" && !(o.tecnico === "" || o.tecnico === user.user)) return;
    let estadoBadge = "";
    if (o.estado === "Pendiente") estadoBadge = '<span class="badge badge-pendiente">Pendiente</span>';
    else if (o.estado === "En Proceso") estadoBadge = '<span class="badge badge-proceso">En Proceso</span>';
    else if (o.estado === "Finalizada") estadoBadge = '<span class="badge badge-finalizada">Finalizada</span>';
    let acciones = "";
    if (user.rol === "tecnico" && o.estado === "Pendiente") {
      acciones += `<button onclick="tomarOrden('${o.radicado}')">Tomar</button>`;
    }
    if ((user.rol === "tecnico" && o.tecnico === user.user && o.estado === "En Proceso") ||
        user.rol !== "tecnico") {
      if (o.estado !== "Finalizada") {
        acciones += `<button onclick="finalizarOrden('${o.radicado}')">Finalizar</button>`;
      }
    }
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${o.radicado}</td><td>${o.fecha}</td><td>${o.inquilino}</td><td>${o.descripcion}</td><td>${o.tecnico}</td><td>${estadoBadge}</td><td>${acciones}</td>`;
    tbody.appendChild(tr);
  });
}

async function crearOrden() {
  const fecha = document.getElementById("fecha").value;
  const inquilino = document.getElementById("inquilino").value;
  const descripcion = document.getElementById("descripcion").value;
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "addOrden", fecha, inquilino, descripcion, tecnico: "", estado: "Pendiente" })
  });
  const data = await res.json();
  alert("Orden creada con radicado: " + data.radicado);
  cargarOrdenes();
}

async function tomarOrden(radicado) {
  const user = getUser();
  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "updateOrden", radicado, tecnico: user.user, estado: "En Proceso" })
  });
  cargarOrdenes();
}

async function finalizarOrden(radicado) {
  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "updateOrden", radicado, tecnico: "", estado: "Finalizada" })
  });
  cargarOrdenes();
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("usuariosTable")) cargarUsuarios();
  if (document.getElementById("ordenesTable")) cargarOrdenes();
});
