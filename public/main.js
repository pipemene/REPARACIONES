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

async function cargarResumen() {
  try {
    const res = await fetch(API_URL + "?action=getOrdenes");
    const ordenes = await res.json();

    const pendientes = ordenes.filter(o => o.estado.toLowerCase() === "pendiente").length;
    const proceso = ordenes.filter(o => o.estado.toLowerCase() === "en proceso").length;
    const finalizadas = ordenes.filter(o => o.estado.toLowerCase() === "finalizada").length;

    document.getElementById("pendientesCount").innerText = pendientes;
    document.getElementById("procesoCount").innerText = proceso;
    document.getElementById("finalizadasCount").innerText = finalizadas;
  } catch (error) {
    console.error("Error cargando resumen:", error);
  }
}