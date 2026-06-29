# 🚢 Despliegue de MyWorkoutBox

Esta guía describe un despliegue de producción para MyWorkoutBox en un servidor Linux/VPS con MariaDB/MySQL, reverse proxy web y `systemd`.

El flujo está pensado para releases controladas desde GitHub tags: se mergea a `main`, se crea un tag, GitHub Actions valida el proyecto y publica la versión en el servidor por SSH.

## 🧭 Flujo de release

```txt
rama local -> merge a main -> tag de release -> push del tag
  -> GitHub Actions ejecuta tests y builds
  -> GitHub Actions despliega por SSH al VPS
  -> Prisma aplica migraciones
  -> systemd reinicia la API
  -> el reverse proxy sirve el frontend
```

Ejemplo:

```bash
git checkout main
git pull
git tag v0.1.0-alpha
git push origin v0.1.0-alpha
```

## 📁 Estructura recomendada en el VPS

Usa rutas fuera del repositorio para backups y el build público del frontend.

```txt
/var/www/myworkoutbox/
  repo/       # Clon del repositorio
  public/     # Build del frontend publicado por el despliegue
  backups/    # Backups y exports fuera de Git
```

Variables de ejemplo:

```txt
APP_PATH=/var/www/myworkoutbox
FRONTEND_PUBLIC_PATH=/var/www/myworkoutbox/public
SYSTEMD_SERVICE_NAME=myworkoutbox-api
DATABASE_URL=mysql://myworkoutbox_user:CHANGE_ME@localhost:3306/myworkoutbox_prod
JWT_SECRET=CHANGE_ME
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://app.example.com
PORT=3000
VITE_API_URL=https://app.example.com/api
```

El branding del tenant se resuelve tras el login desde el tenant autenticado. `VITE_TENANT_ID` queda como fallback local o demo antes de la autenticación.

## 🛠️ Preparación inicial del servidor

### 1. Crear carpetas

```bash
mkdir -p /var/www/myworkoutbox/{repo,public,backups}
```

### 2. Clonar el repositorio

```bash
cd /var/www/myworkoutbox/repo
git clone git@github.com:YOUR_ORG/YOUR_REPO.git .
```

### 3. Configurar systemd

Crea el servicio como `root`:

```bash
cat > /etc/systemd/system/myworkoutbox-api.service <<'EOF'
[Unit]
Description=MyWorkoutBox API
After=network.target

[Service]
Type=simple
User=deploy-myworkoutbox
Group=deploy-myworkoutbox
WorkingDirectory=/var/www/myworkoutbox/repo/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /var/www/myworkoutbox/repo/backend/dist/index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable myworkoutbox-api
```

### 4. Permitir reinicio controlado del servicio

El usuario de despliegue debe poder reiniciar solo este servicio sin contraseña.

```bash
cat > /etc/sudoers.d/myworkoutbox-deploy <<'EOF'
deploy-myworkoutbox ALL=(root) NOPASSWD: /bin/systemctl restart myworkoutbox-api
deploy-myworkoutbox ALL=(root) NOPASSWD: /usr/bin/systemctl restart myworkoutbox-api
EOF

chmod 440 /etc/sudoers.d/myworkoutbox-deploy
visudo -cf /etc/sudoers.d/myworkoutbox-deploy
```

### 5. Comprobar dependencias del servidor

```bash
APP_PATH=/var/www/myworkoutbox \
FRONTEND_PUBLIC_PATH=/var/www/myworkoutbox/public \
bash scripts/check-server.sh
```

## 🔐 GitHub Secrets

Configura estos secrets en el repositorio de GitHub:

```txt
VPS_HOST
VPS_USER
VPS_SSH_KEY
APP_PATH
FRONTEND_PUBLIC_PATH
SYSTEMD_SERVICE_NAME
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
CORS_ORIGIN
PORT
VITE_API_URL
```

`VPS_SSH_KEY` debe ser una clave privada con permisos para acceder al VPS y al directorio del repositorio.

## 🗄️ MariaDB/MySQL

Crea la base de datos de producción en el servidor o en tu proveedor de base de datos:

