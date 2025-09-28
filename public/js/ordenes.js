function logout() { localStorage.removeItem("usuario"); window.location.href = "login.html"; }

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
    if (data.radicado) alert("✅ Orden creada con radicado: " + data.radicado);
    else alert("❌ No se pudo crear la orden.");
  } catch (error) {
    console.error("Error al crear orden:", error);
    alert("❌ Error de conexión al crear la orden.");
  }
}