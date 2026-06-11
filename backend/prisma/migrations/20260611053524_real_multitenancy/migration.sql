-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_audit_logs" ("action", "createdAt", "entityId", "entityType", "id", "metadata", "tenantId", "userId") SELECT "action", "createdAt", "entityId", "entityType", "id", "metadata", "tenantId", "userId" FROM "audit_logs";
DROP TABLE "audit_logs";
ALTER TABLE "new_audit_logs" RENAME TO "audit_logs";
CREATE INDEX "audit_logs_tenantId_createdAt_idx" ON "audit_logs"("tenantId", "createdAt");
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");
CREATE TABLE "new_clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "height" REAL,
    "weight" REAL,
    "bodyFatPercentage" REAL,
    "photoUrl" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "anonymizedAt" DATETIME,
    "photoConsentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "clients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_clients" ("anonymizedAt", "birthDate", "bodyFatPercentage", "createdAt", "firstName", "height", "id", "lastName", "notes", "photoConsentAt", "photoUrl", "status", "tenantId", "updatedAt", "weight") SELECT "anonymizedAt", "birthDate", "bodyFatPercentage", "createdAt", "firstName", "height", "id", "lastName", "notes", "photoConsentAt", "photoUrl", "status", "tenantId", "updatedAt", "weight" FROM "clients";
DROP TABLE "clients";
ALTER TABLE "new_clients" RENAME TO "clients";
CREATE INDEX "clients_tenantId_status_idx" ON "clients"("tenantId", "status");
CREATE TABLE "new_exercises" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "defaultUnit" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "exercises_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_exercises" ("category", "createdAt", "defaultUnit", "description", "id", "name", "status", "tenantId", "updatedAt") SELECT "category", "createdAt", "defaultUnit", "description", "id", "name", "status", "tenantId", "updatedAt" FROM "exercises";
DROP TABLE "exercises";
ALTER TABLE "new_exercises" RENAME TO "exercises";
CREATE INDEX "exercises_tenantId_status_idx" ON "exercises"("tenantId", "status");
CREATE TABLE "new_organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_organizations" ("active", "createdAt", "id", "name", "slug", "updatedAt") SELECT "active", "createdAt", "id", "name", "slug", "updatedAt" FROM "organizations";
DROP TABLE "organizations";
ALTER TABLE "new_organizations" RENAME TO "organizations";
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE TABLE "new_performance_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "weight" REAL,
    "repetitions" INTEGER,
    "duration" REAL,
    "distance" REAL,
    "date" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "performance_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "performance_records_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "performance_records_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "performance_records_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_performance_records" ("clientId", "createdAt", "date", "distance", "duration", "exerciseId", "id", "notes", "repetitions", "tenantId", "trainerId", "unit", "updatedAt", "value", "weight") SELECT "clientId", "createdAt", "date", "distance", "duration", "exerciseId", "id", "notes", "repetitions", "tenantId", "trainerId", "unit", "updatedAt", "value", "weight" FROM "performance_records";
DROP TABLE "performance_records";
ALTER TABLE "new_performance_records" RENAME TO "performance_records";
CREATE INDEX "performance_records_tenantId_clientId_idx" ON "performance_records"("tenantId", "clientId");
CREATE INDEX "performance_records_clientId_exerciseId_date_idx" ON "performance_records"("clientId", "exerciseId", "date" DESC);
CREATE TABLE "new_tenants" (
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tenants_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_tenants" ("active", "appName", "claim", "createdAt", "description", "id", "mark", "name", "organizationId", "primary", "primaryHover", "primarySoft", "shortName", "slug", "updatedAt") SELECT "active", "appName", "claim", "createdAt", "description", "id", "mark", "name", "organizationId", "primary", "primaryHover", "primarySoft", "shortName", "slug", "updatedAt" FROM "tenants";
DROP TABLE "tenants";
ALTER TABLE "new_tenants" RENAME TO "tenants";
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
CREATE INDEX "tenants_organizationId_idx" ON "tenants"("organizationId");
CREATE TABLE "new_user_tenant_memberships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_tenant_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_tenant_memberships_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_user_tenant_memberships" ("active", "createdAt", "id", "role", "tenantId", "updatedAt", "userId") SELECT "active", "createdAt", "id", "role", "tenantId", "updatedAt", "userId" FROM "user_tenant_memberships";
DROP TABLE "user_tenant_memberships";
ALTER TABLE "new_user_tenant_memberships" RENAME TO "user_tenant_memberships";
CREATE INDEX "user_tenant_memberships_tenantId_role_idx" ON "user_tenant_memberships"("tenantId", "role");
CREATE UNIQUE INDEX "user_tenant_memberships_userId_tenantId_key" ON "user_tenant_memberships"("userId", "tenantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