```txt
Database: myworkoutbox_prod
User: myworkoutbox_user
Host: localhost si la API corre en el mismo VPS
```

Formato de `DATABASE_URL`:

```txt
mysql://USER:PASSWORD@HOST:3306/DATABASE
```

Ejemplo genérico:

```txt
DATABASE_URL=mysql://myworkoutbox_user:CHANGE_ME@localhost:3306/myworkoutbox_prod
```

En local también se usa MySQL/MariaDB:

```txt
DATABASE_URL=mysql://myworkoutbox_user:CHANGE_ME@localhost:3306/myworkoutbox_dev
```

Para tests usa una base separada:

```txt
DATABASE_URL=mysql://myworkoutbox_user:CHANGE_ME@localhost:3306/myworkoutbox_test
```

## 🌐 Reverse proxy y frontend estático

### 1. Crear dominio o subdominio

Ejemplo:

```txt
app.example.com
```

### 2. Configurar document root

El document root debe apuntar al build público del frontend:

```txt
/var/www/myworkoutbox/public
```

### 3. Configurar proxy para la API

Ejemplo de configuración Nginx para exponer la API bajo `/api/`:

```nginx
location /api/ {
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_pass http://127.0.0.1:3000/;
}

```

### 4. Servir frontend y configurar fallback de React Router

React Router usa rutas cliente como `/trainer`, `/admin` o `/clients/:id`. Si el usuario recarga una de esas rutas, el servidor debe devolver `index.html`.

Ejemplo Nginx:

```nginx
location / {
  root /var/www/myworkoutbox/public;
  try_files $uri $uri/ /index.html;
}
```

Si usas otro servidor web, configura el equivalente: servir el build estático y devolver `index.html` cuando la ruta no sea un fichero real. No apliques este fallback a `/api/`; esa ruta debe mantener su regla de proxy.

## ✅ Primera release

Publica un tag:

```bash
git tag v0.1.0-alpha
git push origin v0.1.0-alpha
```

Verifica:

```txt
https://app.example.com
https://app.example.com/api/health
```

## 💾 Backups

El script de despliegue aplica migraciones de Prisma, pero no realiza importaciones destructivas automáticas.

Antes de migraciones de producción o importaciones manuales, genera un backup:

```bash
mysqldump -u myworkoutbox_user -p myworkoutbox_prod > "$APP_PATH/backups/myworkoutbox-$(date +%Y%m%d%H%M%S).sql"
```

### Retirada de fotos de versiones anteriores

La aplicación ya no almacena ni publica fotos de clientes. Tras realizar el backup de base de datos, desplegar la migración y verificar la aplicación, elimina manualmente los ficheros heredados:

```bash
rm -rf "$APP_PATH/uploads"
```

Retira también cualquier regla `/uploads/` que permanezca en el reverse proxy. Esta limpieza es deliberadamente manual y no forma parte del script de despliegue.

## 🔁 Migración manual desde SQLite

Si existen datos piloto en una base SQLite antigua, mígralos manualmente antes de cambiar tráfico a producción.

1. Congela escrituras en la aplicación actual.
2. Exporta la base SQLite:

```bash
cd backend
npm run migration:export-sqlite -- /path/to/source.sqlite "$APP_PATH/backups/sqlite-export.json"
```

3. Aplica migraciones MySQL/MariaDB:

```bash
cd backend
npm run prisma:generate
npx prisma migrate deploy
```

4. Importa el JSON en la base vacía:

```bash
cd backend
npm run migration:import-sqlite-export -- "$APP_PATH/backups/sqlite-export.json"
```

5. Verifica conteos, login, clientes, ejercicios, histórico de marcas, auditoría y endpoints RGPD.

## 🧪 Checklist post-despliegue

- `/api/health` responde correctamente.
- El login funciona con usuarios reales configurados.
- El panel admin carga sin errores.
- La vista trainer carga clientes y permite registrar marcas.
- Los antiguos endpoints y rutas `/uploads/` ya no están disponibles.
- Las rutas frontend funcionan al recargar la página.
- No hay escrituras contra SQLite.
- `systemd` deja la API en estado `active`.
