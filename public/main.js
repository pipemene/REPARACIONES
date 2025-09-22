function login() {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;
  if (user === "admin" && pass === "1234") {
    window.location.href = "index.html";
  } else {
    alert("Credenciales incorrectas");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("ordenForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const orden = {
        fecha: new Date().toISOString(),
        inquilino: document.getElementById("inquilino").value,
        descripcion: document.getElementById("descripcion").value,
        tecnico: document.getElementById("tecnico").value,
        estado: document.getElementById("estado").value
      };
      try {
        const res = await fetch("/api/ordenes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orden)
        });
        const data = await res.json();
        document.getElementById("resultado").innerText = JSON.stringify(data);
      } catch (err) {
        document.getElementById("resultado").innerText = "Error creando orden";
      }
    });
  }
});
