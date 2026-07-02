# 🚢 Despliegue de MyWorkoutBox

MyWorkoutBox utiliza el mismo stack Docker Compose en desarrollo y producción: MariaDB 10.11, API Node.js y frontend servido por Nginx. El servidor público solo necesita Docker, Git, un reverse proxy y acceso SSH desde GitHub Actions.

## 🧭 Arquitectura

```mermaid
flowchart LR
  Internet --> Proxy[Reverse proxy HTTPS]
  Proxy --> Frontend[Frontend Nginx :8080]
  Frontend -->|/api/*| Backend[Node API :3000]
  Backend --> Database[(MariaDB 10.11)]
  Database --> Volume[(Docker volume)]
  Migrate[Prisma migrate deploy] --> Database
```

- Solo Nginx publica un puerto, limitado a `127.0.0.1`.
- Backend y MariaDB no son accesibles desde Internet.
- La red de base de datos es interna.
- Prisma se ejecuta antes de arrancar una nueva versión del backend.
- MariaDB persiste en un volumen independiente de los contenedores.

## 🛠️ Requisitos

- Linux/VPS con Docker Engine y el plugin Docker Compose.
- Git.
- Reverse proxy con HTTPS.
- Usuario de despliegue con acceso al repositorio y permiso para usar Docker.
- Espacio fuera del repositorio para configuración y backups.

Comprueba la instalación:

```bash
docker --version
docker compose version
git --version
```

## 💻 Entorno local

```bash
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker --profile tools run --rm seed
```

La aplicación queda disponible en `http://localhost:8080`. Para detenerla sin borrar datos:

```bash
docker compose --env-file .env.docker down
```

`docker compose down -v` elimina también la base local y debe utilizarse únicamente de forma intencionada.

## 📁 Estructura recomendada en producción

```txt
/var/www/myworkoutbox/
├── repo/                         # Checkout Git
├── .env.docker                   # Secretos, fuera del repositorio
├── .last-successful-release      # Último tag desplegado
└── backups/                      # Dumps comprimidos de MariaDB
```

```bash
mkdir -p /var/www/myworkoutbox/backups
git clone <REPOSITORY_URL> /var/www/myworkoutbox/repo
```

## 🔐 Variables de producción

Crea `/var/www/myworkoutbox/.env.docker` tomando `.env.docker.example` como referencia:

```dotenv
COMPOSE_PROJECT_NAME=myworkoutbox
IMAGE_TAG=production
APP_PORT=8080

MARIADB_DATABASE=myworkoutbox
MARIADB_USER=myworkoutbox
MARIADB_PASSWORD=CHANGE_ME
MARIADB_ROOT_PASSWORD=CHANGE_ME
DATABASE_URL=mysql://myworkoutbox:URL_ENCODED_PASSWORD@database:3306/myworkoutbox

JWT_SECRET=CHANGE_ME_WITH_AT_LEAST_32_RANDOM_CHARACTERS
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://app.example.com
VITE_TENANT_ID=platform
```

La contraseña dentro de `DATABASE_URL` debe estar codificada como URL. Por ejemplo, `%` se representa como `%25`. Protege el fichero:

```bash
chmod 600 /var/www/myworkoutbox/.env.docker
```

No guardes este fichero en Git ni lo envíes mediante GitHub Actions.

## 🌐 Reverse proxy

El proxy público termina HTTPS y reenvía todas las rutas al Nginx del contenedor:

```nginx
server {
  server_name app.example.com;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

La configuración equivalente depende del servidor web utilizado. No publiques directamente los puertos 3000 o 3306.

## 💾 Backup y restauración

Genera un dump consistente y comprimido:

```bash
cd /var/www/myworkoutbox/repo
DOCKER_ENV_FILE=/var/www/myworkoutbox/.env.docker \
BACKUP_DIR=/var/www/myworkoutbox/backups \
./scripts/docker-backup.sh
```

Verifica periódicamente la restauración en un entorno aislado. Para restaurar intencionadamente la base configurada:

```bash
CONFIRM_DATABASE_RESTORE=yes \
DOCKER_ENV_FILE=/var/www/myworkoutbox/.env.docker \
./scripts/docker-restore.sh /path/to/backup.sql.gz
```

Durante una restauración productiva detén antes frontend y backend para evitar escrituras concurrentes:

```bash
docker compose --env-file /var/www/myworkoutbox/.env.docker stop frontend backend
```

## 🔁 Primera migración al stack Docker

La transición desde una MariaDB gestionada fuera de Docker se realiza una sola vez:

1. Detén temporalmente escrituras en la aplicación actual.
2. Genera un `mariadb-dump` de la base existente y verifica que no esté vacío.
3. Mantén la base y el servicio actuales disponibles como rollback.
4. Levanta únicamente la nueva MariaDB Docker.
5. Restaura el dump mediante `docker-restore.sh`.
6. Levanta el stack completo y comprueba health, login, tenants y datos históricos.
7. Cambia el reverse proxy a `127.0.0.1:8080`.
8. Detén el servicio anterior solo después de validar el tráfico real.

Ejemplo de arranque previo a la restauración:

```bash
cd /var/www/myworkoutbox/repo
docker compose --env-file /var/www/myworkoutbox/.env.docker up -d --wait database
```

No elimines la base anterior hasta conservar varios backups verificados de la nueva instalación.

## 🤖 GitHub Actions

El workflow de release se activa con tags `v*`. Requiere estos secrets:

```txt
VPS_HOST
VPS_USER
VPS_SSH_KEY
APP_PATH
DOCKER_ENV_FILE
VITE_API_URL
```

- `APP_PATH`: por ejemplo `/var/www/myworkoutbox`.
- `DOCKER_ENV_FILE`: por ejemplo `/var/www/myworkoutbox/.env.docker`.
- `VITE_API_URL` solo se utiliza en el quality gate; la imagen productiva usa `/api`.

El job verifica que el tag pertenece a `main`, ejecuta quality gates, construye ambas imágenes y despliega por SSH.

## 🏷️ Publicar una release

```bash
git checkout main
git pull --ff-only origin main
git tag -a v1.0.0-rc.1 -m "Release v1.0.0-rc.1"
git push origin v1.0.0-rc.1
```

En el servidor, `deploy-release.sh`:

1. Crea un backup si MariaDB Docker ya está activa.
2. Descarga la imagen base de MariaDB.
3. Construye imágenes con el tag de release.
4. Ejecuta migraciones Prisma.
5. Espera los health checks.
6. Comprueba frontend y API a través del proxy interno.
7. Registra la release como última versión correcta.

## ↩️ Rollback

Si falla un despliegue y existe una release Docker anterior, el script intenta reconstruir y arrancar automáticamente esa versión. Las migraciones no se revierten automáticamente.

Para un rollback manual de aplicación:

```bash
cd /var/www/myworkoutbox/repo
git checkout <PREVIOUS_TAG>
IMAGE_TAG=<PREVIOUS_TAG> docker compose \
  --env-file /var/www/myworkoutbox/.env.docker \
  up --build -d --remove-orphans --wait
```

Restaura la base únicamente cuando el cambio de esquema lo exija y después de preservar un backup del estado actual.

## ✅ Comprobaciones

```bash
docker compose --env-file /var/www/myworkoutbox/.env.docker ps
curl --fail https://app.example.com/api/health
curl --fail https://app.example.com/api/openapi.json
```

Además, comprueba login, cambio de tenant, dashboard, clientes, ejercicios, entrenadores, creación/finalización de sesiones y persistencia tras recrear los contenedores.
