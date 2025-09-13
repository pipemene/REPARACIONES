# BlueHome OS Base (Gestor de Reparaciones)

## Estructura
- `index.js` — servidor Express con login, usuarios, órdenes, evidencias, firma y PDF.
- `package.json` — dependencias y script de arranque.
- `.env.example` — variables de entorno (ej.: `PORT=3000`).
- `data/.gitkeep` — placeholder para que el directorio `data/` se incluya en el repo.
- `uploads/.gitkeep` — placeholder para que el directorio `uploads/` se incluya en el repo.

## Pasos rápidos
1. `npm install`
2. `npm start`
3. Salud: `GET /api/health`
4. Ver usuarios: `GET /api/debug/users`
5. Login: `POST /api/login` con `{ usuario, password }`