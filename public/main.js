// ==== LOGIN ====
async function login() {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;

  try {
    const res = await fetch("/api/usuarios");
    const usuarios = await res.json();
    console.log("Usuarios cargados:", usuarios);
    const encontrado = usuarios.find(u => 
      (u.user === user || u.usuario === user) && 
      (u.pass === pass || u.clave === pass)
    );

    if (encontrado) {
      localStorage.setItem("logueado", "true");
      localStorage.setItem("rol", encontrado.rol);
      localStorage.setItem("usuario", encontrado.user || encontrado.usuario);
      window.location.href = "index.html";
    } else {
      alert("Credenciales incorrectas");
    }
  } catch (err) {
    console.error("Error cargando usuarios:", err);
    alert("❌ Error al verificar usuarios. Revisa el backend.");
  }
}

function logout() {
  localStorage.removeItem("logueado");
  localStorage.removeItem("rol");
  localStorage.removeItem("usuario");
  window.location.href = "/login.html";
}

// ==== USUARIOS ====
async function cargarUsuarios() {
  const res = await fetch("/api/usuarios");
  const usuarios = await res.json();
  const tbody = document.querySelector("#tablaUsuarios tbody");
  tbody.innerHTML = "";
  usuarios.forEach(u => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${u.user || u.usuario}</td>
      <td><input type='text' value='${u.rol}'></td>
      <td><input type='password' value='${u.pass || u.clave}'></td>
      <td>
        <button onclick="guardarUsuario('${u.user || u.usuario}', this)">Guardar</button>
        <button onclick="eliminarUsuario('${u.user || u.usuario}')">Eliminar</button>
      </td>`;
    tbody.appendChild(row);
  });
}

async function guardarUsuario(user, btn) {
  const row = btn.parentElement.parentElement;
  const rol = row.cells[1].children[0].value;
  const pass = row.cells[2].children[0].value;
  await fetch("/api/usuarios/" + user, { 
    method: "PUT", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify({ rol, pass }) 
  });
  cargarUsuarios();
}

async function eliminarUsuario(user) {
  await fetch("/api/usuarios/" + user, { method: "DELETE" });
  cargarUsuarios();
}

// ==== ÓRDENES ====
async function cargarOrdenes() {
  const estadoFiltro = document.getElementById("filtroEstado")?.value || "Todos";
  const res = await fetch("/api/ordenes");
  let ordenes = await res.json();
  if (estadoFiltro !== "Todos") {
    ordenes = ordenes.filter(o => o.estado === estadoFiltro);
  }
  const tbody = document.querySelector("#tablaOrdenes tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  ordenes.forEach(o => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${o.radicado}</td>
      <td>${o.inquilino}</td>
      <td>${o.descripcion}</td>
      <td><input type='text' value='${o.tecnico || ""}'></td>
      <td><input type='text' value='${o.estado}'></td>
      <td>${o.fecha}</td>
      <td><button onclick="guardarOrden('${o.radicado}', this)">Guardar</button></td>`;
    tbody.appendChild(row);
  });
}

async function guardarOrden(radicado, btn) {
  const row = btn.parentElement.parentElement;
  const tecnico = row.cells[3].children[0].value;
  const estado = row.cells[4].children[0].value;
  await fetch("/api/ordenes/" + radicado, { 
    method: "PUT", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify({ tecnico, estado }) 
  });
  cargarOrdenes();
}

// ==== DOM READY ====
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (["/index.html", "/usuarios.html", "/ordenes.html"].some(p => path.endsWith(p))) {
    if (localStorage.getItem("logueado") !== "true") {
      alert("⚠️ Sesión expirada, vuelve a iniciar sesión");
      window.location.href = "/login.html";
      return;
    }
  }

  if (path.endsWith("usuarios.html")) {
    if (localStorage.getItem("rol") !== "SuperAdmin") {
      alert("Acceso denegado");
      window.location.href = "index.html";
      return;
    }
    cargarUsuarios();
    document.getElementById("usuarioForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const nuevo = {
        user: document.getElementById("nuevoUser").value,
        pass: document.getElementById("nuevoPass").value,
        rol: document.getElementById("nuevoRol").value
      };
      await fetch("/api/usuarios", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(nuevo) 
      });
      cargarUsuarios();
      e.target.reset();
    });
  }

  if (path.endsWith("ordenes.html")) {
    cargarOrdenes();
    document.getElementById("ordenForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const orden = {
        fecha: new Date().toLocaleString(),
        inquilino: document.getElementById("inquilino").value,
        descripcion: document.getElementById("descripcion").value,
        tecnico: document.getElementById("tecnico").value,
        estado: document.getElementById("estado").value
      };
      const res = await fetch("/api/ordenes", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(orden) 
      });
      const data = await res.json();
      if (data.radicado) {
        document.getElementById("mensaje").innerText = "✅ Orden generada con radicado: " + data.radicado;
      } else {
        document.getElementById("mensaje").innerText = "❌ Error creando orden";
      }
      e.target.reset();
      cargarOrdenes();
    });
  }
});
