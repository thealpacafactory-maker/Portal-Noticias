-- Seed Initial RSS Feed Sources for the 7 Web Domains

INSERT INTO "feed_sources" ("id", "domainId", "name", "url", "country", "active") VALUES
  -- 1. perurunning.pe (Running Perú, LATAM, Int'l)
  ('src_pr_1', 'dom_1', 'World Athletics News', 'https://worldathletics.org/rss/news', 'Global', true),
  ('src_pr_2', 'dom_1', 'Runner''s World España', 'https://www.runnersworld.com/es/rss/all.xml/', 'España', true),
  ('src_pr_3', 'dom_1', 'Runfitners LATAM', 'https://runfitners.com/feed/', 'LATAM', true),
  ('src_pr_4', 'dom_1', 'IPD Perú Deportes', 'https://www.ipd.gob.pe/noticias?format=feed&type=rss', 'Perú', true),

  -- 2. themerinofactory.com (Merino Wool B2B & Sourcing)
  ('src_tmf_1', 'dom_2', 'Sourcing Journal', 'https://sourcingjournal.com/feed/', 'USA', true),
  ('src_tmf_2', 'dom_2', 'Innovation in Textiles', 'https://www.innovationintextiles.com/rss/', 'Europa', true),
  ('src_tmf_3', 'dom_2', 'Textile World News', 'https://www.textileworld.com/feed/', 'Global', true),
  ('src_tmf_4', 'dom_2', 'Woolmark Industry News', 'https://www.woolmark.com/news/rss', 'Australia', true),

  -- 3. maratondearequipa.pe (Running Arequipa & Peru)
  ('src_mda_1', 'dom_3', 'Diario El Pueblo Arequipa Deportes', 'https://elpueblo.pe/category/deportes/feed/', 'Perú (Arequipa)', true),
  ('src_mda_2', 'dom_3', 'Perú Runners Noticias', 'https://perurunners.com/feed/', 'Perú', true),
  ('src_mda_3', 'dom_3', 'World Athletics News', 'https://worldathletics.org/rss/news', 'Global', true),

  -- 4. kompressox.com (Salud Médica & Compresión)
  ('src_kom_1', 'dom_4', 'Harvard Health Blog', 'https://www.health.harvard.edu/blog/feed', 'USA', true),
  ('src_kom_2', 'dom_4', 'MedlinePlus Noticias de Salud', 'https://medlineplus.gov/spanish/feeds/news_spanish.xml', 'USA/LATAM', true),
  ('src_kom_3', 'dom_4', 'Medical News Today', 'https://www.medicalnewstoday.com/rss/featurednews.xml', 'Global', true),

  -- 5. sillaris.pe (Inmuebles & Tendencias Arequipa/Lima)
  ('src_sil_1', 'dom_5', 'BCRP Notas de Prensa Economía', 'https://www.bcrp.gob.pe/rss/notas-de-prensa.xml', 'Perú', true),
  ('src_sil_2', 'dom_5', 'El Comercio Economía y Propiedades', 'https://elcomercio.pe/arc/outboundfeeds/rss/category/economia/', 'Perú', true),
  ('src_sil_3', 'dom_5', 'Gestión Inmobiliario', 'https://gestion.pe/arc/outboundfeeds/rss/category/tu-dinero/inmobiliarias/', 'Perú', true),

  -- 6. maratondelima.com.pe (Running Lima & Maratón)
  ('src_mdl_1', 'dom_6', 'Perú Runners Calendario', 'https://perurunners.com/feed/', 'Perú', true),
  ('src_mdl_2', 'dom_6', 'Consudatle Sudamérica Atletismo', 'https://www.consudatle.org/feed/', 'LATAM', true),
  ('src_mdl_3', 'dom_6', 'Runner''s World Noticias', 'https://www.runnersworld.com/es/rss/all.xml/', 'España/Global', true),

  -- 7. cinefoniashow.com (Música de Cine & Clásica)
  ('src_cin_1', 'dom_7', 'Film Music Reporter', 'https://filmmusicreporter.com/feed/', 'USA/Global', true),
  ('src_cin_2', 'dom_7', 'Classic FM News', 'https://www.classicfm.com/rss/news/', 'Europa', true),
  ('src_cin_3', 'dom_7', 'Scherzo Revista de Música', 'https://scherzo.es/feed/', 'España', true),
  ('src_cin_4', 'dom_7', 'Gran Teatro Nacional del Perú', 'https://www.granteatronacional.pe/noticias/rss', 'Perú', true)
ON CONFLICT ("id") DO NOTHING;
