CREATE TABLE `training_sessions` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NOT NULL,
  `clientId` VARCHAR(36) NOT NULL,
  `trainerId` VARCHAR(36) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` DATETIME(3) NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `training_sessions_tenantId_trainerId_status_idx` (`tenantId`, `trainerId`, `status`),
  INDEX `training_sessions_tenantId_clientId_startedAt_idx` (`tenantId`, `clientId`, `startedAt` DESC),
  CONSTRAINT `training_sessions_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `training_sessions_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `training_sessions_trainerId_fkey` FOREIGN KEY (`trainerId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `training_session_exercises` (
  `id` VARCHAR(36) NOT NULL,
  `sessionId` VARCHAR(36) NOT NULL,
  `exerciseId` VARCHAR(36) NOT NULL,
  `position` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `training_session_exercises_sessionId_exerciseId_key` (`sessionId`, `exerciseId`),
  UNIQUE INDEX `training_session_exercises_sessionId_position_key` (`sessionId`, `position`),
  CONSTRAINT `training_session_exercises_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `training_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `training_session_exercises_exerciseId_fkey` FOREIGN KEY (`exerciseId`) REFERENCES `exercises` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `performance_records`
  ADD COLUMN `variantValues` TEXT NULL,
  ADD COLUMN `sessionExerciseId` VARCHAR(36) NULL,
  ADD COLUMN `seriesNumber` INTEGER NULL,
  ADD INDEX `performance_records_sessionExerciseId_seriesNumber_idx` (`sessionExerciseId`, `seriesNumber`),
  ADD CONSTRAINT `performance_records_sessionExerciseId_fkey` FOREIGN KEY (`sessionExerciseId`) REFERENCES `training_session_exercises` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
