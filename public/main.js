async function login() {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;

  try {
    const res = await fetch("/api/usuarios");
    const usuarios = await res.json();

    const encontrado = usuarios.find(u => u.username === user && u.password === pass);

    if (encontrado) {
      localStorage.setItem("logueado", "true");
      localStorage.setItem("usuario", encontrado.username);
      localStorage.setItem("rol", encontrado.role);

      if (encontrado.role === "superadmin") {
        window.location.href = "usuarios.html";
      } else {
        window.location.href = "index.html";
      }
    } else {
      alert("Credenciales incorrectas");
    }
  } catch (err) {
    alert("Error validando usuario");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.endsWith("index.html") || window.location.pathname.endsWith("usuarios.html")) {
    if (localStorage.getItem("logueado") !== "true") {
      window.location.href = "login.html";
    }
  }
});

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

async function cargarUsuarios() {
  const res = await fetch("/api/usuarios");
  const usuarios = await res.json();

  const tabla = document.getElementById("tablaUsuarios");
  if (!tabla) return;

  tabla.innerHTML = usuarios.map(u => `
    <tr>
      <td>${u.username}</td>
      <td>${u.role}</td>
      <td>
        <button onclick="editarUsuario('${u.username}')">✏️ Editar</button>
        <button onclick="eliminarUsuario('${u.username}')">🗑️ Eliminar</button>
      </td>
    </tr>
  `).join("");
}

function mostrarFormulario(username="") {
  document.getElementById("formModal").style.display = "block";
  document.getElementById("tituloForm").innerText = username ? "Editar Usuario" : "Nuevo Usuario";
  document.getElementById("username").value = username;
}

function cerrarFormulario() {
  document.getElementById("formModal").style.display = "none";
}

async function guardarUsuario() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  const payload = { username: user, password: pass, role };

  const method = document.getElementById("tituloForm").innerText.includes("Editar") ? "PUT" : "POST";
  const url = method === "PUT" ? `/api/usuarios/${user}` : "/api/usuarios";

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  cerrarFormulario();
  cargarUsuarios();
}

async function editarUsuario(username) {
  mostrarFormulario(username);
}

async function eliminarUsuario(username) {
  if (confirm("¿Seguro que deseas eliminar este usuario?")) {
    await fetch(`/api/usuarios/${username}`, { method: "DELETE" });
    cargarUsuarios();
  }
}

document.addEventListener("DOMContentLoaded", cargarUsuarios);
