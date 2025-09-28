const API_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL";

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
  } catch (err) { alert("Error al verificar usuarios."); }
}

function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}

async function crearUsuario() {
  const nuevoUser = document.getElementById("nuevoUser").value;
  const nuevoPass = document.getElementById("nuevoPass").value;
  const nuevoRol = document.getElementById("nuevoRol").value;
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "addUsuario", user: nuevoUser, pass: nuevoPass, rol: nuevoRol })
  });
  const data = await res.json();
  if (data.ok) {
    alert("Usuario creado con ID: " + data.id);
  } else { alert("Error al crear usuario"); }
}

async function crearOrden() {
  const fecha = document.getElementById("fecha").value;
  const inquilino = document.getElementById("inquilino").value;
  const telefono = document.getElementById("telefono").value;
  const codigoInmueble = document.getElementById("codigoInmueble").value;
  const descripcion = document.getElementById("descripcion").value;

  if (!fecha || !inquilino || !telefono || !codigoInmueble || !descripcion) {
    alert("⚠️ Todos los campos son obligatorios");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addOrden",
        fecha,
        inquilino,
        telefono,
        codigo: codigoInmueble,
        descripcion,
        tecnico: "",
        estado: "Pendiente"
      })
    });
    const data = await res.json();
    if (data.radicado) {
      alert("✅ Orden creada con radicado: " + data.radicado);
    } else {
      alert("❌ No se pudo crear la orden, revisa los campos o la conexión.");
    }
  } catch (error) {
    console.error("Error al crear orden:", error);
    alert("❌ Error de conexión al crear la orden.");
  }
}