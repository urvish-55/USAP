const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
  await sleep(2000);

  // Login
  const inputs = await page.$$('input');
  await inputs[0].type('urvish');
  await inputs[1].type('urvish123');
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    for (const b of btns) { if (b.textContent?.includes('Sign In')) { b.click(); return; } }
  });
  await sleep(3000);

  // Navigate to Scanner
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('nav button, nav a')];
    for (const b of btns) { if (b.textContent?.includes('Vulnerability Scanner')) { b.click(); return; } }
  });
  await sleep(2000);

  // Inspect scanner page structure
  const pageInfo = await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')];
    const clickable = all.filter(el => {
      const tag = el.tagName;
      const role = el.getAttribute('role');
      return tag === 'BUTTON' || tag === 'A' || role === 'button' || el.style?.cursor === 'pointer';
    });
    
    // Find all elements containing "completed"
    const completed = all.filter(el => el.textContent?.includes('completed') && el.children.length < 5);
    
    // Find table rows
    const rows = [...document.querySelectorAll('tr')];
    
    return {
      clickableCount: clickable.length,
      clickableTexts: clickable.slice(0, 15).map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 80),
        className: el.className?.substring(0, 60),
      })),
      completedCount: completed.length,
      completedTexts: completed.slice(0, 5).map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 80),
        className: el.className?.substring(0, 60),
      })),
      rowCount: rows.length,
      rowTexts: rows.slice(0, 3).map(r => r.textContent?.trim().substring(0, 100)),
      mainHTML: document.querySelector('main')?.innerHTML?.substring(0, 1000),
    };
  });
  
  console.log(JSON.stringify(pageInfo, null, 2));
  await browser.close();
}
main().catch(console.error);
