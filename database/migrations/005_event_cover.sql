-- Store the object key only; binary event images live in S3-compatible object storage.
ALTER TABLE su_kien ADD COLUMN IF NOT EXISTS anh_bia_key TEXT;
INSERT INTO public.schema_migrations(version) VALUES ('005_event_cover.sql');
