-- Reusable routine programs (A->B->C) that client plans can follow live. Additive only.
-- AlterTable
ALTER TABLE `client_routine_plans` ADD COLUMN `programId` VARCHAR(36) NULL;

-- CreateTable
CREATE TABLE `routine_programs` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    `createdById` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `routine_programs_tenantId_status_idx`(`tenantId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `routine_program_items` (
    `id` VARCHAR(36) NOT NULL,
    `programId` VARCHAR(36) NOT NULL,
    `templateId` VARCHAR(36) NOT NULL,
    `position` INTEGER NOT NULL,

    INDEX `routine_program_items_templateId_idx`(`templateId`),
    UNIQUE INDEX `routine_program_items_programId_position_key`(`programId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `client_routine_plans_programId_active_idx` ON `client_routine_plans`(`programId`, `active`);

-- AddForeignKey
ALTER TABLE `client_routine_plans` ADD CONSTRAINT `client_routine_plans_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `routine_programs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routine_programs` ADD CONSTRAINT `routine_programs_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routine_program_items` ADD CONSTRAINT `routine_program_items_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `routine_programs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routine_program_items` ADD CONSTRAINT `routine_program_items_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `routine_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

