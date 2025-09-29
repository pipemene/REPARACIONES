function logout() { localStorage.removeItem("usuario"); window.location.href = "login.html"; }

async function crearUsuario() {
  const nuevoUser = document.getElementById("nuevoUser").value;
  const nuevoPass = document.getElementById("nuevoPass").value;
  const nuevoRol = document.getElementById("nuevoRol").value;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addUsuario", user: nuevoUser, pass: nuevoPass, rol: nuevoRol })
    });
    const data = await res.json();
    if (data.ok) alert("Usuario creado con ID: " + data.id);
    else alert("Error al crear usuario");
  } catch (err) {
    console.error("Error creando usuario:", err);
    alert("Error al crear usuario.");
  }
}