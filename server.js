const express = require('express');
const { chromium } = require('playwright');
const app = express();
const PORT = process.env.PORT || 3000;

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// ✅ NUEVA función con reintentos para .goto()
async function safeGoto(page, url, logs) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      logs.push(`🌐 Intento ${attempt}: ${url}`);
      await page.goto(url, {
        waitUntil: 'load',       // 🔁 CAMBIO importante: ahora espera al evento 'load'
        timeout: 300000          // 🔁 CAMBIO: timeout ampliado a 5 minutos
      });
      return;
    } catch (err) {
      logs.push(`⚠️ Error intento ${attempt}: ${err.message}`);
      if (attempt === 2) throw err;
    }
  }
}

app.get('/count-badges', async (req, res) => {
  const inputUrl = req.query.url;
  if (!inputUrl || !inputUrl.startsWith('https://www.encuentra24.com')) {
    return res.status(400).send({ error: 'URL inválida' });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  let platinum = 0, gold = 0, plata = 0;
  let done = false;
  let logs = [`🔍 URL base: ${inputUrl}`];

  try {
    for (let pageNum = 1; pageNum <= 6 && !done; pageNum++) {
      const suffix = pageNum > 1 ? `.${pageNum}` : '';
      const separator = inputUrl.includes('?') ? '&' : '?';
      const url = `${inputUrl}${suffix}${separator}q=number.50`;

      logs.push(`📄 Página ${pageNum}: ${url}`);

      // ✅ USO de la nueva función con retry + timeout largo
      await safeGoto(page, url, logs);

      await page.waitForSelector('div.d3-ad-tile', { timeout: 60000 });
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1000);

      const cards = await page.$$('div.d3-ad-tile');
      logs.push(`🔹 ${cards.length} anuncios`);

      for (const card of cards) {
        const feat = await card.$('div.d3-ad-tile__feat');
        if (!feat) {
          logs.push(`⛔ Fin de destacados.`);
          done = true;
          break;
        }

        const title = (await feat.getAttribute('title') || '').toLowerCase();
        if (title.includes('platino')) platinum++;
        else if (title.includes('oro')) gold++;
        else if (title.includes('plata')) plata++;

        logs.push(`✅ Badge: ${title}`);
      }
    }
  } catch (err) {
    console.error('❌ Error interno en /count-badges:', err);
    logs.push(`❌ Error: ${err.message}`);
    await browser.close();
    return res.status(500).json({ error: err.message, logs });
  }

  await browser.close();

  logs.push(`\n🎯 Platino: ${platinum}`);
  logs.push(`🎯 Oro:     ${gold}`);
  logs.push(`🎯 Plata:   ${plata}`);
  logs.push(`📊 Total:   ${platinum + gold + plata}`);

  res.json({ platinum, gold, plata, logs });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
