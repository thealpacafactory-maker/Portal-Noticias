-- Supabase Initial Schema & Setup Script for 7-Domain Editorial CMS

-- 1. Create Enums
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'REDACTOR');
CREATE TYPE "ArticleStatus" AS ENUM (
  'DETECTED', 
  'DRAFT', 
  'IN_REVIEW', 
  'CHANGES_REQUESTED', 
  'APPROVED', 
  'SCHEDULED', 
  'PUBLISHED', 
  'REJECTED', 
  'UNPUBLISHED'
);

-- 2. Domains Table
CREATE TABLE "domains" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT UNIQUE NOT NULL,
  "hostname" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "logoUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users Table
CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "supabaseUid" TEXT UNIQUE,
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT,
  "role" "Role" NOT NULL DEFAULT 'REDACTOR',
  "bio" TEXT,
  "avatarUrl" TEXT,
  "slug" TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. User Domain Access (RBAC Separation)
CREATE TABLE "user_domain_access" (
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "domainId" TEXT NOT NULL REFERENCES "domains"("id") ON DELETE CASCADE,
  PRIMARY KEY ("userId", "domainId")
);

-- 5. Categories Table
CREATE TABLE "categories" (
  "id" TEXT PRIMARY KEY,
  "domainId" TEXT NOT NULL REFERENCES "domains"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  CONSTRAINT "categories_domainId_slug_key" UNIQUE ("domainId", "slug")
);

-- 6. Articles Table
CREATE TABLE "articles" (
  "id" TEXT PRIMARY KEY,
  "domainId" TEXT NOT NULL REFERENCES "domains"("id"),
  "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "subheading" TEXT,
  "content" TEXT NOT NULL,
  "excerpt" TEXT,
  "featuredImage" TEXT,
  "featuredImageAlt" TEXT,
  "ogImage" TEXT,
  "visualType" TEXT,
  "authorId" TEXT NOT NULL REFERENCES "users"("id"),
  "reviewerId" TEXT REFERENCES "users"("id"),
  "categoryId" TEXT NOT NULL REFERENCES "categories"("id"),
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sourceName" TEXT,
  "sourceUrl" TEXT,
  "countryRegion" TEXT,
  "medicalDisclaimer" BOOLEAN NOT NULL DEFAULT false,
  "priceDataSource" TEXT,
  "seoTitle" TEXT,
  "metaDescription" TEXT,
  "canonicalUrl" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "articles_domainId_slug_key" UNIQUE ("domainId", "slug")
);

-- 7. Article Versions Table
CREATE TABLE "article_versions" (
  "id" TEXT PRIMARY KEY,
  "articleId" TEXT NOT NULL REFERENCES "articles"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "subheading" TEXT,
  "content" TEXT NOT NULL,
  "editedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Redirects Table
CREATE TABLE "redirects" (
  "id" TEXT PRIMARY KEY,
  "domainId" TEXT NOT NULL,
  "fromSlug" TEXT NOT NULL,
  "toSlug" TEXT NOT NULL,
  "articleId" TEXT NOT NULL REFERENCES "articles"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "redirects_domainId_fromSlug_key" UNIQUE ("domainId", "fromSlug")
);

-- 9. Feed Sources Table
CREATE TABLE "feed_sources" (
  "id" TEXT PRIMARY KEY,
  "domainId" TEXT NOT NULL REFERENCES "domains"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "country" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "lastChecked" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Audit Logs Table
CREATE TABLE "audit_logs" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id"),
  "action" TEXT NOT NULL,
  "details" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. Article Analytics Table
CREATE TABLE "article_analytics" (
  "id" TEXT PRIMARY KEY,
  "articleId" TEXT NOT NULL REFERENCES "articles"("id") ON DELETE CASCADE,
  "event" TEXT NOT NULL,
  "country" TEXT,
  "device" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. Insert Default Domains
INSERT INTO "domains" ("id", "code", "hostname", "name") VALUES
  ('dom_1', 'perurunning', 'perurunning.pe', 'Perú Running'),
  ('dom_2', 'themerinofactory', 'themerinofactory.com', 'The Merino Factory'),
  ('dom_3', 'maratondearequipa', 'maratondearequipa.pe', 'Maratón de Arequipa'),
  ('dom_4', 'kompressox', 'kompressox.com', 'Kompressox Health'),
  ('dom_5', 'sillaris', 'sillaris.pe', 'Sillaris Inmobiliario'),
  ('dom_6', 'maratondelima', 'maratondelima.com.pe', 'Maratón de Lima'),
  ('dom_7', 'cinefoniashow', 'cinefoniashow.com', 'Cinefonía Show');

-- 13. Enable RLS (Row Level Security)
ALTER TABLE "articles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "domains" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;

-- Allow Public Read Access to Published Articles
CREATE POLICY "Public Read Published Articles" ON "articles"
  FOR SELECT USING (status = 'PUBLISHED');

-- Allow Service Role / authenticated CMS users full access
CREATE POLICY "Service Role Full Access" ON "articles"
  FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
