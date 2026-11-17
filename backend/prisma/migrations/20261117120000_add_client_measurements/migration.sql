-- Client measurement history, client goal and per-tenant toggle. Additive only.
ALTER TABLE `clients`
  ADD COLUMN `goal` TEXT NULL,
  ADD COLUMN `goalDate` DATETIME(3) NULL;

ALTER TABLE `tenants`
  ADD COLUMN `measurementsEnabled` BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE `client_measurements` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NOT NULL,
  `clientId` VARCHAR(36) NOT NULL,
  `measuredAt` DATETIME(3) NOT NULL,
  `weight` DOUBLE NULL,
  `bodyFatPercentage` DOUBLE NULL,
  `muscleMass` DOUBLE NULL,
  `notes` TEXT NULL,
  `createdById` VARCHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `client_measurements_tenantId_clientId_measuredAt_idx` (`tenantId`, `clientId`, `measuredAt` DESC),
  CONSTRAINT `client_measurements_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `client_measurements_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
