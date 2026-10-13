// Adds the Cloudflare Web Analytics beacon (cookie-free; token is public) to the built web page.
const fs = require('fs');
const file = 'dist/index.html';
const snippet =
  '<!-- Cloudflare Web Analytics --><script defer src="https://static.cloudflareinsights.com/beacon.min.js" ' +
  "data-cf-beacon='{\"token\": \"894f9ee99f884b688a5de5bbe37edb90\"}'></script><!-- End Cloudflare Web Analytics -->";
let html = fs.readFileSync(file, 'utf8');
if (!html.includes('cloudflareinsights')) {
  html = html.replace('</head>', snippet + '</head>');
  fs.writeFileSync(file, html);
  console.log('Analytics beacon added to ' + file);
}
