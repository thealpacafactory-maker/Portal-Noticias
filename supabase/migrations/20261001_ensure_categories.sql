-- Supabase Migration: Ensure default categories exist for all domains
-- Date: 2026-10-01

INSERT INTO "categories" ("id", "domainId", "name", "slug", "description")
VALUES 
  ('cat_dom_1_general', 'dom_1', 'General', 'general', 'Noticias generales de Perú Running'),
  ('cat_dom_2_general', 'dom_2', 'General', 'general', 'Noticias generales de The Merino Factory'),
  ('cat_dom_3_general', 'dom_3', 'General', 'general', 'Noticias generales de Maratón de Arequipa'),
  ('cat_dom_4_general', 'dom_4', 'General', 'general', 'Noticias generales de Kompressox Health'),
  ('cat_dom_5_general', 'dom_5', 'General', 'general', 'Noticias generales de Sillaris Inmobiliario'),
  ('cat_dom_6_general', 'dom_6', 'General', 'general', 'Noticias generales de Maratón de Lima'),
  ('cat_dom_7_general', 'dom_7', 'General', 'general', 'Noticias generales de Cinefonía Show')
ON CONFLICT ("domainId", "slug") DO NOTHING;
