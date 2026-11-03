-- No new business tables; record reproducible draw evidence.
ALTER TABLE dot_phan_bo
 ADD COLUMN IF NOT EXISTS audit_seed VARCHAR(64),
 ADD COLUMN IF NOT EXISTS seed_sha256 VARCHAR(64);
INSERT INTO public.schema_migrations(version) VALUES ('003_lottery_audit.sql');
