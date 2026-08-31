const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const DIR = path.join(__dirname, 'output');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = 'http://127.0.0.1:3000';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function clickNav(page, text) {
  return page.evaluate((t) => {
    const btns = [...document.querySelectorAll('button')];
    for (const b of btns) {
      if (b.textContent?.trim() === t) { b.click(); return true; }
    }
    return false;
  }, text);
}

async function main() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--window-size=1440,900', '--disable-gpu'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(2000);

  // ── 01: Sign In ──
  console.log('📸 01 Sign In');
  await page.screenshot({ path: path.join(DIR, '01_signin.png') });

  // Login
  const inputs = await page.$$('input');
  await inputs[0].type('urvish');
  await inputs[1].type('urvish123');
  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Sign In'))?.click();
  });
  await sleep(3000);

  // ── 02: Dashboard ──
  console.log('📸 02 Dashboard');
  await clickNav(page, 'Dashboard');
  await sleep(1500);
  await page.screenshot({ path: path.join(DIR, '02_dashboard.png') });

  // ── 03: Targets ──
  console.log('📸 03 Targets');
  await clickNav(page, 'Targets');
  await sleep(1500);
  await page.screenshot({ path: path.join(DIR, '03_targets.png') });

  // ── 04: Scanner Configure ──
  console.log('📸 04 Scanner Configure');
  await clickNav(page, 'Vulnerability Scanner');
  await sleep(1500);
  await page.screenshot({ path: path.join(DIR, '04_scanner.png') });

  // ── 05: Scan Results (via Scan History → click completed scan) ──
  console.log('📸 05 Scan Results');
  await clickNav(page, 'Scan History');
  await sleep(1500);
  // Click the first row in the table (should be a completed scan)
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('tbody tr')];
    for (const row of rows) {
      if (row.textContent?.includes('completed')) {
        row.click();
        return true;
      }
    }
    if (rows.length > 0) rows[0].click();
    return false;
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(DIR, '05_scan_results.png') });

  // ── 06: Finding Detail (click a finding row from results) ──
  console.log('📸 06 Finding Detail');
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('tbody tr')];
    for (const row of rows) {
      if (row.textContent?.includes('SQL') || row.textContent?.includes('Critical') || row.textContent?.includes('critical')) {
        row.click();
        return true;
      }
    }
    if (rows.length > 0) rows[0].click();
    return false;
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(DIR, '06_finding_detail.png') });

  // ── 07–13: Remaining screens ──
  const screens = [
    ['Pentest Toolkit',  '07_pentest'],
    ['ML Detection',     '08_ml'],
    ['Encryptor / Decryptor', '09_encryptor'],
    ['Credential Vault', '10_vault'],
    ['Reports',          '11_reports'],
    ['Scan History',     '12_history'],
    ['Settings',         '13_settings'],
  ];

  for (const [nav, file] of screens) {
    console.log(`📸 ${file} ${nav}`);
    await clickNav(page, nav);
    await sleep(1500);
    await page.screenshot({ path: path.join(DIR, `${file}.png`) });
  }

  await browser.close();
  console.log('\n🎉 Done! All screenshots in', DIR);
}

main().catch(console.error);
