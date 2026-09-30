const https = require('https');

const options = {
  hostname: 'depor.com',
  path: '/vida-sana/running/',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    // Search for articles with href containing /running/ or /vida-sana/ or .html or -noticia/
    const matches = data.match(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi) || [];
    const articles = [];
    const seen = new Set();

    for (const match of matches) {
      const hrefMatch = match.match(/href="([^"]+)"/i);
      const text = match.replace(/<[^>]+>/g, '').trim();

      if (hrefMatch && text.length > 20) {
        const url = hrefMatch[1];
        if (url.includes('depor.com') || url.startsWith('/')) {
          const fullUrl = url.startsWith('/') ? 'https://depor.com' + url : url;
          if (!seen.has(fullUrl)) {
            seen.add(fullUrl);
            articles.push({ title: text, url: fullUrl });
          }
        }
      }
    }

    console.log('Found Articles Count:', articles.length);
    console.log('Sample Articles:', articles.slice(0, 10));
  });
});

req.on('error', (e) => {
  console.error(e);
});
req.end();
