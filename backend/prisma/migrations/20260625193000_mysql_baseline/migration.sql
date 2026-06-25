-- MySQL/MariaDB baseline for the current multitenant MyWorkoutBox schema.

CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `role` VARCHAR(32) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `users_email_key`(`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `organizations` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `organizations_slug_key`(`slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `tenants` (
  `id` VARCHAR(36) NOT NULL,
  `organizationId` VARCHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `appName` VARCHAR(191) NOT NULL,
  `shortName` VARCHAR(191) NOT NULL,
  `mark` VARCHAR(16) NOT NULL,
  `claim` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `primary` VARCHAR(7) NOT NULL,
  `primaryHover` VARCHAR(7) NOT NULL,
  `primarySoft` VARCHAR(7) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `tenants_slug_key`(`slug`),
  INDEX `tenants_organizationId_idx`(`organizationId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_tenant_memberships` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NOT NULL,
  `role` VARCHAR(32) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `user_tenant_memberships_userId_tenantId_key`(`userId`, `tenantId`),
  INDEX `user_tenant_memberships_tenantId_role_idx`(`tenantId`, `role`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `clients` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NOT NULL,
  `firstName` VARCHAR(191) NOT NULL,
  `lastName` VARCHAR(191) NOT NULL,
  `birthDate` DATETIME(3) NOT NULL,
  `height` DOUBLE NULL,
  `weight` DOUBLE NULL,
  `bodyFatPercentage` DOUBLE NULL,
  `photoUrl` VARCHAR(512) NULL,
  `notes` TEXT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  `anonymizedAt` DATETIME(3) NULL,
  `photoConsentAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `clients_tenantId_status_idx`(`tenantId`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `exercises` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `movementPattern` VARCHAR(64) NOT NULL DEFAULT 'general',
  `evaluationType` VARCHAR(64) NOT NULL DEFAULT 'repetitions',
  `improvementDirection` VARCHAR(32) NOT NULL DEFAULT 'higher',
  `defaultUnit` VARCHAR(32) NOT NULL,
  `measurementFields` TEXT NOT NULL,
  `variantGroups` TEXT NOT NULL,
  `description` TEXT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `exercises_tenantId_status_idx`(`tenantId`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `performance_records` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NOT NULL,
  `clientId` VARCHAR(36) NOT NULL,
  `exerciseId` VARCHAR(36) NOT NULL,
  `trainerId` VARCHAR(36) NOT NULL,
  `value` VARCHAR(191) NOT NULL,
  `unit` VARCHAR(32) NOT NULL,
  `weight` DOUBLE NULL,
  `repetitions` INTEGER NULL,
  `duration` DOUBLE NULL,
  `distance` DOUBLE NULL,
  `date` DATETIME(3) NOT NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `performance_records_tenantId_clientId_idx`(`tenantId`, `clientId`),
  INDEX `performance_records_clientId_exerciseId_date_idx`(`clientId`, `exerciseId`, `date` DESC),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `audit_logs` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `action` VARCHAR(64) NOT NULL,
  `entityType` VARCHAR(64) NOT NULL,
  `entityId` VARCHAR(36) NOT NULL,
  `metadata` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `audit_logs_tenantId_createdAt_idx`(`tenantId`, `createdAt`),
  INDEX `audit_logs_entityType_entityId_idx`(`entityType`, `entityId`),
  INDEX `audit_logs_userId_createdAt_idx`(`userId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `tenants`
  ADD CONSTRAINT `tenants_organizationId_fkey`
  FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `user_tenant_memberships`
  ADD CONSTRAINT `user_tenant_memberships_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `user_tenant_memberships_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `clients`
  ADD CONSTRAINT `clients_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `exercises`
  ADD CONSTRAINT `exercises_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `performance_records`
  ADD CONSTRAINT `performance_records_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `performance_records_clientId_fkey`
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `performance_records_exerciseId_fkey`
  FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `performance_records_trainerId_fkey`
  FOREIGN KEY (`trainerId`) REFERENCES `users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `audit_logs_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
