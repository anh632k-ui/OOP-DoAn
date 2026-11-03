-- MED-06: reference role definitions required by registration (no demo user accounts).
INSERT INTO vai_tro (ma_vai_tro, ten_vai_tro) VALUES
('10000000-0000-4000-8000-000000000001', 'ADMIN'),
('10000000-0000-4000-8000-000000000002', 'ORGANIZER'),
('10000000-0000-4000-8000-000000000003', 'CHECKIN'),
('10000000-0000-4000-8000-000000000004', 'ATTENDEE')
ON CONFLICT DO NOTHING;

INSERT INTO public.schema_migrations(version) VALUES ('002_role_defaults.sql');
