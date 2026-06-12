ALTER TABLE "exercises" ADD COLUMN "movementPattern" TEXT NOT NULL DEFAULT 'general';
ALTER TABLE "exercises" ADD COLUMN "evaluationType" TEXT NOT NULL DEFAULT 'repetitions';
ALTER TABLE "exercises" ADD COLUMN "improvementDirection" TEXT NOT NULL DEFAULT 'higher';
ALTER TABLE "exercises" ADD COLUMN "measurementFields" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "exercises" ADD COLUMN "variantGroups" TEXT NOT NULL DEFAULT '[]';
