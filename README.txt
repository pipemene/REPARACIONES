Hotfix UI v9.2.1
--------------------
Este paquete trae SOLO la vista 'public/panel.html' (y un styles.css vacío por si deseas sobreescribir).
Objetivo: eliminar los campos 'ID orden' y 'ID técnico' y reemplazarlos por listas desplegables.

Cómo instalar:
1) En tu repo despliegue, reemplaza 'public/panel.html' por el de este ZIP.
   (Opcional) Si quieres, también puedes copiar 'public/styles.css' para estilos mínimos del hotfix.
2) Haz deploy en Railway.
3) En tu navegador, fuerza recarga dura (Ctrl+F5) para evitar caché.
4) Verifica:
   - Admin/Superadmin: verás 'Selecciona una orden' y 'Selecciona un técnico' (sin IDs).
   - Técnico: verás 'Mis órdenes' y 'Sin asignar' (sin IDs).

El resto del backend no se toca. Este hotfix es compatible con radicado o id interno (usa radicado si existe).
