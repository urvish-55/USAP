const puppeteer = require('puppeteer-core');
const path = require('path');

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1440,900', '--disable-gpu'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Get page HTML structure
  const html = await page.evaluate(() => {
    // Get all buttons
    const buttons = [...document.querySelectorAll('button')];
    return {
      title: document.title,
      buttonCount: buttons.length,
      buttons: buttons.map(b => ({
        text: b.textContent?.trim().substring(0, 50),
        class: b.className?.substring(0, 80),
      })),
      bodyText: document.body?.textContent?.substring(0, 500),
      url: window.location.href,
    };
  });
  
  console.log(JSON.stringify(html, null, 2));
  await browser.close();
}
main().catch(console.error);
