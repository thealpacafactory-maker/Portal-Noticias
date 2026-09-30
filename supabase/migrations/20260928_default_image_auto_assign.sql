-- 1. Add defaultImage column to domains table
ALTER TABLE "domains" 
ADD COLUMN IF NOT EXISTS "defaultImage" TEXT;

-- 2. Populate default images for existing 7 domains
UPDATE "domains" SET "defaultImage" = 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80' WHERE id IN ('dom_1', 'dom_3', 'dom_6') AND ("defaultImage" IS NULL OR "defaultImage" = '');
UPDATE "domains" SET "defaultImage" = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80' WHERE id = 'dom_2' AND ("defaultImage" IS NULL OR "defaultImage" = '');
UPDATE "domains" SET "defaultImage" = 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80' WHERE id = 'dom_4' AND ("defaultImage" IS NULL OR "defaultImage" = '');
UPDATE "domains" SET "defaultImage" = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' WHERE id = 'dom_5' AND ("defaultImage" IS NULL OR "defaultImage" = '');
UPDATE "domains" SET "defaultImage" = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80' WHERE id = 'dom_7' AND ("defaultImage" IS NULL OR "defaultImage" = '');

-- 3. Database Trigger: Ensures NO published article is ever saved without an image
CREATE OR REPLACE FUNCTION handle_auto_publish_article()
RETURNS TRIGGER AS $$
DECLARE
  is_auto_publish BOOLEAN;
  domain_def_img TEXT;
BEGIN
  -- Fetch autoPublishEnabled and defaultImage from associated domain
  SELECT "autoPublishEnabled", "defaultImage" INTO is_auto_publish, domain_def_img
  FROM "domains"
  WHERE id = NEW."domainId";

  -- Domain fallback image if not defined
  IF domain_def_img IS NULL OR TRIM(domain_def_img) = '' THEN
    IF NEW."domainId" IN ('dom_1', 'dom_3', 'dom_6') THEN
      domain_def_img := 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80';
    ELSIF NEW."domainId" = 'dom_4' THEN
      domain_def_img := 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80';
    ELSIF NEW."domainId" = 'dom_5' THEN
      domain_def_img := 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
    ELSIF NEW."domainId" = 'dom_7' THEN
      domain_def_img := 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80';
    ELSE
      domain_def_img := 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';
    END IF;
  END IF;

  -- Auto-assign default image if featuredImage is missing or empty
  IF NEW."featuredImage" IS NULL OR TRIM(NEW."featuredImage") = '' THEN
    NEW."featuredImage" := domain_def_img;
  END IF;

  IF NEW."ogImage" IS NULL OR TRIM(NEW."ogImage") = '' THEN
    NEW."ogImage" := NEW."featuredImage";
  END IF;

  -- Auto-publish logic if enabled
  IF is_auto_publish = true AND NEW.status != 'REJECTED' THEN
    NEW.status := 'PUBLISHED';
    
    IF NEW."publishedAt" IS NULL THEN
      NEW."publishedAt" := NOW();
    END IF;

    IF NEW."approvedBy" IS NULL THEN
      NEW."approvedBy" := 'Sistema (Autopublicado)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to articles table on INSERT or UPDATE
DROP TRIGGER IF EXISTS trigger_auto_publish_article ON "articles";

CREATE TRIGGER trigger_auto_publish_article
BEFORE INSERT OR UPDATE ON "articles"
FOR EACH ROW
EXECUTE FUNCTION handle_auto_publish_article();

-- Retroactively fix any existing published articles that are missing images
UPDATE "articles" a
SET "featuredImage" = COALESCE(d."defaultImage", 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80'),
    "ogImage" = COALESCE(d."defaultImage", 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80')
FROM "domains" d
WHERE a."domainId" = d.id AND (a."featuredImage" IS NULL OR TRIM(a."featuredImage") = '');
