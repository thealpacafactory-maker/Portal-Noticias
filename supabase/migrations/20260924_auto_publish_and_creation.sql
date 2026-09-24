-- Migration: Add autoPublishEnabled to domains table
ALTER TABLE "domains" 
ADD COLUMN IF NOT EXISTS "autoPublishEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Comment for clarity
COMMENT ON COLUMN "domains"."autoPublishEnabled" IS 'Controls whether newly created articles in this domain are automatically published without manual review';
