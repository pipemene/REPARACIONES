// ==== LOGIN ====
async function login() {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;

  const res = await fetch("/usuarios.json");
  const usuarios = await res.json();
  const encontrado = usuarios.find(u => u.user === user && u.pass === pass);

  if (encontrado) {
    localStorage.setItem("logueado", "true");
    localStorage.setItem("rol", encontrado.rol);
    localStorage.setItem("usuario", encontrado.user);
    window.location.href = "index.html";
  } else {
    alert("Credenciales incorrectas");
  }
}

function logout() {
  localStorage.removeItem("logueado");
  localStorage.removeItem("rol");
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}

// ==== DOM READY ====
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  // Gestión de usuarios
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

  // Órdenes
  if (path.endsWith("ordenes.html")) {
    if (localStorage.getItem("logueado") !== "true") {
      window.location.href = "login.html";
    }
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

// ==== GESTIÓN DE USUARIOS ====
async function cargarUsuarios() {
  const res = await fetch("/usuarios.json");
  const usuarios = await res.json();
  const tbody = document.querySelector("#tablaUsuarios tbody");
  tbody.innerHTML = "";
  usuarios.forEach(u => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${u.user}</td>
      <td><input type='text' value='${u.rol}'></td>
      <td><input type='password' value='${u.pass}'></td>
      <td>
        <button onclick="guardarUsuario('${u.user}', this)">Guardar</button>
        <button onclick="eliminarUsuario('${u.user}')">Eliminar</button>
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
  try {
    const filtro = document.getElementById("filtroEstado").value;
    const rol = localStorage.getItem("rol");
    const usuario = localStorage.getItem("usuario");

    const res = await fetch("/api/ordenes");
    let ordenes = await res.json();

    // Filtrar por rol
    if (rol === "Tecnico") {
      ordenes = ordenes.filter(o => !o.tecnico || o.tecnico === usuario);
    }

    // Filtrar por estado
    if (filtro && filtro !== "Todos") {
      ordenes = ordenes.filter(o => o.estado === filtro);
    }

    const tbody = document.querySelector("#tablaOrdenes tbody");
    tbody.innerHTML = "";

    ordenes.forEach((o, index) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${o.radicado}</td>
        <td>${o.inquilino}</td>
        <td>${o.descripcion}</td>
        <td>${o.tecnico || ""}</td>
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

  const inq = row.cells[1].innerText;
  row.cells[1].innerHTML = `<input type='text' value='${inq}'>`;

  const desc = row.cells[2].innerText;
  row.cells[2].innerHTML = `<input type='text' value='${desc}'>`;

  const tec = row.cells[3].innerText;
  row.cells[3].innerHTML = `
    <select>
      <option value="">-- Sin asignar --</option>
      <option value="DAYAN" ${tec === "DAYAN" ? "selected" : ""}>DAYAN</option>
      <option value="MAURICIO" ${tec === "MAURICIO" ? "selected" : ""}>MAURICIO</option>
      <option value="JAIR" ${tec === "JAIR" ? "selected" : ""}>JAIR</option>
    </select>`;

  const est = row.cells[4].innerText;
  row.cells[4].innerHTML = `
    <select>
      <option value="Pendiente" ${est === "Pendiente" ? "selected" : ""}>Pendiente</option>
      <option value="En Proceso" ${est === "En Proceso" ? "selected" : ""}>En Proceso</option>
      <option value="Finalizado" ${est === "Finalizado" ? "selected" : ""}>Finalizado</option>
    </select>`;

  row.cells[6].children[0].style.display = "none";
  row.cells[6].children[1].style.display = "inline";
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

  row.cells[6].children[0].style.display = "inline";
  row.cells[6].children[1].style.display = "none";
}
