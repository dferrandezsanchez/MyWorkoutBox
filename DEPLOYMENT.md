# MVP Release Deployment

This project is designed to deploy manually controlled releases from GitHub tags.

## Target Flow

```txt
local branch -> merge to main -> create tag -> push tag
  -> GitHub Actions builds/tests
  -> GitHub Actions deploys over SSH to the VPS
  -> systemd restarts the backend
  -> Plesk/Nginx serves the frontend
```

Example:

```bash
git checkout main
git pull
git tag v0.1.0-alpha
git push origin v0.1.0-alpha
```

## VPS Layout

Recommended layout for the Plesk server:

```txt
/var/www/vhosts/danielferrandez.dev/myworkoutbox/
  repo/       # git clone of this repository
  public/     # frontend dist published here
  backups/    # database export/backups outside git
  uploads/    # persistent uploads outside git
```

Example secrets:

```txt
APP_PATH=/var/www/vhosts/danielferrandez.dev/myworkoutbox
FRONTEND_PUBLIC_PATH=/var/www/vhosts/danielferrandez.dev/myworkoutbox/public
SYSTEMD_SERVICE_NAME=myworkoutbox-api
DATABASE_URL=mysql://myworkoutbox_user:password@localhost:3306/myworkoutbox_prod
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://tumeta.danielferrandez.dev
PORT=3000
VITE_API_URL=https://tumeta.danielferrandez.dev/api
```

Tenant branding is resolved after login from the authenticated tenant. `VITE_TENANT_ID` is only an optional local/demo fallback before authentication.

## One-Time Server Setup

Create the folders:

```bash
mkdir -p /var/www/vhosts/danielferrandez.dev/myworkoutbox/{repo,public,backups,uploads}
```

Clone the repo:

```bash
cd /var/www/vhosts/danielferrandez.dev/myworkoutbox/repo
git clone git@github.com:YOUR_ORG/YOUR_REPO.git .
```

Create the systemd service as root:

```bash
cat > /etc/systemd/system/myworkoutbox-api.service <<'EOF'
[Unit]
Description=MyWorkoutBox API
After=network.target

[Service]
Type=simple
User=deploy-myworkoutbox
Group=deploy-myworkoutbox
WorkingDirectory=/var/www/vhosts/danielferrandez.dev/myworkoutbox/repo/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /var/www/vhosts/danielferrandez.dev/myworkoutbox/repo/backend/dist/index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable myworkoutbox-api
```

Allow the deploy user to restart only this service without a password:

```bash
cat > /etc/sudoers.d/myworkoutbox-deploy <<'EOF'
deploy-myworkoutbox ALL=(root) NOPASSWD: /bin/systemctl restart myworkoutbox-api
deploy-myworkoutbox ALL=(root) NOPASSWD: /usr/bin/systemctl restart myworkoutbox-api
EOF

chmod 440 /etc/sudoers.d/myworkoutbox-deploy
visudo -cf /etc/sudoers.d/myworkoutbox-deploy
```

Check server dependencies:

```bash
APP_PATH=/var/www/vhosts/danielferrandez.dev/myworkoutbox \
FRONTEND_PUBLIC_PATH=/var/www/vhosts/danielferrandez.dev/myworkoutbox/public \
bash scripts/check-server.sh
```

## GitHub Secrets

Configure these in GitHub repository secrets:

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

`VPS_SSH_KEY` should be a private key that can SSH into the VPS user and access the repo folder.

## Plesk MySQL / MariaDB

Create a production database from Plesk:

```txt
Database: myworkoutbox_prod
User: myworkoutbox_user
Host: usually localhost when the API runs on the same VPS
```

Set `DATABASE_URL` in GitHub secrets using this format:

```txt
mysql://myworkoutbox_user:PASSWORD@localhost:3306/myworkoutbox_prod
```

Local development must use MySQL/MariaDB too. A typical local setup is:

```txt
DATABASE_URL=mysql://myworkoutbox_user:password@localhost:3306/myworkoutbox_dev
```

Use a separate test database:

```txt
DATABASE_URL=mysql://myworkoutbox_user:password@localhost:3306/myworkoutbox_test
```

## Plesk / Nginx

Create the subdomain in Plesk:

```txt
tumeta.danielferrandez.dev
```

Set the document root to:

```txt
/var/www/vhosts/danielferrandez.dev/myworkoutbox/public
```

Add an Nginx proxy rule for the API. In Plesk this usually goes into "Additional nginx directives":

```nginx
location /api/ {
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_pass http://127.0.0.1:3000/;
}

location /uploads/ {
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_pass http://127.0.0.1:3000/uploads/;
}
```

React Router uses client-side routes such as `/trainer`, `/admin`, and `/clients/:id`.
On mobile, an inactive browser tab can be reloaded directly on one of those paths. The web
server must then return `index.html` instead of Plesk's 404 page.

In Plesk, add this under the subdomain's **Additional Apache directives**:

```apache
FallbackResource /index.html
```

If `FallbackResource` is not available, use the rewrite fallback:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ /index.html [L]
</IfModule>
```

If the domain is served directly by Nginx instead of Apache behind Plesk, the equivalent is:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

Do not apply this fallback to `/api/` or `/uploads/`; those paths must keep the proxy rules above.

## First Release

Push a tag:

```bash
git tag v0.1.0-alpha
git push origin v0.1.0-alpha
```

Then verify:

```txt
https://tumeta.danielferrandez.dev
https://tumeta.danielferrandez.dev/api/health
```

## Backups

The deploy script applies Prisma migrations but does not perform destructive data imports.
Take a MySQL backup before production migrations or manual data imports:

```bash
mysqldump -u myworkoutbox_user -p myworkoutbox_prod > "$APP_PATH/backups/myworkoutbox-$(date +%Y%m%d%H%M%S).sql"
```

Uploads are kept outside the repository. The deploy script links `backend/uploads` to:

```txt
/var/www/vhosts/danielferrandez.dev/myworkoutbox/uploads
```

## Pilot Data Migration From SQLite

If the TuMeta pilot data still lives in SQLite, migrate it manually before switching production traffic.

1. Freeze writes in the current app.
2. Export the SQLite source:

```bash
cd backend
npm run migration:export-sqlite -- /path/to/production.sqlite "$APP_PATH/backups/tumeta-sqlite-export.json"
```

3. Apply MySQL migrations:

```bash
cd backend
npm run prisma:generate
npx prisma migrate deploy
```

4. Import into the empty MySQL database:

```bash
cd backend
npm run migration:import-sqlite-export -- "$APP_PATH/backups/tumeta-sqlite-export.json"
```

5. Verify row counts, login, clients, exercises, performance history, audit logs, and RGPD endpoints.
