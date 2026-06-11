-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "mark" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "primary" TEXT NOT NULL,
    "primaryHover" TEXT NOT NULL,
    "primarySoft" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenants_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_tenant_memberships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_tenant_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_tenant_memberships_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Seed pilot tenant for existing data.
INSERT INTO "organizations" ("id", "name", "slug", "active")
VALUES ('org_tumeta', 'TuMeta', 'tumeta', true);

INSERT INTO "tenants" (
    "id",
    "organizationId",
    "name",
    "slug",
    "appName",
    "shortName",
    "mark",
    "claim",
    "description",
    "primary",
    "primaryHover",
    "primarySoft",
    "active"
) VALUES (
    'tenant_tumeta',
    'org_tumeta',
    'TuMeta Personal Training',
    'tumeta-personal-training',
    'tumeta',
    'TuMeta',
    't',
    'Personal Training',
    'Control de clientes, ejercicios y progresion.',
    '#ED702D',
    '#D96424',
    '#F29A6A',
    true
);

-- Add tenant scope to existing operational tables.
ALTER TABLE "clients" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'tenant_tumeta';
ALTER TABLE "exercises" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'tenant_tumeta';
ALTER TABLE "performance_records" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'tenant_tumeta';
ALTER TABLE "audit_logs" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'tenant_tumeta';

-- Existing users become members of the pilot tenant using their current role.
INSERT INTO "user_tenant_memberships" ("id", "userId", "tenantId", "role", "active")
SELECT lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6))),
       "id",
       'tenant_tumeta',
       "role",
       "active"
FROM "users";

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
CREATE INDEX "tenants_organizationId_idx" ON "tenants"("organizationId");
CREATE UNIQUE INDEX "user_tenant_memberships_userId_tenantId_key" ON "user_tenant_memberships"("userId", "tenantId");
CREATE INDEX "user_tenant_memberships_tenantId_role_idx" ON "user_tenant_memberships"("tenantId", "role");
CREATE INDEX "clients_tenantId_status_idx" ON "clients"("tenantId", "status");
CREATE INDEX "exercises_tenantId_status_idx" ON "exercises"("tenantId", "status");
CREATE INDEX "performance_records_tenantId_clientId_idx" ON "performance_records"("tenantId", "clientId");
CREATE INDEX "audit_logs_tenantId_createdAt_idx" ON "audit_logs"("tenantId", "createdAt");
