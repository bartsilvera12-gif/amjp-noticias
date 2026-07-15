-- =====================================================================
--  Mueve TODAS las tablas de AMJP desde "public" a un esquema propio "amjp"
--  (conserva datos, relaciones y contadores). Correr UNA vez en:
--  Supabase -> SQL Editor -> New query -> Run
-- =====================================================================

-- 1) Crear el esquema
CREATE SCHEMA IF NOT EXISTS amjp;

-- 2) Permitir que la API (PostgREST) lo use
GRANT USAGE ON SCHEMA amjp TO anon, authenticated, service_role;

-- 3) Mover cada tabla (arrastra sus datos, constraints y secuencias)
ALTER TABLE public.users            SET SCHEMA amjp;
ALTER TABLE public.articles         SET SCHEMA amjp;
ALTER TABLE public.gallery_albums   SET SCHEMA amjp;
ALTER TABLE public.gallery_photos   SET SCHEMA amjp;
ALTER TABLE public.cd_sections      SET SCHEMA amjp;
ALTER TABLE public.cd_rows          SET SCHEMA amjp;
ALTER TABLE public.cd_cells         SET SCHEMA amjp;
ALTER TABLE public.cd_meta          SET SCHEMA amjp;
ALTER TABLE public.estatutos        SET SCHEMA amjp;
ALTER TABLE public.expresidentes    SET SCHEMA amjp;
ALTER TABLE public.beneficios       SET SCHEMA amjp;
ALTER TABLE public.form_submissions SET SCHEMA amjp;
ALTER TABLE public.students         SET SCHEMA amjp;
ALTER TABLE public.course_modules   SET SCHEMA amjp;
ALTER TABLE public.course_lessons   SET SCHEMA amjp;
ALTER TABLE public.enrollments      SET SCHEMA amjp;
ALTER TABLE public.lesson_progress  SET SCHEMA amjp;

-- 4) Permisos sobre las tablas/secuencias ya movidas
GRANT ALL ON ALL TABLES    IN SCHEMA amjp TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA amjp TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA amjp GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA amjp GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 5) Reiniciar los contadores de ID (por los IDs explícitos de la migración)
SELECT setval(pg_get_serial_sequence('amjp.articles','id'),        (SELECT MAX(id) FROM amjp.articles));
SELECT setval(pg_get_serial_sequence('amjp.gallery_albums','id'),  (SELECT MAX(id) FROM amjp.gallery_albums));
SELECT setval(pg_get_serial_sequence('amjp.gallery_photos','id'),  (SELECT MAX(id) FROM amjp.gallery_photos));
SELECT setval(pg_get_serial_sequence('amjp.cd_sections','id'),     (SELECT MAX(id) FROM amjp.cd_sections));
SELECT setval(pg_get_serial_sequence('amjp.cd_rows','id'),         (SELECT MAX(id) FROM amjp.cd_rows));
SELECT setval(pg_get_serial_sequence('amjp.cd_cells','id'),        (SELECT MAX(id) FROM amjp.cd_cells));
SELECT setval(pg_get_serial_sequence('amjp.expresidentes','id'),   (SELECT MAX(id) FROM amjp.expresidentes));
SELECT setval(pg_get_serial_sequence('amjp.beneficios','id'),      (SELECT MAX(id) FROM amjp.beneficios));
SELECT setval(pg_get_serial_sequence('amjp.form_submissions','id'),(SELECT MAX(id) FROM amjp.form_submissions));
SELECT setval(pg_get_serial_sequence('amjp.users','id'),           (SELECT MAX(id) FROM amjp.users));
