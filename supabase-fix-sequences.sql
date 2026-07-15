-- =====================================================================
--  Reinicia los contadores (secuencias) de ID después de migrar los datos.
--  Correr UNA vez en Supabase → SQL Editor, después de importar el contenido.
--  Sin esto, la app podría intentar crear un registro con un ID ya usado.
-- =====================================================================
SELECT setval(pg_get_serial_sequence('articles','id'),        (SELECT MAX(id) FROM articles));
SELECT setval(pg_get_serial_sequence('gallery_albums','id'),  (SELECT MAX(id) FROM gallery_albums));
SELECT setval(pg_get_serial_sequence('gallery_photos','id'),  (SELECT MAX(id) FROM gallery_photos));
SELECT setval(pg_get_serial_sequence('cd_sections','id'),     (SELECT MAX(id) FROM cd_sections));
SELECT setval(pg_get_serial_sequence('cd_rows','id'),         (SELECT MAX(id) FROM cd_rows));
SELECT setval(pg_get_serial_sequence('cd_cells','id'),        (SELECT MAX(id) FROM cd_cells));
SELECT setval(pg_get_serial_sequence('expresidentes','id'),   (SELECT MAX(id) FROM expresidentes));
SELECT setval(pg_get_serial_sequence('beneficios','id'),      (SELECT MAX(id) FROM beneficios));
SELECT setval(pg_get_serial_sequence('form_submissions','id'),(SELECT MAX(id) FROM form_submissions));
SELECT setval(pg_get_serial_sequence('users','id'),           (SELECT MAX(id) FROM users));
