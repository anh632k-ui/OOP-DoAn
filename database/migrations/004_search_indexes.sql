-- Trigram indexes enable Vietnamese substring searches without introducing a new business table.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS ix_event_title_trgm ON su_kien USING gin (ten_su_kien gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_event_description_trgm ON su_kien USING gin (mo_ta gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_accessibility_event ON su_kien_dac_tinh(ma_dac_tinh,ma_su_kien);
INSERT INTO public.schema_migrations(version) VALUES ('004_search_indexes.sql');
