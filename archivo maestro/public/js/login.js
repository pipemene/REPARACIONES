async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  try {
    const res = await fetch(API_URL + "?action=getUsuarios");
    const usuarios = await res.json();
    const user = usuarios.find(u => u.user === username && u.pass === password);
    if (user) {
      localStorage.setItem("usuario", JSON.stringify(user));
      window.location.href = "panel.html";
    } else {
      alert("Credenciales incorrectas");
    }
  } catch (err) {
    alert("Error al verificar usuarios.");
    console.error(err);
  }
}