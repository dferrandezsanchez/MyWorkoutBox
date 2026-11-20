-- Muscle group (for grouping the catalog) and the stable key of the library
-- exercise an entry came from (to avoid duplicates when importing). Additive only.
ALTER TABLE `exercises`
  ADD COLUMN `muscleGroup` VARCHAR(32) NULL,
  ADD COLUMN `libraryKey` VARCHAR(64) NULL,
  ADD INDEX `exercises_tenantId_libraryKey_idx` (`tenantId`, `libraryKey`);
