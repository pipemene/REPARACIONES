
BlueHome OS v10.1

- Integración con Google Drive:
  * PDFs se suben automáticamente a la carpeta indicada en GOOGLE_FOLDER_ID.
  * GOOGLE_CREDENTIALS se pasa desde Railway como variable de entorno.
  * Archivos se comparten públicos (cualquiera con link puede ver).
  * Botón "Descargar PDF" abre el archivo en Drive.

- Topbar:
  * Fondo azul oscuro/negro.
  * Logo centrado.
  * Botón de cerrar sesión a la derecha.

- Frontend:
  * Crear orden con validaciones y toasts.
  * Órdenes de trabajo con filtros, tabla moderna, badges, paginación de 15, exportación desplegable.
  * Usuarios (solo superadmin).
