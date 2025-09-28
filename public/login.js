document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const usuario = document.getElementById("usuario").value;
    const clave = document.getElementById("clave").value;

    fetch(`${CONFIG.API_URL}?action=getUsuarios`)
      .then(res => res.json())
      .then(data => {
        const encontrado = data.find(u => u.user === usuario && u.pass === clave);
        if (encontrado) {
          sessionStorage.setItem("usuario", JSON.stringify(encontrado));
          window.location.href = "main.html";
        } else {
          alert("Credenciales incorrectas");
        }
      })
      .catch(err => {
        alert("Error al verificar usuarios.");
        console.error(err);
      });
  });
});