/* Script de limpieza idempotente para desarrollo
    - Borra triggers, funciones, paquetes, vistas, procedimientos
    - Borra tablas con CASCADE CONSTRAINTS
    - Borra secuencias
    Ejecutar como el mismo esquema que contiene los objetos.
*/

-- 1) Dropear triggers de fila/tabla que puedan bloquear el DROP TABLE
BEGIN
   FOR r IN (SELECT trigger_name FROM user_triggers) LOOP
      BEGIN
         EXECUTE IMMEDIATE 'DROP TRIGGER "' || r.trigger_name || '"';
      EXCEPTION WHEN OTHERS THEN
         NULL; -- ignorar si no se puede
      END;
   END LOOP;
END;
/

-- 2) Dropear funciones, procedimientos y paquetes (PL/SQL)
BEGIN
   FOR r IN (SELECT object_name, object_type FROM user_objects
                  WHERE object_type IN ('FUNCTION','PROCEDURE','PACKAGE','PACKAGE BODY')) LOOP
      BEGIN
         IF r.object_type = 'FUNCTION' THEN
            EXECUTE IMMEDIATE 'DROP FUNCTION "' || r.object_name || '"';
         ELSIF r.object_type = 'PROCEDURE' THEN
            EXECUTE IMMEDIATE 'DROP PROCEDURE "' || r.object_name || '"';
         ELSE
            EXECUTE IMMEDIATE 'DROP PACKAGE "' || r.object_name || '"';
         END IF;
      EXCEPTION WHEN OTHERS THEN
         NULL;
      END;
   END LOOP;
END;
/

-- 3) Dropear vistas
BEGIN
   FOR r IN (SELECT view_name FROM user_views) LOOP
      BEGIN
         EXECUTE IMMEDIATE 'DROP VIEW "' || r.view_name || '" CASCADE CONSTRAINTS';
      EXCEPTION WHEN OTHERS THEN
         NULL;
      END;
   END LOOP;
END;
/

-- 4) Dropear tablas (CASCADE CONSTRAINTS)
BEGIN
   FOR t IN (SELECT table_name FROM user_tables) LOOP
      BEGIN
         EXECUTE IMMEDIATE 'DROP TABLE "' || t.table_name || '" CASCADE CONSTRAINTS PURGE';
      EXCEPTION WHEN OTHERS THEN
         NULL;
      END;
   END LOOP;
END;
/

-- 5) Dropear secuencias
BEGIN
   FOR r IN (SELECT sequence_name FROM user_sequences) LOOP
      BEGIN
         EXECUTE IMMEDIATE 'DROP SEQUENCE "' || r.sequence_name || '"';
      EXCEPTION WHEN OTHERS THEN
         NULL;
      END;
   END LOOP;
END;
/

-- 6) Feedback
BEGIN
   DBMS_OUTPUT.PUT_LINE('Limpieza completada (objetos dentro del esquema borrados)');
EXCEPTION WHEN OTHERS THEN
   NULL;
END;
/

-- Nota: este script borra todo el contenido del esquema. Úsalo sólo en entornos de desarrollo.