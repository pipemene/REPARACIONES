// URL de tu Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbzxafMgpA3zEFBlbQJoSu0knbUYaNDxXC0EG_O36Emn4Tt1NUU5UE6piW2XCCh6NuzQYw/exec";

// Guardar sesión
function setSession(user) {
    localStorage.setItem("usuario", JSON.stringify(user));
}

// Obtener sesión
function getSession() {
    return JSON.parse(localStorage.getItem("usuario"));
}

// Cerrar sesión
function logout() {
    localStorage.removeItem("usuario");
    window.location.href = "login.html";
}

// LOGIN
async function login(username, password) {
    try {
        const response = await fetch(`${API_URL}?action=getUsuarios`);
        const usuarios = await response.json();

        const user = usuarios.find(
            u => u.user === username && u.pass === password
        );

        if (user) {
            setSession(user);
            window.location.href = "index.html";
        } else {
            alert("Credenciales incorrectas");
        }
    } catch (error) {
        console.error("Error en login:", error);
        alert("Error al verificar usuarios. Revisa la conexión.");
    }
}

// Verificación de login en cada página
function checkAuth(requiredRoles = []) {
    const user = getSession();
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(user.rol)) {
        alert("No tienes permiso para acceder aquí");
        window.location.href = "index.html";
    }
}
