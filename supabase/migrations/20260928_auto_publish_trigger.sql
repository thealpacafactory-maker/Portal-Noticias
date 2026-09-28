-- Supabase Trigger: Automatic Article Publishing when domain autoPublishEnabled is true

CREATE OR REPLACE FUNCTION handle_auto_publish_article()
RETURNS TRIGGER AS $$
DECLARE
  is_auto_publish BOOLEAN;
BEGIN
  -- Fetch autoPublishEnabled from the associated domain
  SELECT "autoPublishEnabled" INTO is_auto_publish
  FROM "domains"
  WHERE id = NEW."domainId";

  -- If auto-publish is active for this domain and status is not explicitly REJECTED
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

-- Drop existing trigger if present
DROP TRIGGER IF EXISTS trigger_auto_publish_article ON "articles";

-- Attach trigger to articles table on INSERT
CREATE TRIGGER trigger_auto_publish_article
BEFORE INSERT ON "articles"
FOR EACH ROW
EXECUTE FUNCTION handle_auto_publish_article();
