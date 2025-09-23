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
  window.location.href = "/login.html";
}
