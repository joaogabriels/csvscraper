import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

export async function POST() {
  await chromium.font(
    "https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf"
  );

  const isDev = !! process.env.CHROME_EXECUTABLE_PATH;

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: isDev ? process.env.CHROME_EXECUTABLE_PATH : await chromium.executablePath('https://mcdyyvdidqq74zwz.public.blob.vercel-storage.com/chromium-v131.0.1-pack.tar'),
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.goto("https://example.com");
  const pageTitle = await page.title();
  await browser.close();

  console.log(pageTitle);

  return Response.json({ message: 'Hello from CSV Scraper' + pageTitle });
}