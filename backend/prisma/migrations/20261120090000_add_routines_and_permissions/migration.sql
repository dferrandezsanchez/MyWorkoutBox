-- Routine templates, client routine plans (A->B->C) and per-member routine permission. Additive only.
-- AlterTable
ALTER TABLE `user_tenant_memberships` ADD COLUMN `canManageRoutines` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `training_sessions` ADD COLUMN `routinePlanId` VARCHAR(36) NULL,
    ADD COLUMN `routinePlanPosition` INTEGER NULL,
    ADD COLUMN `routineTemplateId` VARCHAR(36) NULL;

-- CreateTable
CREATE TABLE `routine_templates` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    `createdById` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `routine_templates_tenantId_status_idx`(`tenantId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `routine_template_exercises` (
    `id` VARCHAR(36) NOT NULL,
    `templateId` VARCHAR(36) NOT NULL,
    `exerciseId` VARCHAR(36) NOT NULL,
    `position` INTEGER NOT NULL,
    `targetSets` INTEGER NULL,
    `targetReps` VARCHAR(64) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `routine_template_exercises_exerciseId_idx`(`exerciseId`),
    UNIQUE INDEX `routine_template_exercises_templateId_position_key`(`templateId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client_routine_plans` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NOT NULL,
    `clientId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `nextPosition` INTEGER NOT NULL DEFAULT 1,
    `createdById` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `client_routine_plans_tenantId_clientId_active_idx`(`tenantId`, `clientId`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client_routine_plan_items` (
    `id` VARCHAR(36) NOT NULL,
    `planId` VARCHAR(36) NOT NULL,
    `templateId` VARCHAR(36) NOT NULL,
    `position` INTEGER NOT NULL,

    INDEX `client_routine_plan_items_templateId_idx`(`templateId`),
    UNIQUE INDEX `client_routine_plan_items_planId_position_key`(`planId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `training_sessions` ADD CONSTRAINT `training_sessions_routineTemplateId_fkey` FOREIGN KEY (`routineTemplateId`) REFERENCES `routine_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_sessions` ADD CONSTRAINT `training_sessions_routinePlanId_fkey` FOREIGN KEY (`routinePlanId`) REFERENCES `client_routine_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routine_templates` ADD CONSTRAINT `routine_templates_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routine_template_exercises` ADD CONSTRAINT `routine_template_exercises_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `routine_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routine_template_exercises` ADD CONSTRAINT `routine_template_exercises_exerciseId_fkey` FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `client_routine_plans` ADD CONSTRAINT `client_routine_plans_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `client_routine_plans` ADD CONSTRAINT `client_routine_plans_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `client_routine_plan_items` ADD CONSTRAINT `client_routine_plan_items_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `client_routine_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `client_routine_plan_items` ADD CONSTRAINT `client_routine_plan_items_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `routine_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

