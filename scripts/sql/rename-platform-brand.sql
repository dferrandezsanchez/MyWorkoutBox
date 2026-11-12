-- One-off data update for the MyWorkoutBox -> STELIOS rename.
-- Run manually once, after restoring the production data into the new stack.
-- Only names still containing the old product name change, so running it again is a no-op.
-- Tenant slugs are left unchanged so existing logins and links keep working.
-- Per-tenant branding columns (appName, shortName, mark, claim, description, primary*)
-- are no longer read by the application and are intentionally left untouched.

START TRANSACTION;

UPDATE tenants
SET name = REPLACE(name, 'MyWorkoutBox', 'STELIOS')
WHERE name LIKE '%MyWorkoutBox%';

UPDATE organizations
SET name = REPLACE(name, 'MyWorkoutBox', 'STELIOS')
WHERE name LIKE '%MyWorkoutBox%';

COMMIT;
