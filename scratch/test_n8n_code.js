const userHtml = `
<h3 class="entry-title td-module-title"><a href="https://runatico.com/primer-congreso-de-carreras-por-montana-del-peru-la-comunidad-del-trail-running-construye-el-futuro-del-deporte/"  rel="bookmark" title="Primer Congreso de Carreras por Montaña del Perú: la comunidad del trail running construyé el futuro del deporte" >Primer Congreso de Carreras por Montaña del Perú: la comunidad del&#8230;</a></h3>
<h3 class="entry-title td-module-title"><a href="https://runatico.com/la-ultra-trail-cordillera-blanca-cumple-11-anos-y-se-convierte-en-marca-peru/"  rel="bookmark" title="La Ultra Trail Cordillera Blanca cumple 11 años y se convierte en Marca Perú" >La Ultra Trail Cordillera Blanca cumple 11 años y se convierte&#8230;</a></h3>
`;

const items = [{ json: { data: userHtml } }];
const extractedNews = [];

for (let i = 0; i < items.length; i++) {
  const item = items[i];
  const rawData = String(item.json.data || item.json.body || item.json.response || '');
  let domainId = 'dom_3';

  // 1. INTENTAR PARSEAR COMO RSS / XML (<item>...</item>)
  const itemMatches = rawData.match(/<item>[\s\S]*?<\/item>/gi) || [];

  if (itemMatches.length > 0) {
    const limit = Math.min(itemMatches.length, 3);
    for (let j = 0; j < limit; j++) {
      const xmlItem = itemMatches[j];
      const titleMatch = xmlItem.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = xmlItem.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
      const descMatch = xmlItem.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);

      if (titleMatch && linkMatch) {
        extractedNews.push({
          json: {
            domainId: domainId,
            title: titleMatch[1].replace(/<[^>]+>/g, '').trim(),
            link: linkMatch[1].trim(),
            snippet: descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : ''
          }
        });
      }
    }
  } else {
    // 2. ES UN HTML (Scraping de Runático / WordPress Theme)
    const h3Matches = rawData.match(/<h3[^>]*class="[^"]*entry-title[^"]*"[^>]*>[\s\S]*?<\/h3>/gi) || [];
    const seenLinks = new Set();
    let count = 0;

    for (const h3Chunk of h3Matches) {
      if (count >= 3) break;

      const linkMatch = h3Chunk.match(/href="([^"]+)"/i);
      const titleAttrMatch = h3Chunk.match(/title="([^"]+)"/i);
      const innerTextMatch = h3Chunk.match(/<a[^>]*>([\s\S]*?)<\/a>/i);

      if (linkMatch) {
        const linkUrl = linkMatch[1].trim();

        if (seenLinks.has(linkUrl)) continue;
        seenLinks.add(linkUrl);

        let titleText = titleAttrMatch ? titleAttrMatch[1] : (innerTextMatch ? innerTextMatch[1] : '');
        titleText = titleText
          .replace(/<[^>]+>/g, '')
          .replace(/&#8217;/g, "'")
          .replace(/&#8220;|&#8221;/g, '"')
          .replace(/&#8230;/g, '...')
          .trim();

        if (titleText && linkUrl) {
          extractedNews.push({
            json: {
              domainId: domainId,
              title: titleText,
              link: linkUrl,
              snippet: titleText
            }
          });
          count++;
        }
      }
    }
  }
}

console.log(JSON.stringify(extractedNews, null, 2));
