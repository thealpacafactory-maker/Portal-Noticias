-- Supabase Migration: Projects and Domain Grouping Hierarchy
-- Date: 2026-09-30

-- 1. Create Projects Table
CREATE TABLE IF NOT EXISTS "projects" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "logoUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add projectId column to domains table
ALTER TABLE "domains" 
ADD COLUMN IF NOT EXISTS "projectId" TEXT REFERENCES "projects"("id") ON DELETE SET NULL;

-- 3. Insert Default Project: León del Sur
INSERT INTO "projects" ("id", "code", "name", "description") 
VALUES (
  'proj_leondelsur', 
  'leondelsur', 
  'León del Sur', 
  'Proyecto Portal Noticias León del Sur y subdominios regionales'
)
ON CONFLICT ("id") DO NOTHING;

-- 4. Enable RLS on projects
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Projects" ON "projects"
  FOR SELECT USING (true);

CREATE POLICY "Service Role Full Access Projects" ON "projects"
  FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
