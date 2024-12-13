import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';
import Papa from 'papaparse';
import { put as vercelBlobPut } from '@vercel/blob';

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

const fetchCsvData = async (url) => {
  const response = await fetch(url);
  const text = await response.text();

  return Papa.parse(text, { header: true }).data;
};

const initializeBrowser = async (isDev) => {
  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: isDev
      ? process.env.CHROME_EXECUTABLE_PATH
      : await chromium.executablePath(
          'https://mcdyyvdidqq74zwz.public.blob.vercel-storage.com/chromium-v131.0.1-pack.tar'
        ),
    headless: chromium.headless,
  });
};

const detectTechnology = async (page) => {
  const content = await page.content();
  const url = page.url();

  if (/wordpress|elementor/i.test(content)) return 'wordpress/elementor';
  if (/atomicat/i.test(content)) return 'atomicat';
  if (/greatsoftware|greatpages/i.test(content)) return 'greatsoftware/greatpages';
  if (/clickfunnels/i.test(content)) return 'clickfunnels';
  if (/framer/i.test(content)) return 'framer';
  if (/webflow/i.test(content)) return 'webflow';
  if (/\.hotmart\.host/i.test(url)) return 'hotmart pages';

  return '-';
};

const detectVideoPlayer = async (page) => {
  const content = await page.content();

  if (/pandavideo/i.test(content)) return 'pandavideo';
  if (/vturb|smartplayer/i.test(content)) return 'vturb';
  if (/youtube\.com|youtube-nocookie\.com/i.test(content)) return 'youtube';
  if (/vimeo\.com/i.test(content)) return 'vimeo';
  if (/vidallytics/i.test(content)) return 'vidallytics';
  if (/wistia/i.test(content)) return 'wistia';

  return '-';
};

const parseTicketValue = (value) => {
  const match = value.match(/\d{1,3}(?:\.\d{3})*,\d{2}/);

  return match ? match[0].replace(/\./g, '') : value;
};

const getTicketValue = async (page) => {
  try {
    const selectors = [
      'select[name="installment"]',
      'select[name="installments"]',
      'select[name="parcelamento"]',
      'select[name="cartao"]',
      'select[name="payment"]',
      'select[data-name="parcelamento"]',
    ];

    let ticketSelect = null;

    for (const selector of selectors) {
      ticketSelect = await page.$(selector);

      if (ticketSelect) break;
    }

    if (! ticketSelect) ticketSelect = await page.$('select');

    const isKiwify = /kiwify/i.test(page.url());

    if (isKiwify) {
      const telInput = await page.$('select[name="tel"]');
      if (telInput) {
        const ticketValue = await page.evaluate((el) => el.innerText, telInput);

        return ticketValue.split('\n').find((value) => /\d+/.test(value)) || '-';
      }
    }

    if (! ticketSelect) return '-';

    const options = await ticketSelect.$$('option');

    if (! options || options.length === 0) return '-';

    const parsedOptions = await Promise.all(
      options.map(async (option) => ({
        value: await option.evaluate((el) => el.value.trim()),
        text: await option.evaluate((el) => el.textContent.trim()),
      }))
    );

    const ticketOption = parsedOptions.find(
      (opt) => /\d+/.test(opt.text) && opt.text.includes('R$')
    );

    if (ticketOption) {
      return ticketOption.text || ticketOption.value || '-';
    }

    return parsedOptions[0]?.text || parsedOptions[0]?.value || '-';
  } catch {
    return '-';
  }
};

const processRow = async (row, browser) => {
  if (! row.dominio) {
    return { page_url: '-', technology: '-', video_player: '-', ticket: '-' };
  }

  const page = await browser.newPage();
  await page.setRequestInterception(true);

  page.on('request', (req) => {
    if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  try {
    await page.goto(row.dominio.split('?')[0], { waitUntil: 'domcontentloaded' });
    const technology = await detectTechnology(page);
    const videoPlayer = await detectVideoPlayer(page);

    const testForCheckout = (value) => /checkout|pay/i.test(value);

    const anchorElements = await page.$$('a');
    const currentUrl = page.url();

    if (! testForCheckout(currentUrl) && anchorElements) {
      const anchors = await Promise.all(anchorElements.map((el) => el.evaluate((a) => a.href)));

      const hasCheckout = anchors.some(
        (href) => testForCheckout(href)
        && ! href.includes(row.dominio.split('//')[1].split('/')[0])
      );

      if (! hasCheckout) {
        await page.close();

        return { page_url: '-', technology, video_player: '-', ticket: '-' };
      }

      const checkoutAnchor = anchors
        .find(
          (href) => testForCheckout(href)
          && ! href.includes('#checkout')
          && ! href.includes('about')
        );

      if (checkoutAnchor) {
        await page.goto(checkoutAnchor, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('body');
      }
    }

    const parsedPageUrl =
      page.url() === row.dominio || !testForCheckout(page.url())
        ? '-'
        : page.url();

    const ticket = await getTicketValue(page);
    await page.close();

    return {
      page_url: parsedPageUrl,
      technology,
      video_player: videoPlayer,
      ticket: parseTicketValue(ticket),
    };
  } catch {
    await page.close();

    return { page_url: '-', technology: '-', video_player: '-', ticket: '-' };
  }
};

const processBatch = async (batch, browser) => {
  return Promise.all(batch.map((row) => processRow(row, browser)));
};

const processAllRows = async (rows, batchSize, browser) => {
  const results = [];

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const batchResults = await processBatch(batch, browser);

    results.push(...batchResults);
  }

  return results;
};

export async function POST(request) {
  await chromium.font('https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf');

  const isDev = !! process.env.CHROME_EXECUTABLE_PATH;

  try {
    const csvText = await request.text();
    const rows = Papa.parse(csvText, { header: true }).data.slice(0, 10);

    const browser = await initializeBrowser(isDev);
    const maxParallel = 10;

    const parsedData = await processAllRows(rows, maxParallel, browser);
    await browser.close();

    const csvData = Papa.unparse(parsedData);

    const { url } = await vercelBlobPut('updated-data.csv', csvData, {
      access: 'public',
      contentType: 'text/csv',
    });

    return new Response(JSON.stringify({ file_url: url }), { status: 200 });
  } catch (error) {
    console.error(error);

    return new Response(JSON.stringify({ error: 'Failed to process and upload CSV' }), { status: 500 });
  }
}
