import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';
import Papa from 'papaparse';

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

export async function POST() {
  await chromium.font(
    "https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf"
  );

  const isDev = !!process.env.CHROME_EXECUTABLE_PATH;

  const csvResponse = await fetch(
    'https://mcdyyvdidqq74zwz.public.blob.vercel-storage.com/Teste%20Pr%C3%A1tico%20-%20Jo%C3%A3o%20-%20taggeamento-kdQtKZGo0gVDjPRddDh75nauB0527y.csv'
  );
  const csvText = await csvResponse.text();

  const parsedCsv = Papa.parse(csvText, { header: true });
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: isDev
      ? process.env.CHROME_EXECUTABLE_PATH
      : await chromium.executablePath(
          'https://mcdyyvdidqq74zwz.public.blob.vercel-storage.com/chromium-v131.0.1-pack.tar'
        ),
    headless: chromium.headless,
  });

  const maxParallel = 5; // Define o número máximo de processos simultâneos
  const rows = parsedCsv.data.slice(0, 10); // Limitar a quantidade de linhas para teste (ajustar conforme necessário)

  async function processBatch(batch) {
    const results = await Promise.all(
      batch.map(async (row) => {
        if (!row.dominio) return null; // Ignora entradas inválidas
        try {
          const page = await browser.newPage();
          await page.setRequestInterception(true);
          page.on('request', (req) => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
              req.abort();
            } else {
              req.continue();
            }
          });

          console.log('Processing:', row.dominio);
          await page.goto(row.dominio.split('?')[0], { waitUntil: 'domcontentloaded' });
          const payButton = await page.$('a[href*="pay"]');
          if (payButton) {
            await payButton.click();
            await page.waitForSelector('body'); // Aguarda o carregamento da nova página
          }
          const pageTitle = await page.title();
          const pageUrl = await page.url();
          await page.close();

          return { page_title: pageTitle, page_url: pageUrl };
        } catch (error) {
          console.error('Error processing:', row.dominio, error);
          return null;
        }
      })
    );
    return results.filter(Boolean); // Remove resultados nulos
  }

  async function processAllRows(rows, batchSize) {
    const results = [];
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const batchResults = await processBatch(batch);
      results.push(...batchResults);
    }
    return results;
  }

  const parsed_data = await processAllRows(rows, maxParallel);

  await browser.close();

  return Response.json({ parsed_data });
}
