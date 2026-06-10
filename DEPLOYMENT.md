# MVP Release Deployment

This project is designed to deploy manually controlled releases from GitHub tags.

## Target Flow

```txt
local branch -> merge to main -> create tag -> push tag
  -> GitHub Actions builds/tests
  -> GitHub Actions deploys over SSH to the VPS
  -> PM2 restarts the backend
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
  data/       # SQLite database, outside git
  public/     # frontend dist published here
  backups/    # SQLite backups before deploy migrations
  uploads/    # future persistent uploads if needed
```

Example secrets:

```txt
APP_PATH=/var/www/vhosts/danielferrandez.dev/myworkoutbox
FRONTEND_PUBLIC_PATH=/var/www/vhosts/danielferrandez.dev/myworkoutbox/public
PM2_APP_NAME=myworkoutbox-api
DATABASE_URL=file:/var/www/vhosts/danielferrandez.dev/myworkoutbox/data/production.sqlite
JWT_EXPIRES_IN=7d
PORT=3000
VITE_API_URL=https://tumeta.danielferrandez.dev/api
VITE_TENANT_ID=tumeta
```

## One-Time Server Setup

Create the folders:

```bash
mkdir -p /var/www/vhosts/danielferrandez.dev/myworkoutbox/{repo,data,public,backups,uploads}
```

Clone the repo:

```bash
cd /var/www/vhosts/danielferrandez.dev/myworkoutbox/repo
git clone git@github.com:YOUR_ORG/YOUR_REPO.git .
```

Install PM2 if it is not already available:

```bash
npm install -g pm2
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
PM2_APP_NAME
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
PORT
VITE_API_URL
VITE_TENANT_ID
```

`VPS_SSH_KEY` should be a private key that can SSH into the VPS user and access the repo folder.

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

For React Router, Plesk/Nginx also needs SPA fallback to `index.html`. If Plesk does not add it automatically, add:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

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

## SQLite Notes

For the MVP, SQLite is acceptable if the database file lives outside the repo.

The deploy script creates a backup before migrations when `DATABASE_URL` starts with `file:`.

Do not store the production SQLite file inside the repository.

Uploads are kept outside the repository as well. The deploy script links `backend/uploads` to:

```txt
/var/www/vhosts/danielferrandez.dev/myworkoutbox/uploads
```

For real multitenant production usage, PostgreSQL should be planned before onboarding multiple paying tenants.
