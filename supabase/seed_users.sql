-- Seed Users & Ensure approvedBy column exists in articles table

-- 1. Ensure approvedBy column exists
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;

-- 2. Insert Default Editorial Users if not exist
INSERT INTO "users" ("id", "name", "email", "passwordHash", "role", "slug") VALUES
  ('user_editorial_ai', 'Redacción IA', 'ai@editorial.internal', 'hash_ai', 'REDACTOR', 'redaccion-ia'),
  ('user_mateo', 'Mateo', 'mateo@portalnoticias.com', 'admin123', 'ADMIN', 'mateo'),
  ('user_jasmine', 'Jasmine', 'jasmine@portalnoticias.com', 'editor123', 'EDITOR', 'jasmine')
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "email" = EXCLUDED."email";
