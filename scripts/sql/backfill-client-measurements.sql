-- One-off: turn the legacy single weight / body-fat values stored on each client
-- into the first entry of their measurement history.
-- Run manually once after deploying the client_measurements migration.
-- Idempotent: only clients that have legacy values and no measurements yet are touched.
-- The legacy columns are left untouched (no data is deleted).

INSERT INTO client_measurements
  (id, tenantId, clientId, measuredAt, weight, bodyFatPercentage, muscleMass, notes, createdById, createdAt, updatedAt)
SELECT
  UUID(), c.tenantId, c.id, c.createdAt, c.weight, c.bodyFatPercentage, NULL,
  'Dato inicial importado de la ficha del cliente', 'system-backfill', NOW(3), NOW(3)
FROM clients c
WHERE (c.weight IS NOT NULL OR c.bodyFatPercentage IS NOT NULL)
  AND c.anonymizedAt IS NULL
  AND NOT EXISTS (SELECT 1 FROM client_measurements m WHERE m.clientId = c.id);
