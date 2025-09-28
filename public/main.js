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
  } catch (err) { alert("Error al verificar usuarios."); }
}

function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}

function getUser() {
  return JSON.parse(localStorage.getItem("usuario"));
}

function validarSesion() {
  const user = getUser();
  if (!user && !window.location.href.includes("login.html")) {
    window.location.href = "login.html";
  }
}

// ... aquí irían las demás funciones de usuarios y órdenes (crearOrden, cargarOrdenes, etc.)
// Se mantiene la lógica con validaciones y alertas claras.
